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
    .version('0.1.0')
    .option('-p, --path <dir>', 'Project directory to analyze', process.cwd())
    .option('--json', 'Output results as JSON', false)
    .option('--all', 'Show all packages, not just slow ones', false)
    .option(
      '--threshold <seconds>',
      'Only show packages above this time threshold (in seconds)',
      '5'
    );

  program.parse(argv);

  const options = program.opts();

  return {
    path: options.path,
    json: options.json,
    all: options.all,
    threshold: parseInt(options.threshold, 10),
  };
}
