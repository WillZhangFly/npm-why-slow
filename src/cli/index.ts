#!/usr/bin/env node

import { existsSync } from 'fs';
import { resolve } from 'path';
import { parseArgs } from './args.js';
import { analyzeProject } from '../analyzers/heuristics.js';
import { displayResults, displayJSON, displayError } from './output.js';

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

    // Analyze project
    const result = await analyzeProject(projectPath, options.threshold);

    // Display results
    if (options.json) {
      displayJSON(result);
    } else {
      displayResults(result);
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

// Run the CLI
main();
