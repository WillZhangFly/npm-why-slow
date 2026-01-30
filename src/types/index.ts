/**
 * Reason why a package is slow to install
 */
export type SlowReason =
  | 'postinstall'
  | 'binary-download'
  | 'native-compilation'
  | 'large-deps';

/**
 * Information about a slow package
 */
export interface SlowPackageInfo {
  name: string;
  reason: SlowReason;
  estimatedTime: number; // in seconds
  alternative?: string;
  note?: string;
}

/**
 * Analysis result for a single package
 */
export interface PackageAnalysis {
  name: string;
  version?: string;
  isSlowPackage: boolean;
  estimatedTime?: number;
  reason?: SlowReason;
  alternative?: string;
  note?: string;
  hasPostinstall?: boolean;
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  totalPackages: number;
  slowPackages: PackageAnalysis[];
  estimatedTotalTime: number; // in seconds
  potentialSavings: number; // in seconds
  suggestions: Suggestion[];
}

/**
 * Optimization suggestion
 */
export interface Suggestion {
  type: 'replace' | 'remove' | 'optimize';
  packageName: string;
  currentTime: number; // in seconds
  suggestion: string;
  potentialSavings: number; // in seconds
  priority: 'high' | 'medium' | 'low';
}

/**
 * CLI options
 */
export interface CliOptions {
  path: string;
  json: boolean;
  all: boolean;
  threshold: number; // in seconds
}

/**
 * Package.json structure (simplified)
 */
export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

/**
 * Package-lock.json package entry (simplified)
 */
export interface LockFilePackage {
  version: string;
  resolved?: string;
  integrity?: string;
  hasInstallScript?: boolean;
  dependencies?: Record<string, string>;
}
