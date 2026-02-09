import chalk from 'chalk';
import Table from 'cli-table3';
import type { AnalysisResult, Suggestion } from '../types/index.js';
import { generateBadgeSnippets } from '../utils/badge.js';

/**
 * Formats seconds to human-readable string
 */
export function formatTime(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }
  return `${seconds}s`;
}

/**
 * Formats bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Gets icon based on time
 */
function getTimeIcon(seconds: number): string {
  if (seconds >= 30) return '🔥';
  if (seconds >= 15) return '⚡';
  return '💡';
}

/**
 * Displays analysis results
 */
export function displayResults(result: AnalysisResult, showExtendedStats = false): void {
  console.log(chalk.bold.blue('\n📊 Install Time Analysis:\n'));

  console.log(chalk.dim(`Analyzing ${result.totalPackages} packages...\n`));

  // Show extended stats if deep scan was performed
  if (showExtendedStats) {
    if (result.lockfileStats) {
      console.log(chalk.dim(`Lockfile: ${result.lockfileStats.lockfileType} (${result.lockfileStats.totalDeps} dependencies)`));
      if (result.lockfileStats.installScriptCount > 0) {
        console.log(chalk.dim(`Packages with install scripts: ${result.lockfileStats.installScriptCount}`));
      }
    }

    if (result.nodeModulesStats && result.nodeModulesStats.totalSize > 0) {
      console.log(chalk.dim(`node_modules size: ${formatBytes(result.nodeModulesStats.totalSize)}`));

      if (result.nodeModulesStats.largestPackages.length > 0) {
        console.log(chalk.dim('\nLargest packages by disk size:'));
        for (const pkg of result.nodeModulesStats.largestPackages.slice(0, 5)) {
          console.log(chalk.dim(`  ${pkg.name}: ${formatBytes(pkg.size)}`));
        }
      }
    }

    console.log('');
  }

  if (result.slowPackages.length === 0) {
    console.log(chalk.green('✅ Great news! No obviously slow packages detected.\n'));
    console.log(chalk.dim('Your dependencies look well-optimized for install speed.\n'));
    return;
  }

  // Slow packages table
  console.log(chalk.bold('Slowest packages:'));

  const table = new Table({
    head: [
      chalk.bold('#'),
      chalk.bold('Package'),
      chalk.bold('Est. Time'),
      chalk.bold('Reason'),
    ],
    colWidths: [5, 30, 12, 35],
    style: {
      head: [],
      border: [],
    },
  });

  result.slowPackages.forEach((pkg, idx) => {
    const icon = getTimeIcon(pkg.estimatedTime || 0);
    const reason = getReasonDescription(pkg.reason || 'unknown');

    table.push([
      (idx + 1).toString(),
      chalk.yellow(pkg.name),
      `~${formatTime(pkg.estimatedTime || 0)}`,
      chalk.dim(reason),
    ]);
  });

  console.log(table.toString());

  // Summary
  console.log(chalk.bold(`\nEstimated slow time: ${chalk.yellow(formatTime(result.estimatedTotalTime))}\n`));

  // Suggestions
  if (result.suggestions.length > 0) {
    displaySuggestions(result.suggestions, result.potentialSavings);
  }
}

/**
 * Displays optimization suggestions
 */
function displaySuggestions(suggestions: Suggestion[], totalSavings: number): void {
  console.log(chalk.bold.green('💡 Suggestions:\n'));

  for (const suggestion of suggestions) {
    const icon = suggestion.priority === 'high' ? '🔥' : suggestion.priority === 'medium' ? '⚡' : '💡';
    const savings = formatTime(suggestion.potentialSavings);

    console.log(`   ${icon} ${suggestion.suggestion}`);
    console.log(chalk.dim(`      Savings: ~${chalk.green(savings)}`));
    console.log('');
  }

  if (totalSavings > 0) {
    const percentage = Math.round((totalSavings / (totalSavings + 60)) * 100); // Rough estimate
    console.log(chalk.bold(`Potential savings: ~${chalk.green(formatTime(totalSavings))} (${percentage}% faster install!)\n`));
  }
}

/**
 * Outputs results as JSON
 */
export function displayJSON(result: AnalysisResult): void {
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Displays an error message
 */
export function displayError(message: string): void {
  console.error(chalk.red(`\n❌ Error: ${message}\n`));
}

/**
 * Displays badge information
 */
export function displayBadge(result: AnalysisResult): void {
  const badge = generateBadgeSnippets(result);

  console.log(chalk.bold.blue('\n📛 README Badge:\n'));
  console.log(chalk.dim(badge.summary));
  console.log('');

  console.log(chalk.bold('Markdown:'));
  console.log(chalk.green(badge.markdown));
  console.log('');

  console.log(chalk.bold('HTML:'));
  console.log(chalk.green(badge.html));
  console.log('');

  console.log(chalk.bold('URL:'));
  console.log(chalk.cyan(badge.url));
  console.log('');

  console.log(chalk.dim('Add this badge to your README to show install time!'));
  console.log('');
}

/**
 * Displays measurement progress
 */
export function displayMeasureProgress(pkg: string, index: number, total: number): void {
  console.log(chalk.dim(`Measuring ${pkg} (${index + 1}/${total})...`));
}

/**
 * Gets human-readable reason description
 */
function getReasonDescription(reason: string): string {
  const descriptions: Record<string, string> = {
    'binary-download': 'downloads large binary',
    'native-compilation': 'native compilation',
    'large-deps': 'large dependency tree',
    'postinstall': 'postinstall script',
    'measured': 'measured install time',
  };

  return descriptions[reason] || reason;
}
