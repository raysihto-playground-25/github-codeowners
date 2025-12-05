# github-codeowners

A specification-faithful parser and matcher for GitHub CODEOWNERS files. Use it as a library in your TypeScript/JavaScript projects or as a CLI tool.

## Features

* 🎯 **Specification-faithful** - Follows GitHub's CODEOWNERS specification precisely
* 📚 **Library-first design** - Clean public API for programmatic use
* 🔧 **CLI tool** - Full-featured command-line interface
* ✅ **Well-tested** - Comprehensive test coverage including edge cases
* 📦 **Modern** - TypeScript 5, Node.js 18+, latest dependencies
* 🔒 **Type-safe** - Full TypeScript support with generated type declarations

## Installation

### As a library
```bash
npm install @snyk/github-codeowners
```

### As a CLI tool
```bash
npm install -g @snyk/github-codeowners
```

## Library Usage

The library provides a clean, documented API for parsing and matching CODEOWNERS files.

### Basic Example

```typescript
import { parseCodeowners, matchFile } from '@snyk/github-codeowners';

// Parse a CODEOWNERS file
const codeowners = parseCodeowners('.github/CODEOWNERS');

// Find owners for a specific file
const owners = matchFile(codeowners, 'src/index.ts');
console.log(owners); // ['@backend-team']
```

### API Reference

#### `parseCodeowners(filePath: string): ParsedCodeowners`

Parse a CODEOWNERS file from disk.

```typescript
const codeowners = parseCodeowners('.github/CODEOWNERS');
```

#### `parseCodeownersContent(content: string): ParsedCodeowners`

Parse CODEOWNERS content from a string.

```typescript
const content = `
* @global-owner
/docs/ @docs-team
`;
const codeowners = parseCodeownersContent(content);
```

#### `matchFile(codeowners: ParsedCodeowners, filePath: string): string[]`

Get the owners for a specific file. Returns an array of owner identifiers (e.g., `@username`, `@org/team`, or email addresses).

```typescript
const owners = matchFile(codeowners, 'src/index.ts');
// Returns: ['@backend-team']
```

#### `matchFileDetailed(codeowners: ParsedCodeowners, filePath: string): OwnerMatch`

Get detailed information about the ownership match.

```typescript
const match = matchFileDetailed(codeowners, 'src/index.ts');
console.log(match.owners);  // ['@backend-team']
console.log(match.rule);    // 'src/** @backend-team'
console.log(match.path);    // 'src/index.ts'
```

#### `matchFiles(codeowners: ParsedCodeowners, filePaths: string[]): Map<string, string[]>`

Match multiple files at once.

```typescript
const files = ['src/index.ts', 'docs/README.md', 'tests/test.ts'];
const ownershipMap = matchFiles(codeowners, files);

ownershipMap.forEach((owners, filePath) => {
  console.log(`${filePath}: ${owners.join(', ')}`);
});
```

#### `getRules(codeowners: ParsedCodeowners): Array<{ rule: string; matched: number }>`

Get all ownership rules and their match counts.

```typescript
const rules = getRules(codeowners);
rules.forEach(rule => {
  console.log(`${rule.rule} matched ${rule.matched} files`);
});
```

### Advanced Example

```typescript
import { 
  parseCodeowners, 
  matchFile, 
  matchFileDetailed,
  getRules 
} from '@snyk/github-codeowners';

// Parse CODEOWNERS
const codeowners = parseCodeowners('.github/CODEOWNERS');

// Check ownership for multiple files
const filesToCheck = [
  'src/api/users.ts',
  'src/api/products.ts',
  'docs/api.md',
  'README.md'
];

filesToCheck.forEach(file => {
  const match = matchFileDetailed(codeowners, file);
  
  if (match.owners.length > 0) {
    console.log(`✓ ${file} → ${match.owners.join(', ')}`);
    console.log(`  Rule: ${match.rule}`);
  } else {
    console.log(`✗ ${file} → UNOWNED`);
  }
});

// Get statistics
const rules = getRules(codeowners);
console.log(`\nTotal rules: ${rules.length}`);
rules.forEach(rule => {
  if (rule.matched > 0) {
    console.log(`  ${rule.rule} (matched ${rule.matched} times)`);
  }
});
```

## CLI Usage

A CLI tool for working with GitHub CODEOWNERS.

Things it does:
* Calculate ownership stats
* Find out who owns each and every file (ignoring files listed in `.gitignore`)
* Find out who owns a single file
* Find out who owns your staged files
* Outputs in a bunch of script friendly handy formats for integrations (CSV and JSONL)
* Validates that your CODEOWNERS file is valid

### Commands
#### Audit
Compares every file in your current (or specified) directory against your CODEOWNERS rules and outputs the result of who owns each file.
```shell script
$ cd <your awesome project> 
$ github-codeowners audit
README.md
package.json
src/cli.ts      @jjmschofield
...
```

Ownership stats:
```shell script
$ github-codeowners audit -s
--- Counts ---
Total: 24 files (1378 lines) 100%
Loved: 10 files (494 lines) 41.6%
Unloved: 14 files (884 lines) 58.4%
--- Owners ---
@jjmschofield: 10 files (494 lines) 41.6%
```

Only files in a specific directory:
```shell script
$ github-codeowners audit -r src/
src/cli.ts      @jjmschofield
src/commands/audit.ts   @jjmschofield
...
```

Only unowned files:
```shell script
$ github-codeowners audit -u
.github/CODEOWNERS
.gitignore
```

Output in JSONL:
```shell script
$ github-codeowners audit -o jsonl
{"path":"src/commands/audit.ts","owners":["@jjmschofield"],"lines":48}
...
```

Output in CSV:
```shell script
$ github-codeowners audit -o csv
src/commands/audit.ts,@jjmschofield
```

