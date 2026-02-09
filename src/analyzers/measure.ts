/**
 * Measurement mode - actually times package installations
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { PackageAnalysis } from '../types/index.js';

interface MeasurementResult {
  name: string;
  version: string;
  installTime: number; // in seconds
  size: number; // in bytes
  success: boolean;
  error?: string;
}

interface MeasurementOptions {
  packages: string[];
  timeout?: number; // in ms, default 60000
  onProgress?: (pkg: string, index: number, total: number) => void;
}

/**
 * Measures actual install time for packages
 * WARNING: This is slow - installs each package separately
 */
export async function measurePackages(options: MeasurementOptions): Promise<MeasurementResult[]> {
  const { packages, timeout = 60000, onProgress } = options;
  const results: MeasurementResult[] = [];

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    onProgress?.(pkg, i, packages.length);

    const result = await measureSinglePackage(pkg, timeout);
    results.push(result);
  }

  return results.sort((a, b) => b.installTime - a.installTime);
}

/**
 * Measures install time for a single package
 */
async function measureSinglePackage(packageName: string, timeout: number): Promise<MeasurementResult> {
  const tmpDir = mkdtempSync(join(tmpdir(), 'npm-why-slow-'));

  try {
    // Create minimal package.json
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({
      name: 'measure-temp',
      version: '1.0.0',
      private: true,
    }));

    // Time the install
    const startTime = Date.now();

    await new Promise<void>((resolve, reject) => {
      const child = spawn('npm', ['install', packageName, '--no-audit', '--no-fund', '--ignore-scripts'], {
        cwd: tmpDir,
        stdio: 'pipe',
        shell: true,
      });

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('Timeout'));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Exit code ${code}`));
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    const installTime = (Date.now() - startTime) / 1000;

    // Get installed size
    const size = getDirectorySize(join(tmpDir, 'node_modules'));

    // Extract version from installed package
    let version = 'unknown';
    try {
      const pkgJsonPath = join(tmpDir, 'node_modules', packageName.startsWith('@') ? packageName : packageName, 'package.json');
      if (existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(require('fs').readFileSync(pkgJsonPath, 'utf-8'));
        version = pkgJson.version || 'unknown';
      }
    } catch {
      // Ignore version extraction errors
    }

    return {
      name: packageName,
      version,
      installTime: Math.round(installTime * 10) / 10,
      size,
      success: true,
    };

  } catch (error: any) {
    return {
      name: packageName,
      version: 'unknown',
      installTime: 0,
      size: 0,
      success: false,
      error: error.message,
    };
  } finally {
    // Cleanup
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Gets directory size recursively
 */
function getDirectorySize(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;

  let size = 0;

  try {
    const result = execSync(`du -sk "${dirPath}" 2>/dev/null || echo "0"`, { encoding: 'utf-8' });
    const match = result.match(/^(\d+)/);
    if (match) {
      size = parseInt(match[1], 10) * 1024; // Convert KB to bytes
    }
  } catch {
    // Fallback: return 0
  }

  return size;
}

/**
 * Converts measurement results to package analysis format
 */
export function measurementToAnalysis(results: MeasurementResult[], thresholdSeconds: number): PackageAnalysis[] {
  return results
    .filter(r => r.success && r.installTime >= thresholdSeconds)
    .map(r => ({
      name: r.name,
      version: r.version,
      isSlowPackage: true,
      estimatedTime: r.installTime,
      reason: 'measured' as any,
      note: `Measured install time: ${r.installTime}s, Size: ${formatBytes(r.size)}`,
    }));
}

/**
 * Formats bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Quick measure for top N packages from heuristics
 */
export async function measureTopPackages(
  packages: PackageAnalysis[],
  limit: number = 5,
  onProgress?: (pkg: string, index: number, total: number) => void
): Promise<MeasurementResult[]> {
  const topPackages = packages.slice(0, limit).map(p => p.name);

  return measurePackages({
    packages: topPackages,
    onProgress,
  });
}
