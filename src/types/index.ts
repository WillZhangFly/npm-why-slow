/**
 * Reason why a package is slow to install
 */
export type SlowReason =
  | 'postinstall'
  | 'binary-download'
  | 'native-compilation'
  | 'large-deps'
  | 'measured';

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
  // Extended stats
  nodeModulesStats?: {
    totalSize: number;
    largestPackages: Array<{ name: string; size: number }>;
  };
  lockfileStats?: {
    lockfileType: string;
    totalDeps: number;
    installScriptCount: number;
  };
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
  deep: boolean; // scan node_modules
  measure: boolean; // actually time installs
  badge: boolean; // generate badge
  ci: boolean; // CI-friendly output
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
  dependencies?: Record<string, LockFilePackage>;
}
