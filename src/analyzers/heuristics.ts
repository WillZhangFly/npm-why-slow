import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type {
  PackageAnalysis,
  AnalysisResult,
  Suggestion,
  PackageJson,
} from '../types/index.js';
import { findSlowPackage, isKnownSlowPackage } from '../database/slow-packages.js';

/**
 * Analyzes a project using heuristics to identify slow packages
 */
export async function analyzeProject(projectPath: string, thresholdSeconds: number = 5): Promise<AnalysisResult> {
  const packageJsonPath = join(projectPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in ${projectPath}`);
  }

  const packageJson: PackageJson = JSON.parse(
    readFileSync(packageJsonPath, 'utf-8')
  );

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.optionalDependencies,
  };

  const packageNames = Object.keys(allDeps);
  const slowPackages: PackageAnalysis[] = [];
  let estimatedTotalTime = 0;

  // Analyze each package
  for (const pkgName of packageNames) {
    const slowInfo = findSlowPackage(pkgName);

    if (slowInfo && slowInfo.estimatedTime >= thresholdSeconds) {
      const analysis: PackageAnalysis = {
        name: pkgName,
        version: allDeps[pkgName],
        isSlowPackage: true,
        estimatedTime: slowInfo.estimatedTime,
        reason: slowInfo.reason,
        alternative: slowInfo.alternative,
        note: slowInfo.note,
      };

      slowPackages.push(analysis);
      estimatedTotalTime += slowInfo.estimatedTime;
    }
  }

  // Sort by estimated time (descending)
  slowPackages.sort((a, b) => (b.estimatedTime || 0) - (a.estimatedTime || 0));

  // Generate suggestions
  const suggestions = generateSuggestions(slowPackages);

  // Calculate potential savings
  const potentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);

  return {
    totalPackages: packageNames.length,
    slowPackages,
    estimatedTotalTime,
    potentialSavings,
    suggestions,
  };
}

/**
 * Generates optimization suggestions
 */
function generateSuggestions(slowPackages: PackageAnalysis[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const pkg of slowPackages) {
    if (!pkg.alternative && !pkg.note) {
      continue;
    }

    if (pkg.alternative) {
      // Replacement suggestion
      suggestions.push({
        type: 'replace',
        packageName: pkg.name,
        currentTime: pkg.estimatedTime || 0,
        suggestion: `Replace ${pkg.name} → ${pkg.alternative}`,
        potentialSavings: pkg.estimatedTime || 0,
        priority: getPriority(pkg.estimatedTime || 0),
      });
    } else if (pkg.note) {
      // Optimization suggestion
      suggestions.push({
        type: 'optimize',
        packageName: pkg.name,
        currentTime: pkg.estimatedTime || 0,
        suggestion: pkg.note,
        potentialSavings: Math.floor((pkg.estimatedTime || 0) * 0.5), // Conservative estimate
        priority: getPriority(pkg.estimatedTime || 0),
      });
    }
  }

  // Sort by priority and potential savings
  suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.potentialSavings - a.potentialSavings;
  });

  return suggestions;
}

/**
 * Determines priority based on time savings
 */
function getPriority(timeSeconds: number): 'high' | 'medium' | 'low' {
  if (timeSeconds >= 20) return 'high';
  if (timeSeconds >= 10) return 'medium';
  return 'low';
}
