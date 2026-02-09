/**
 * Lockfile analyzer - parses package-lock.json and yarn.lock
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { PackageAnalysis, LockFilePackage } from '../types/index.js';
import { findSlowPackage } from '../database/slow-packages.js';

interface PackageLockJson {
  name?: string;
  version?: string;
  lockfileVersion?: number;
  packages?: Record<string, LockFilePackage>;
  dependencies?: Record<string, LockFilePackage>;
}

interface LockfileAnalysis {
  lockfileType: 'npm' | 'yarn' | 'pnpm' | 'none';
  lockfileVersion?: number;
  totalDependencies: number;
  packagesWithInstallScripts: string[];
  slowPackages: PackageAnalysis[];
}

/**
 * Analyzes lockfile for slow packages and install scripts
 */
export function analyzeLockfile(projectPath: string, thresholdSeconds: number = 5): LockfileAnalysis {
  // Try package-lock.json first
  const npmLockPath = join(projectPath, 'package-lock.json');
  if (existsSync(npmLockPath)) {
    return analyzeNpmLockfile(npmLockPath, thresholdSeconds);
  }

  // Try yarn.lock
  const yarnLockPath = join(projectPath, 'yarn.lock');
  if (existsSync(yarnLockPath)) {
    return analyzeYarnLockfile(yarnLockPath, thresholdSeconds);
  }

  // Try pnpm-lock.yaml
  const pnpmLockPath = join(projectPath, 'pnpm-lock.yaml');
  if (existsSync(pnpmLockPath)) {
    return {
      lockfileType: 'pnpm',
      totalDependencies: 0,
      packagesWithInstallScripts: [],
      slowPackages: [],
    };
  }

  return {
    lockfileType: 'none',
    totalDependencies: 0,
    packagesWithInstallScripts: [],
    slowPackages: [],
  };
}

/**
 * Analyzes npm package-lock.json
 */
function analyzeNpmLockfile(lockfilePath: string, thresholdSeconds: number): LockfileAnalysis {
  const content = readFileSync(lockfilePath, 'utf-8');
  const lockfile: PackageLockJson = JSON.parse(content);

  const slowPackages: PackageAnalysis[] = [];
  const packagesWithInstallScripts: string[] = [];
  let totalDependencies = 0;

  // Handle lockfileVersion 2 and 3 (packages field)
  if (lockfile.packages) {
    for (const [pkgPath, pkg] of Object.entries(lockfile.packages)) {
      if (pkgPath === '') continue; // Skip root

      totalDependencies++;

      // Extract package name from path
      const name = extractPackageName(pkgPath);
      if (!name) continue;

      // Check for install scripts
      if (pkg.hasInstallScript) {
        packagesWithInstallScripts.push(name);
      }

      // Check if known slow package
      const slowInfo = findSlowPackage(name);
      if (slowInfo && slowInfo.estimatedTime >= thresholdSeconds) {
        slowPackages.push({
          name,
          version: pkg.version,
          isSlowPackage: true,
          estimatedTime: slowInfo.estimatedTime,
          reason: slowInfo.reason,
          alternative: slowInfo.alternative,
          note: slowInfo.note,
          hasPostinstall: pkg.hasInstallScript,
        });
      }
    }
  }

  // Handle lockfileVersion 1 (dependencies field)
  else if (lockfile.dependencies) {
    analyzeNpmDependencies(lockfile.dependencies, '', slowPackages, packagesWithInstallScripts, thresholdSeconds);
    totalDependencies = countDependencies(lockfile.dependencies);
  }

  return {
    lockfileType: 'npm',
    lockfileVersion: lockfile.lockfileVersion,
    totalDependencies,
    packagesWithInstallScripts,
    slowPackages: slowPackages.sort((a, b) => (b.estimatedTime || 0) - (a.estimatedTime || 0)),
  };
}

/**
 * Recursively analyzes npm dependencies (lockfileVersion 1)
 */
function analyzeNpmDependencies(
  deps: Record<string, LockFilePackage>,
  prefix: string,
  slowPackages: PackageAnalysis[],
  installScripts: string[],
  threshold: number
): void {
  for (const [name, pkg] of Object.entries(deps)) {
    const fullName = prefix ? `${prefix}/${name}` : name;

    if (pkg.hasInstallScript) {
      installScripts.push(name);
    }

    const slowInfo = findSlowPackage(name);
    if (slowInfo && slowInfo.estimatedTime >= threshold) {
      // Avoid duplicates
      if (!slowPackages.some(p => p.name === name)) {
        slowPackages.push({
          name,
          version: pkg.version,
          isSlowPackage: true,
          estimatedTime: slowInfo.estimatedTime,
          reason: slowInfo.reason,
          alternative: slowInfo.alternative,
          note: slowInfo.note,
          hasPostinstall: pkg.hasInstallScript,
        });
      }
    }

    // Recurse into nested dependencies
    if (pkg.dependencies) {
      analyzeNpmDependencies(pkg.dependencies, fullName, slowPackages, installScripts, threshold);
    }
  }
}

/**
 * Counts total dependencies recursively
 */
function countDependencies(deps: Record<string, LockFilePackage>): number {
  let count = Object.keys(deps).length;

  for (const pkg of Object.values(deps)) {
    if (pkg.dependencies) {
      count += countDependencies(pkg.dependencies);
    }
  }

  return count;
}

/**
 * Extracts package name from lockfile path
 */
function extractPackageName(pkgPath: string): string | null {
  // node_modules/@scope/package or node_modules/package
  const match = pkgPath.match(/node_modules\/(.+)/);
  if (!match) return null;

  const segments = match[1].split('/node_modules/');
  return segments[segments.length - 1];
}

/**
 * Analyzes yarn.lock (basic parsing)
 */
function analyzeYarnLockfile(lockfilePath: string, thresholdSeconds: number): LockfileAnalysis {
  const content = readFileSync(lockfilePath, 'utf-8');
  const lines = content.split('\n');

  const slowPackages: PackageAnalysis[] = [];
  const packages = new Set<string>();

  // Simple yarn.lock parsing - extract package names
  for (const line of lines) {
    // Match package declarations like: "package@version":
    const match = line.match(/^"?(@?[^@\s"]+)@/);
    if (match) {
      const name = match[1];
      packages.add(name);

      const slowInfo = findSlowPackage(name);
      if (slowInfo && slowInfo.estimatedTime >= thresholdSeconds) {
        if (!slowPackages.some(p => p.name === name)) {
          slowPackages.push({
            name,
            isSlowPackage: true,
            estimatedTime: slowInfo.estimatedTime,
            reason: slowInfo.reason,
            alternative: slowInfo.alternative,
            note: slowInfo.note,
          });
        }
      }
    }
  }

  return {
    lockfileType: 'yarn',
    totalDependencies: packages.size,
    packagesWithInstallScripts: [], // Not available in yarn.lock
    slowPackages: slowPackages.sort((a, b) => (b.estimatedTime || 0) - (a.estimatedTime || 0)),
  };
}

/**
 * Gets dependency tree depth
 */
export function getLockfileStats(projectPath: string): {
  lockfileType: string;
  totalDeps: number;
  installScriptCount: number;
} {
  const analysis = analyzeLockfile(projectPath, 0);

  return {
    lockfileType: analysis.lockfileType,
    totalDeps: analysis.totalDependencies,
    installScriptCount: analysis.packagesWithInstallScripts.length,
  };
}
