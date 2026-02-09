import { Command } from 'commander';
import type { CliOptions } from '../types/index.js';

/**
 * Parses command-line arguments
 */
export function parseArgs(argv?: string[]): CliOptions {
  const program = new Command();

  program
    .name('npm-why-slow')
    .description('Analyze which npm packages are slowing down your install times')
    .version('0.2.0')
    .option('-p, --path <dir>', 'Project directory to analyze', process.cwd())
    .option('--json', 'Output results as JSON', false)
    .option('--all', 'Show all packages, not just slow ones', false)
    .option(
      '--threshold <seconds>',
      'Only show packages above this time threshold (in seconds)',
      '5'
    )
    .option('--deep', 'Deep scan node_modules for transitive dependencies', false)
    .option('--measure', 'Actually measure install times (slow but accurate)', false)
    .option('--badge', 'Generate README badge for install time', false)
    .option('--ci', 'CI-friendly output (markdown report)', false);

  program.parse(argv);

  const options = program.opts();

  return {
    path: options.path,
    json: options.json,
    all: options.all,
    threshold: parseInt(options.threshold, 10),
    deep: options.deep,
    measure: options.measure,
    badge: options.badge,
    ci: options.ci,
  };
}
