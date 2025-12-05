/**
 * @module github-codeowners
 * A library for parsing and matching GitHub CODEOWNERS files.
 * 
 * This library provides a specification-faithful implementation of GitHub's CODEOWNERS
 * file format, allowing you to parse CODEOWNERS files and determine file ownership.
 * 
 * @example
 * ```typescript
 * import { parseCodeowners, matchFile } from '@snyk/github-codeowners';
 * 
 * // Parse a CODEOWNERS file
 * const codeowners = parseCodeowners('/path/to/.github/CODEOWNERS');
 * 
 * // Find owners for a specific file
 * const owners = matchFile(codeowners, 'src/index.ts');
 * console.log(owners); // ['@owner1', '@owner2']
 * ```
 */

import * as fs from 'fs';
import { OwnershipEngine } from './lib/ownership/OwnershipEngine';
import { FileOwnershipMatcher } from './lib/ownership/types';

/**
 * Represents a parsed CODEOWNERS file with all ownership rules.
 */
export interface ParsedCodeowners {
  /**
   * The ownership engine instance containing all parsed rules
   * @internal
   */
  readonly engine: OwnershipEngine;
}

/**
 * Represents the result of matching a file against CODEOWNERS rules.
 */
export interface OwnerMatch {
  /**
   * The file path that was matched
   */
  readonly path: string;
  
  /**
   * The owners assigned to this file (may be empty if no rule matches)
   */
  readonly owners: string[];
  
  /**
   * The rule pattern that matched this file (if any)
   */
  readonly rule?: string;
}

/**
 * Parses a CODEOWNERS file and returns a structured representation of ownership rules.
 * 
 * @param codeownersPath - Path to the CODEOWNERS file
 * @returns A ParsedCodeowners object containing the parsed ownership rules
 * @throws Error if the file cannot be read or contains invalid syntax
 * 
 * @example
 * ```typescript
 * const codeowners = parseCodeowners('.github/CODEOWNERS');
 * ```
 */
export function parseCodeowners(codeownersPath: string): ParsedCodeowners {
  const engine = OwnershipEngine.FromCodeownersFile(codeownersPath);
  return { engine };
}

/**
 * Parses CODEOWNERS content from a string.
 * 
 * @param content - The CODEOWNERS file content as a string
 * @returns A ParsedCodeowners object containing the parsed ownership rules
 * @throws Error if the content contains invalid syntax
 * 
 * @example
 * ```typescript
 * const content = `
 * * @global-owner
 * /docs/ @docs-team
 * `;
 * const codeowners = parseCodeownersContent(content);
 * ```
 */
export function parseCodeownersContent(content: string): ParsedCodeowners {
  const engine = OwnershipEngine.FromCodeownersContent(content);
  return { engine };
}

/**
 * Determines the owners for a specific file path based on parsed CODEOWNERS rules.
 * 
 * According to the GitHub CODEOWNERS specification, the last matching rule wins.
 * If no rule matches, an empty array is returned.
 * 
 * @param codeowners - The parsed CODEOWNERS object
 * @param filePath - The file path to match (relative to repository root)
 * @returns An array of owner identifiers (e.g., '@username', '@org/team', or email addresses)
 * 
 * @example
 * ```typescript
 * const codeowners = parseCodeowners('.github/CODEOWNERS');
 * const owners = matchFile(codeowners, 'src/index.ts');
 * console.log(owners); // ['@backend-team']
 * ```
 */
export function matchFile(codeowners: ParsedCodeowners, filePath: string): string[] {
  return codeowners.engine.calcFileOwnership(filePath);
}

/**
 * Matches a file and returns detailed information about the match.
 * 
 * @param codeowners - The parsed CODEOWNERS object
 * @param filePath - The file path to match (relative to repository root)
 * @returns An OwnerMatch object with detailed match information
 * 
 * @example
 * ```typescript
 * const codeowners = parseCodeowners('.github/CODEOWNERS');
 * const match = matchFileDetailed(codeowners, 'src/index.ts');
 * console.log(match.owners); // ['@backend-team']
 * console.log(match.rule); // 'src/** @backend-team'
 * ```
 */
export function matchFileDetailed(codeowners: ParsedCodeowners, filePath: string): OwnerMatch {
  const owners = codeowners.engine.calcFileOwnership(filePath);
  const matchingRule = codeowners.engine.getMatchingRule(filePath);
  
  return {
    path: filePath,
    owners,
    rule: matchingRule,
  };
}

/**
 * Returns all ownership rules from the parsed CODEOWNERS file.
 * 
 * @param codeowners - The parsed CODEOWNERS object
 * @returns An array of ownership rules with their match statistics
 * 
 * @example
 * ```typescript
 * const codeowners = parseCodeowners('.github/CODEOWNERS');
 * const rules = getRules(codeowners);
 * rules.forEach(rule => {
 *   console.log(`${rule.rule} matched ${rule.matched} files`);
 * });
 * ```
 */
export function getRules(codeowners: ParsedCodeowners): Array<{ rule: string; matched: number }> {
  return codeowners.engine.getRules();
}

/**
 * Validates multiple file paths against CODEOWNERS rules.
 * Returns a map of file paths to their owners.
 * 
 * @param codeowners - The parsed CODEOWNERS object
 * @param filePaths - Array of file paths to check
 * @returns A map of file paths to owner arrays
 * 
 * @example
 * ```typescript
 * const codeowners = parseCodeowners('.github/CODEOWNERS');
 * const files = ['src/index.ts', 'docs/README.md', 'tests/test.ts'];
 * const ownershipMap = matchFiles(codeowners, files);
 * ```
 */
export function matchFiles(
  codeowners: ParsedCodeowners,
  filePaths: string[]
): Map<string, string[]> {
  const result = new Map<string, string[]>();
  
  for (const filePath of filePaths) {
    const owners = matchFile(codeowners, filePath);
    result.set(filePath, owners);
  }
  
  return result;
}

// Re-export key types for library consumers
export { OwnershipEngine } from './lib/ownership/OwnershipEngine';
export { FileOwnershipMatcher, Matcher } from './lib/ownership/types';
export { File } from './lib/file/File';
export { OUTPUT_FORMAT } from './lib/types';

// Export file utilities for advanced use cases
export { getOwnership } from './lib/ownership';
export { validate } from './lib/ownership/validate';
