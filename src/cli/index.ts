#!/usr/bin/env node

import { existsSync } from 'fs';
import { resolve } from 'path';
import ora from 'ora';
import { parseArgs } from './args.js';
import { analyzeProject } from '../analyzers/heuristics.js';
import { analyzeNodeModules, getNodeModulesStats } from '../analyzers/node-modules.js';
import { analyzeLockfile, getLockfileStats } from '../analyzers/lockfile.js';
import { measureTopPackages, measurementToAnalysis } from '../analyzers/measure.js';
import { generateBadgeSnippets, generateCIReport } from '../utils/badge.js';
import { displayResults, displayJSON, displayError, displayBadge, displayMeasureProgress } from './output.js';
import type { AnalysisResult, PackageAnalysis, Suggestion } from '../types/index.js';

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  try {
    // Parse arguments
    const options = parseArgs();

    // Validate project path
    const projectPath = resolve(options.path);

    if (!existsSync(projectPath)) {
      displayError(`Project directory not found: ${projectPath}`);
      process.exit(1);
    }

    let result: AnalysisResult;

    // Start with basic heuristics analysis
    result = await analyzeProject(projectPath, options.threshold);

    // Deep scan mode: also scan node_modules
    if (options.deep) {
      const spinner = ora('Scanning node_modules...').start();

      try {
        const nodeModulesPackages = analyzeNodeModules(projectPath, options.threshold);
        const lockfileAnalysis = analyzeLockfile(projectPath, options.threshold);

        // Merge results (avoid duplicates)
        const existingNames = new Set(result.slowPackages.map(p => p.name));

        for (const pkg of nodeModulesPackages) {
          if (!existingNames.has(pkg.name)) {
            result.slowPackages.push(pkg);
            result.estimatedTotalTime += pkg.estimatedTime || 0;
          }
        }

        for (const pkg of lockfileAnalysis.slowPackages) {
          if (!existingNames.has(pkg.name)) {
            result.slowPackages.push(pkg);
            result.estimatedTotalTime += pkg.estimatedTime || 0;
          }
        }

        // Re-sort by time
        result.slowPackages.sort((a, b) => (b.estimatedTime || 0) - (a.estimatedTime || 0));

        // Add extended stats
        result.nodeModulesStats = getNodeModulesStats(projectPath);
        result.lockfileStats = getLockfileStats(projectPath);

        // Update total packages count
        result.totalPackages = Math.max(
          result.totalPackages,
          lockfileAnalysis.totalDependencies,
          result.nodeModulesStats.totalSize > 0 ? result.nodeModulesStats.largestPackages.length : 0
        );

        // Regenerate suggestions
        result.suggestions = generateSuggestions(result.slowPackages);
        result.potentialSavings = result.suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);

        spinner.succeed('Deep scan complete');
      } catch (error) {
        spinner.fail('Deep scan failed');
        throw error;
      }
    }

    // Measure mode: actually time installs
    if (options.measure && result.slowPackages.length > 0) {
      const spinner = ora('Measuring install times (this may take a while)...').start();

      try {
        const measurements = await measureTopPackages(
          result.slowPackages,
          5, // Measure top 5 only
          (pkg, index, total) => {
            spinner.text = `Measuring ${pkg} (${index + 1}/${total})...`;
          }
        );

        // Update estimated times with measured values
        for (const measurement of measurements) {
          const pkg = result.slowPackages.find(p => p.name === measurement.name);
          if (pkg && measurement.success) {
            pkg.estimatedTime = measurement.installTime;
            pkg.note = `Measured: ${measurement.installTime}s`;
          }
        }

        // Recalculate totals
        result.estimatedTotalTime = result.slowPackages.reduce(
          (sum, p) => sum + (p.estimatedTime || 0), 0
        );

        spinner.succeed('Measurement complete');
      } catch (error) {
        spinner.fail('Measurement failed');
        // Continue with heuristic estimates
      }
    }

    // Output results based on mode
    if (options.json) {
      displayJSON(result);
    } else if (options.badge) {
      displayBadge(result);
    } else if (options.ci) {
      console.log(generateCIReport(result));
    } else {
      displayResults(result, options.deep);
    }

  } catch (error: any) {
    if (error.message) {
      displayError(error.message);
    } else {
      displayError('An unexpected error occurred');
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Generates optimization suggestions from slow packages
 */
function generateSuggestions(slowPackages: PackageAnalysis[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const pkg of slowPackages) {
    if (!pkg.alternative && !pkg.note) {
      continue;
    }

    if (pkg.alternative) {
      suggestions.push({
        type: 'replace',
        packageName: pkg.name,
        currentTime: pkg.estimatedTime || 0,
        suggestion: `Replace ${pkg.name} → ${pkg.alternative}`,
        potentialSavings: pkg.estimatedTime || 0,
        priority: getPriority(pkg.estimatedTime || 0),
      });
    } else if (pkg.note) {
      suggestions.push({
        type: 'optimize',
        packageName: pkg.name,
        currentTime: pkg.estimatedTime || 0,
        suggestion: pkg.note,
        potentialSavings: Math.floor((pkg.estimatedTime || 0) * 0.5),
        priority: getPriority(pkg.estimatedTime || 0),
      });
    }
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.potentialSavings - a.potentialSavings;
  });
}

/**
 * Determines priority based on time savings
 */
function getPriority(timeSeconds: number): 'high' | 'medium' | 'low' {
  if (timeSeconds >= 20) return 'high';
  if (timeSeconds >= 10) return 'medium';
  return 'low';
}

// Run the CLI
main();