Full usage information:
```shell script
$ github-codeowners audit --help
Usage: github-codeowners audit [options]

list the owners for all files

Options:
  -d, --dir <dirPath>          path to VCS directory (default: "<current working directory>")
  -c, --codeowners <filePath>  path to codeowners file (default: "<dir>/.github/CODEOWNERS")
  -o, --output <outputFormat>  how to output format eg: simple, jsonl, csv (default: "simple")
  -u, --unloved                unowned files only (default: false)
  -g, --only-git               consider only files tracked by git (default: false)
  -s, --stats                  output stats (default: true)
  -r, --root <rootPath>        the root path to filter files by (default: "")
  -h, --help                   output usage information
```

### Who
Tells you who owns a given file or files: 
```shell script
$ cd <your awesome project> 
$ github-codeowners who <file> <file>
<file> @some/team
<file> @some/team
```

Full usage:
```shell script
$ github-codeowners who --help                   
Usage: github-codeowners who [options] <file...>

lists owners of a specific file or files

Options:
  -d, --dir <dirPath>          path to VCS directory (default: "/Users/jjmschofield/projects/github/snyk/registry")
  -c, --codeowners <filePath>  path to codeowners file (default: "<dir>/.github/CODEOWNERS")
  -o, --output <outputFormat>  how to output format eg: simple, jsonl, csv (default: "simple")
  -h, --help                   output usage information
```

### Git
Provides a list of files with their owners between commits (against the **current** version of CODEOWNERS).

Ownership of all files staged for commit:
```shell script
$ cd <your awesome project>
$ github-codeowners git
```

Ownership of files existing at a specific commit:
```shell script
$ github-codeowners git <commit sha>
```

Ownership of files changed between two commits:
```shell script
$ github-codeowners git <commit sha> <commit sha>
```

Output stats:
```shell script
$ github-codeowners git -s
```

Full usage:
```shell script
$ github-codeowners git --help                                                                                       
Usage: github-codeowners git [options] [shaA] [shaB]

lists owners of files changed between commits, a commit against head or staged against head.

Options:
  -d, --dir <dirPath>          path to VCS directory (default: "/Users/jjmschofield/projects/github/snyk/registry")
  -c, --codeowners <filePath>  path to codeowners file (default: "<dir>/.github/CODEOWNERS")
  -o, --output <outputFormat>  how to output format eg: simple, jsonl, csv (default: "simple")
  -s, --stats                  output stats, note line counts are not available for this command (default: false)
  -h, --help                   output usage information
```

### Validate
Validates your CODEOWNERS file to find common mistakes, will throw on errors (such as malformed owners).
```shell script
$ cd <your awesome project> 
$ github-codeowners validate
Found duplicate rules [ 'some/duplicate/rule @octocat' ]
Found rules which did not match any files [ 'some/non-existent/path @octocat' ]
...
```

Full usage information:
```shell script
$ github-codeowners validate --help
Usage: github-codeowners validate [options]

Validates a CODOWNER file and files in dir

Options:
  -d, --dir <dirPath>          path to VCS directory (default: "<current working directory>")
  -c, --codeowners <filePath>  path to codeowners file (default: "<dir>/.github/CODEOWNERS")
  -r, --root <rootPath>        the root path to filter files by (default: "")
  -h, --help                   output usage information
```

## Output Formats
Check `github-codeowners <command> --help` for support for a given command, however generally the following outputs are supported:
* `simple` - tab delimited - terminal friendly output
* `jsonl` - line separated json - useful for streaming data to another command
* `csv` - csv delimited fields - useful to import into a spreadsheet tool of your choice

## Specification Compliance

This library implements GitHub's CODEOWNERS specification as documented in the [official GitHub documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).

### Implemented Features

✅ **Pattern Matching**
- Gitignore-style patterns (wildcards `*`, double-asterisk `**`, question mark `?`)
- Leading slash anchors patterns to repository root
- Trailing slash matches directories
- Last matching rule wins (precedence)

✅ **Owner Formats**
- GitHub usernames (`@username`)
- GitHub teams (`@org/team-name`)
- Email addresses (`user@example.com`)

✅ **Comment Support**
- Lines starting with `#` are treated as comments
- Blank lines are ignored

✅ **Special Pattern Handling**
- `/*` matches only root-level files (not nested directories)
- `/**` matches all files at any depth
- Patterns without leading `/` match anywhere in the tree

### Known Limitations

⚠️ **Module Format**
- This package uses CommonJS and is compatible with Node.js 18+
- Dependencies `ignore` v5.x and `p-map` v4.x are used (newer versions are ESM-only)

⚠️ **Pattern Edge Cases**
- The `/*` pattern behavior is implemented via regex modification of the underlying `ignore` library
- While tested against known patterns, there may be edge cases where behavior differs from GitHub's implementation
- Escape sequences in patterns (e.g., `\ ` for spaces) follow gitignore conventions

### Differences from GitHub

This library aims to be specification-faithful, but some differences may exist:

1. **CODEOWNERS file location**: This library accepts any file path, while GitHub looks in specific locations (`.github/CODEOWNERS`, `docs/CODEOWNERS`, or root `CODEOWNERS`)
2. **Validation strictness**: The library validates owner format strictly and throws on invalid formats, which may differ slightly from GitHub's validation
3. **Performance**: This library processes files sequentially; GitHub's implementation details are proprietary

## Requirements

- Node.js >= 18.0.0
- TypeScript 5.x (for development)

## Limits and Things to Improve
* The output interface might change
* Command syntax might change

## Shout outs
Inspired by [codeowners](https://github.com/beaugunderson/codeowners#readme) but implemented in Typescript with extra bells and whistles.

This project is a fork of [jjmschofield's version](https://github.com/jjmschofield/github-codeowners).
