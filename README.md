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
✅ **Deep scanning** - Scans node_modules for transitive dependencies
✅ **Lockfile analysis** - Parses package-lock.json and yarn.lock
✅ **Dynamic detection** - Detects native modules (node-gyp, binding.gyp)
✅ **Size analysis** - Shows disk usage of largest packages
✅ **Measurement mode** - Actually time installs for accuracy
✅ **GitHub Action** - Block PRs that add slow dependencies
✅ **README badges** - Show install time in your project
✅ **CI-friendly output** - Markdown reports for pull requests
✅ **Actionable suggestions** with specific alternatives
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

# Only show packages taking > 10 seconds
npx npm-why-slow --threshold 10

# Output as JSON (for CI/CD)
npx npm-why-slow --json
```

### Deep Scan Mode

Scan node_modules and lockfiles for transitive slow dependencies:

```bash
npx npm-why-slow --deep
```

This will:
- Scan all packages in node_modules
- Detect native modules (binding.gyp, node-gyp)
- Parse package-lock.json/yarn.lock for install scripts
- Show disk space usage

### Measurement Mode

Actually time package installations for accurate results:

```bash
npx npm-why-slow --measure
```

⚠️ This is slower as it installs packages in temporary directories.

### README Badge

Generate a badge showing your project's install time:

```bash
npx npm-why-slow --badge
```

Output:
```
📛 README Badge:

Found 3 slow packages adding ~87s to install time

Markdown:
![Install Time](https://img.shields.io/badge/install%20time-~87s-orange?style=flat)

HTML:
<img alt="Install Time" src="https://img.shields.io/badge/install%20time-~87s-orange?style=flat" />
```

### CI/CD Integration

Generate a markdown report for pull requests:

```bash
npx npm-why-slow --ci
```

## GitHub Action

Add this workflow to automatically check PRs for slow dependencies:

```yaml
# .github/workflows/check-install-time.yml
name: Check Install Time

on:
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: willzhangfly/npm-why-slow@v1
        with:
          threshold: 10        # Only report packages > 10s
          max-time: 120        # Fail if total > 2 minutes
          deep-scan: true      # Scan transitive dependencies
```

Or use the reusable action:

```yaml
- uses: willzhangfly/npm-why-slow@v1
  with:
    fail-on-slow: true  # Fail if any slow packages found
```

## Example Output

```
📊 Install Time Analysis:

Analyzing 247 packages...

Lockfile: npm (1,432 dependencies)
Packages with install scripts: 12
node_modules size: 245.3 MB

Largest packages by disk size:
  @tensorflow/tfjs-node: 89.2 MB
  electron: 67.1 MB
  puppeteer: 45.3 MB

Slowest packages:
┌─────┬────────────────────────────────┬────────────┬─────────────────────────────┐
│ #   │ Package                        │ Est. Time  │ Reason                      │
├─────┼────────────────────────────────┼────────────┼─────────────────────────────┤
│ 1   │ puppeteer                      │ ~45s       │ downloads large binary      │
│ 2   │ @tensorflow/tfjs-node          │ ~30s       │ native compilation          │
│ 3   │ sharp                          │ ~12s       │ native compilation          │
│ 4   │ my-native-addon                │ ~10s       │ native compilation          │
└─────┴────────────────────────────────┴────────────┴─────────────────────────────┘

Estimated slow time: ~97s

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

`npm-why-slow` uses multiple strategies to identify slow packages:

1. **Known slow packages database** - Curated list of packages known to be slow (puppeteer, sharp, electron, etc.)
2. **Dynamic detection** - Scans for `binding.gyp` files and `node-gyp` dependencies
3. **Lockfile analysis** - Parses lockfiles for packages with install scripts
4. **Size analysis** - Large packages with postinstall scripts are flagged
5. **Optional measurement** - Actually time installs for ground truth

## CLI Options

```
Options:
  -p, --path <dir>          Project directory to analyze (default: cwd)
  --json                    Output results as JSON
  --all                     Show all packages, not just slow ones
  --threshold <seconds>     Only show packages above threshold (default: 5)
  --deep                    Deep scan node_modules and lockfiles
  --measure                 Actually measure install times (slow but accurate)
  --badge                   Generate README badge for install time
  --ci                      CI-friendly markdown output
  -V, --version             Output version number
  -h, --help                Display help
```

## vs. Other Tools

| Feature | npm-why-slow | slow-deps | Bundlephobia |
|---------|--------------|-----------|--------------|
| Speed | Instant | Hours | N/A |
| Transitive deps | ✅ (--deep) | ✅ | ✅ |
| Measurement mode | ✅ (--measure) | ✅ | ❌ |
| GitHub Action | ✅ | ❌ | ❌ |
| Actively maintained | ✅ | ❌ (2019) | ✅ |
| Install time focus | ✅ | ✅ | ❌ |
| Size analysis | ✅ | ❌ | ✅ |

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

**Plus dynamic detection of:**
- Any package with `binding.gyp`
- Any package depending on `node-gyp`
- Large packages with postinstall scripts

## Use Cases

- 🚀 **Before adding dependencies** - Check if a package will slow down installs
- 🔍 **Debug slow installs** - Identify the culprit quickly
- 📊 **CI/CD optimization** - Block slow packages in PRs
- 👥 **Team onboarding** - Faster setup for new developers
- 📛 **Project badges** - Show install time in README

## Contributing

Contributions welcome! Especially:
- Adding more slow packages to the database
- Improving time estimates
- Suggesting better alternatives
- Improving detection heuristics

## Requirements

- Node.js 18.0.0 or higher

## Related Projects

- [slow-deps](https://github.com/nolanlawson/slow-deps) - Original tool (unmaintained)
- [import-cost-total](https://github.com/willzhangfly/import-cost-total) - Analyze bundle size impact
- [Bundlephobia](https://bundlephobia.com) - Check package size online

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
