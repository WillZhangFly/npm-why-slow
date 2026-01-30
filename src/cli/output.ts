import chalk from 'chalk';
import Table from 'cli-table3';
import type { AnalysisResult, Suggestion } from '../types/index.js';

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
export function displayResults(result: AnalysisResult): void {
  console.log(chalk.bold.blue('\n📊 Install Time Analysis:\n'));

  console.log(chalk.dim(`Analyzing ${result.totalPackages} packages...\n`));

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
 * Gets human-readable reason description
 */
function getReasonDescription(reason: string): string {
  const descriptions: Record<string, string> = {
    'binary-download': 'downloads large binary',
    'native-compilation': 'native compilation',
    'large-deps': 'large dependency tree',
    'postinstall': 'postinstall script',
  };

  return descriptions[reason] || reason;
}
