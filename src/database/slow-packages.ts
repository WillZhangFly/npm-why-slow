import type { SlowPackageInfo } from '../types/index.js';

/**
 * Database of known slow packages with install time estimates
 * Based on research and community knowledge
 */
export const SLOW_PACKAGES: SlowPackageInfo[] = [
  // Binary Downloads - Download large binaries
  {
    name: 'puppeteer',
    reason: 'binary-download',
    estimatedTime: 45,
    alternative: 'puppeteer-core',
    note: 'Downloads Chromium browser (~150MB). Use puppeteer-core and provide your own browser.',
  },
  {
    name: 'playwright',
    reason: 'binary-download',
    estimatedTime: 30,
    note: 'Downloads browser binaries for Chromium, Firefox, and WebKit',
  },
  {
    name: 'electron',
    reason: 'binary-download',
    estimatedTime: 40,
    note: 'Large binary download (~100MB)',
  },
  {
    name: 'cypress',
    reason: 'binary-download',
    estimatedTime: 35,
    note: 'Downloads Cypress binary (~100MB)',
  },

  // Native Compilation - Require compiling native code
  {
    name: '@tensorflow/tfjs-node',
    reason: 'native-compilation',
    estimatedTime: 30,
    alternative: '@tensorflow/tfjs',
    note: 'Compiles native TensorFlow bindings. Use pure JS version if GPU not needed.',
  },
  {
    name: 'sharp',
    reason: 'native-compilation',
    estimatedTime: 12,
    alternative: 'jimp',
    note: 'Requires libvips compilation. jimp is pure JS but slower at runtime.',
  },
  {
    name: 'node-sass',
    reason: 'native-compilation',
    estimatedTime: 15,
    alternative: 'sass',
    note: 'DEPRECATED. Use Dart Sass (sass package) which is pure JS.',
  },
  {
    name: 'grpc',
    reason: 'native-compilation',
    estimatedTime: 20,
    alternative: '@grpc/grpc-js',
    note: 'Native addon. @grpc/grpc-js is pure JS implementation.',
  },
  {
    name: 'sqlite3',
    reason: 'native-compilation',
    estimatedTime: 10,
    alternative: 'better-sqlite3',
    note: 'Requires native compilation',
  },
  {
    name: 'bcrypt',
    reason: 'native-compilation',
    estimatedTime: 8,
    alternative: 'bcryptjs',
    note: 'Native addon. bcryptjs is pure JS (slower but no compilation).',
  },
  {
    name: 'node-gyp',
    reason: 'native-compilation',
    estimatedTime: 10,
    note: 'Build tool for native addons',
  },
  {
    name: 'canvas',
    reason: 'native-compilation',
    estimatedTime: 15,
    note: 'Requires Cairo graphics library compilation',
  },

  // Large Dependency Trees
  {
    name: 'aws-sdk',
    reason: 'large-deps',
    estimatedTime: 20,
    alternative: '@aws-sdk/client-*',
    note: 'Massive package with all AWS services. Use modular @aws-sdk/client-* packages.',
  },
  {
    name: '@angular/cli',
    reason: 'large-deps',
    estimatedTime: 25,
    note: 'Large dependency tree with many packages',
  },
  {
    name: 'webpack',
    reason: 'large-deps',
    estimatedTime: 10,
    note: 'Large package with many dependencies',
  },

  // Postinstall Scripts
  {
    name: 'selenium-webdriver',
    reason: 'postinstall',
    estimatedTime: 8,
    note: 'Downloads browser drivers in postinstall',
  },
  {
    name: 'chromedriver',
    reason: 'binary-download',
    estimatedTime: 10,
    note: 'Downloads ChromeDriver binary',
  },
  {
    name: 'geckodriver',
    reason: 'binary-download',
    estimatedTime: 8,
    note: 'Downloads GeckoDriver binary',
  },
];

/**
 * Finds slow package information by package name
 */
export function findSlowPackage(packageName: string): SlowPackageInfo | undefined {
  return SLOW_PACKAGES.find(pkg => pkg.name === packageName);
}

/**
 * Checks if a package is known to be slow
 */
export function isKnownSlowPackage(packageName: string): boolean {
  return SLOW_PACKAGES.some(pkg => pkg.name === packageName);
}

/**
 * Gets all packages matching a reason
 */
export function getPackagesByReason(reason: string): SlowPackageInfo[] {
  return SLOW_PACKAGES.filter(pkg => pkg.reason === reason);
}
