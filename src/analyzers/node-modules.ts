/**
 * Node modules scanner - scans installed packages for slow dependencies
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { PackageAnalysis, PackageJson, SlowReason } from '../types/index.js';
import { findSlowPackage } from '../database/slow-packages.js';

interface NodeModulesPackage {
  name: string;
  version: string;
  size: number; // in bytes
  hasPostinstall: boolean;
  hasNodeGyp: boolean;
  path: string;
}

/**
 * Scans node_modules directory for all installed packages
 */
export function scanNodeModules(projectPath: string): NodeModulesPackage[] {
  const nodeModulesPath = join(projectPath, 'node_modules');

  if (!existsSync(nodeModulesPath)) {
    return [];
  }

  const packages: NodeModulesPackage[] = [];

  // Scan top-level packages
  const entries = readdirSync(nodeModulesPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) {
      continue;
    }

    // Handle scoped packages (@org/package)
    if (entry.name.startsWith('@')) {
      const scopePath = join(nodeModulesPath, entry.name);
      const scopedEntries = readdirSync(scopePath, { withFileTypes: true });

      for (const scopedEntry of scopedEntries) {
        if (scopedEntry.isDirectory()) {
          const pkgPath = join(scopePath, scopedEntry.name);
          const pkg = parsePackage(pkgPath, `${entry.name}/${scopedEntry.name}`);
          if (pkg) packages.push(pkg);
        }
      }
    } else {
      const pkgPath = join(nodeModulesPath, entry.name);
      const pkg = parsePackage(pkgPath, entry.name);
      if (pkg) packages.push(pkg);
    }
  }

  return packages;
}

/**
 * Parses a package directory
 */
function parsePackage(pkgPath: string, name: string): NodeModulesPackage | null {
  const packageJsonPath = join(pkgPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson: PackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    const hasPostinstall = !!(
      packageJson.scripts?.postinstall ||
      packageJson.scripts?.install ||
      packageJson.scripts?.preinstall
    );

    const hasNodeGyp = !!(
      packageJson.dependencies?.['node-gyp'] ||
      packageJson.devDependencies?.['node-gyp'] ||
      existsSync(join(pkgPath, 'binding.gyp'))
    );

    const size = getDirectorySize(pkgPath);

    return {
      name,
      version: packageJson.version || '0.0.0',
      size,
      hasPostinstall,
      hasNodeGyp,
      path: pkgPath,
    };
  } catch {
    return null;
  }
}

/**
 * Gets approximate directory size (samples for performance)
 */
function getDirectorySize(dirPath: string): number {
  let size = 0;

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries.slice(0, 100)) { // Sample first 100 entries
      const fullPath = join(dirPath, entry.name);

      if (entry.isFile()) {
        try {
          size += statSync(fullPath).size;
        } catch {
          // Skip inaccessible files
        }
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        size += getDirectorySize(fullPath);
      }
    }
  } catch {
    // Skip inaccessible directories
  }

  return size;
}

/**
 * Analyzes node_modules for slow packages
 */
export function analyzeNodeModules(projectPath: string, thresholdSeconds: number = 5): PackageAnalysis[] {
  const packages = scanNodeModules(projectPath);
  const slowPackages: PackageAnalysis[] = [];

  for (const pkg of packages) {
    // Check if it's a known slow package
    const slowInfo = findSlowPackage(pkg.name);

    if (slowInfo && slowInfo.estimatedTime >= thresholdSeconds) {
      slowPackages.push({
        name: pkg.name,
        version: pkg.version,
        isSlowPackage: true,
        estimatedTime: slowInfo.estimatedTime,
        reason: slowInfo.reason,
        alternative: slowInfo.alternative,
        note: slowInfo.note,
        hasPostinstall: pkg.hasPostinstall,
      });
      continue;
    }

    // Dynamic detection: check for node-gyp (native compilation)
    if (pkg.hasNodeGyp) {
      slowPackages.push({
        name: pkg.name,
        version: pkg.version,
        isSlowPackage: true,
        estimatedTime: 10, // Default estimate for native modules
        reason: 'native-compilation',
        note: 'Contains native bindings (detected binding.gyp or node-gyp dependency)',
        hasPostinstall: pkg.hasPostinstall,
      });
      continue;
    }

    // Dynamic detection: large packages with postinstall
    if (pkg.hasPostinstall && pkg.size > 10 * 1024 * 1024) { // > 10MB
      slowPackages.push({
        name: pkg.name,
        version: pkg.version,
        isSlowPackage: true,
        estimatedTime: Math.ceil(pkg.size / (5 * 1024 * 1024)), // ~1s per 5MB
        reason: 'postinstall',
        note: 'Has postinstall script and large package size',
        hasPostinstall: true,
      });
    }
  }

  return slowPackages.sort((a, b) => (b.estimatedTime || 0) - (a.estimatedTime || 0));
}

/**
 * Gets size statistics for node_modules
 */
export function getNodeModulesStats(projectPath: string): {
  totalPackages: number;
  totalSize: number;
  largestPackages: Array<{ name: string; size: number }>;
} {
  const packages = scanNodeModules(projectPath);

  const sorted = [...packages].sort((a, b) => b.size - a.size);

  return {
    totalPackages: packages.length,
    totalSize: packages.reduce((sum, pkg) => sum + pkg.size, 0),
    largestPackages: sorted.slice(0, 10).map(pkg => ({
      name: pkg.name,
      size: pkg.size,
    })),
  };
}
