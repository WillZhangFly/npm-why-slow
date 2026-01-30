# npm-why-slow

> Instantly identify which npm packages are slowing down your `npm install` ⚡

[![npm version](https://img.shields.io/npm/v/npm-why-slow.svg)](https://www.npmjs.com/package/npm-why-slow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Problem

`npm install` takes 5 minutes. Which package is the culprit?

## Solution

`npm-why-slow` analyzes your dependencies and identifies slow packages with actionable suggestions — **in under 1 second**.

## Features

✅ **Instant analysis** (< 1 second, no reinstallation needed)
✅ **Smart heuristics** based on known slow packages
✅ **Actionable suggestions** with specific alternatives
✅ **Beautiful terminal output** with clear priorities
✅ **Zero configuration** — just run it
✅ **Actively maintained** (unlike slow-deps)

## Installation

```bash
# Run directly with npx (recommended)
npx npm-why-slow

# Or install globally
npm install -g npm-why-slow

# Or as dev dependency
npm install --save-dev npm-why-slow
```

## Usage

### Basic Usage

```bash
# Analyze current directory
npx npm-why-slow

# Analyze specific directory
npx npm-why-slow --path ./my-project

# Show all packages (not just slow ones)
npx npm-why-slow --all

# Only show packages taking > 10 seconds
npx npm-why-slow --threshold 10

# Output as JSON (for CI/CD)
npx npm-why-slow --json
```

## Example Output

```
📊 Install Time Analysis:

Analyzing 247 packages...

Slowest packages:
┌─────┬────────────────────────────────┬────────────┬─────────────────────────────┐
│ #   │ Package                        │ Est. Time  │ Reason                      │
├─────┼────────────────────────────────┼────────────┼─────────────────────────────┤
│ 1   │ puppeteer                      │ ~45s       │ downloads large binary      │
│ 2   │ @tensorflow/tfjs-node          │ ~30s       │ native compilation          │
│ 3   │ sharp                          │ ~12s       │ native compilation          │
└─────┴────────────────────────────────┴────────────┴─────────────────────────────┘

Estimated slow time: ~87s

💡 Suggestions:

   🔥 Replace puppeteer → puppeteer-core
      Savings: ~45s

   🔥 Replace @tensorflow/tfjs-node → @tensorflow/tfjs
      Savings: ~30s

   ⚡ Replace sharp → jimp
      Savings: ~12s

Potential savings: ~87s (60% faster install!)
```

## How It Works

`npm-why-slow` uses **smart heuristics** to identify slow packages:

1. **Known slow packages database** - Maintains a curated list of packages known to be slow (puppeteer, sharp, electron, etc.)
2. **Binary downloads** - Identifies packages that download large binaries (browsers, drivers)
3. **Native compilation** - Detects packages requiring node-gyp and native compilation
4. **Large dependency trees** - Flags packages with thousands of dependencies

**No reinstallation required** — analysis completes in under 1 second!

## vs. Other Tools

### vs. slow-deps
- ❌ **slow-deps**: Reinstalls each package separately (takes hours!)
- ✅ **npm-why-slow**: Instant analysis using heuristics
- ❌ **slow-deps**: Unmaintained since 2019
- ✅ **npm-why-slow**: Actively maintained

### vs. npm --timing
- ❌ **npm --timing**: Only shows high-level phases
- ✅ **npm-why-slow**: Shows per-package estimates
- ❌ **npm --timing**: No suggestions
- ✅ **npm-why-slow**: Actionable alternatives

## Slow Packages Database

Includes analysis for:

**Binary Downloads:**
- puppeteer, playwright, electron, cypress
- chromedriver, geckodriver

**Native Compilation:**
- sharp, node-sass, bcrypt, sqlite3
- @tensorflow/tfjs-node, grpc, canvas

**Large Dependencies:**
- aws-sdk, @angular/cli, webpack

## CLI Options

```
Options:
  -p, --path <dir>          Project directory to analyze (default: cwd)
  --json                    Output results as JSON
  --all                     Show all packages, not just slow ones
  --threshold <seconds>     Only show packages above threshold (default: 5)
  -V, --version             Output version number
  -h, --help                Display help
```

## Example Scenarios

### Scenario 1: Project with Puppeteer

```bash
$ npm-why-slow

📊 Install Time Analysis:

Slowest packages:
1. puppeteer        ~45s  (downloads Chromium browser)

💡 Suggestions:
  🔥 Replace puppeteer → puppeteer-core
     Savings: ~45s
     Note: Bring your own browser
```

### Scenario 2: Clean Project

```bash
$ npm-why-slow

📊 Install Time Analysis:

✅ Great news! No obviously slow packages detected.

Your dependencies look well-optimized for install speed.
```

### Scenario 3: Multiple Issues

```bash
$ npm-why-slow

📊 Install Time Analysis:

Slowest packages:
1. electron         ~40s  (downloads Electron binary)
2. sharp            ~12s  (native compilation)
3. node-sass        ~15s  (native compilation - DEPRECATED)

Estimated slow time: ~67s

💡 Suggestions:
  🔥 Replace node-sass → sass
     Savings: ~15s
     Note: Dart Sass is officially recommended

Potential savings: ~15s (22% faster!)
```

## Use Cases

- 🚀 **Before adding dependencies** - Check if a package will slow down installs
- 🔍 **Debug slow installs** - Identify the culprit quickly
- 📊 **CI/CD optimization** - Reduce build times
- 👥 **Team onboarding** - Faster setup for new developers

## Contributing

Contributions welcome! Especially:
- Adding more slow packages to the database
- Improving time estimates
- Suggesting better alternatives

## Requirements

- Node.js 18.0.0 or higher

## Related Projects

- [slow-deps](https://github.com/nolanlawson/slow-deps) - Original tool (unmaintained)
- [import-cost-total](https://github.com/willzhangfly/import-cost-total) - Analyze bundle size impact

## Support

This project is maintained in my free time. If it helped speed up your npm installs or saved you debugging time, I'd really appreciate your support:

- ⭐ Star the repo—it helps others discover this tool
- 📢 Share with your team or on social media
- 🐛 [Report bugs or suggest features](https://github.com/willzhangfly/npm-why-slow/issues)
- ☕ [Buy me a coffee](https://buymeacoffee.com/willzhangfly) if you'd like to support development

Thank you to everyone who has contributed, shared feedback, or helped spread the word!

## License

MIT

---

**Made with ❤️ for faster npm installs**
