import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  parseCodeowners,
  parseCodeownersContent,
  matchFile,
  matchFileDetailed,
  getRules,
  matchFiles,
} from './index';

describe('Public API', () => {
  let tempDir: string;
  let codeownersPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeowners-test-'));
    codeownersPath = path.join(tempDir, 'CODEOWNERS');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('parseCodeowners', () => {
    it('should parse a CODEOWNERS file', () => {
      const content = `
# Global owner
* @global-owner

# Docs team
/docs/ @docs-team

# JavaScript files
*.js @js-team
`;
      fs.writeFileSync(codeownersPath, content);

      const codeowners = parseCodeowners(codeownersPath);
      expect(codeowners).toBeDefined();
      expect(codeowners.engine).toBeDefined();
    });

    it('should throw when file does not exist', () => {
      expect(() => parseCodeowners('/nonexistent/file')).toThrow();
    });

    it('should handle CRLF line endings', () => {
      const content = '* @owner\r\n*.js @js-team\r\n';
      fs.writeFileSync(codeownersPath, content);

      const codeowners = parseCodeowners(codeownersPath);
      const owners = matchFile(codeowners, 'test.js');
      expect(owners).toEqual(['@js-team']);
    });
  });

  describe('parseCodeownersContent', () => {
    it('should parse CODEOWNERS content from string', () => {
      const content = `
* @global-owner
/docs/ @docs-team
*.js @js-team
`;
      const codeowners = parseCodeownersContent(content);
      expect(codeowners).toBeDefined();
      expect(codeowners.engine).toBeDefined();
    });

    it('should handle empty content', () => {
      const codeowners = parseCodeownersContent('');
      expect(codeowners).toBeDefined();
      const owners = matchFile(codeowners, 'any-file.txt');
      expect(owners).toEqual([]);
    });

    it('should ignore comments', () => {
      const content = `
# This is a comment
* @global-owner
# Another comment
`;
      const codeowners = parseCodeownersContent(content);
      const owners = matchFile(codeowners, 'test.txt');
      expect(owners).toEqual(['@global-owner']);
    });

    it('should ignore blank lines', () => {
      const content = `

* @global-owner


/docs/ @docs-team

`;
      const codeowners = parseCodeownersContent(content);
      const owners = matchFile(codeowners, 'test.txt');
      expect(owners).toEqual(['@global-owner']);
    });
  });

  describe('matchFile', () => {
    it('should return owners for matching file', () => {
      const content = `
* @global-owner
/docs/ @docs-team
*.js @js-team
`;
      const codeowners = parseCodeownersContent(content);
      const owners = matchFile(codeowners, 'test.js');
      expect(owners).toEqual(['@js-team']);
    });

    it('should return empty array when no rule matches', () => {
      const content = `
/docs/ @docs-team
`;
      const codeowners = parseCodeownersContent(content);
      const owners = matchFile(codeowners, 'src/test.js');
      expect(owners).toEqual([]);
    });

    it('should respect last match wins precedence', () => {
      const content = `
* @global-owner
*.js @js-team
/src/special.js @special-owner
`;
      const codeowners = parseCodeownersContent(content);

      // Global owner overridden by js-team
      const jsOwners = matchFile(codeowners, 'test.js');
      expect(jsOwners).toEqual(['@js-team']);

      // js-team overridden by special-owner
      const specialOwners = matchFile(codeowners, 'src/special.js');
      expect(specialOwners).toEqual(['@special-owner']);
    });

    it('should handle multiple owners on same line', () => {
      const content = `
*.js @js-team @frontend-team @qa-team
`;
      const codeowners = parseCodeownersContent(content);
      const owners = matchFile(codeowners, 'test.js');
      expect(owners).toEqual(['@js-team', '@frontend-team', '@qa-team']);
    });

    it('should handle directory patterns', () => {
      const content = `
/docs/ @docs-team
`;
      const codeowners = parseCodeownersContent(content);

      expect(matchFile(codeowners, 'docs/README.md')).toEqual(['@docs-team']);
      expect(matchFile(codeowners, 'docs/guide/intro.md')).toEqual(['@docs-team']);
      expect(matchFile(codeowners, 'src/docs/test.md')).toEqual([]);
    });

    it('should handle wildcard patterns', () => {
      const content = `
*.md @docs-team
`;
      const codeowners = parseCodeownersContent(content);

      expect(matchFile(codeowners, 'README.md')).toEqual(['@docs-team']);
      expect(matchFile(codeowners, 'docs/guide.md')).toEqual(['@docs-team']);
      expect(matchFile(codeowners, 'test.txt')).toEqual([]);
    });

    it('should handle double-asterisk patterns', () => {
      const content = `
**/docs/**/*.md @docs-team
`;
      const codeowners = parseCodeownersContent(content);

      expect(matchFile(codeowners, 'docs/README.md')).toEqual(['@docs-team']);
      expect(matchFile(codeowners, 'src/docs/guide/intro.md')).toEqual(['@docs-team']);
      expect(matchFile(codeowners, 'src/test.md')).toEqual([]);
    });

    it('should handle email addresses as owners', () => {
      const content = `
*.js docs@example.com
`;
      const codeowners = parseCodeownersContent(content);
      const owners = matchFile(codeowners, 'test.js');
      expect(owners).toEqual(['docs@example.com']);
    });

    it('should handle org/team format', () => {
      const content = `
*.js @myorg/frontend-team
`;
      const codeowners = parseCodeownersContent(content);
      const owners = matchFile(codeowners, 'test.js');
      expect(owners).toEqual(['@myorg/frontend-team']);
    });
  });

  describe('matchFileDetailed', () => {
    it('should return detailed match information', () => {
      const content = `
* @global-owner
*.js @js-team
`;
      const codeowners = parseCodeownersContent(content);
      const match = matchFileDetailed(codeowners, 'test.js');

      expect(match.path).toBe('test.js');
      expect(match.owners).toEqual(['@js-team']);
      expect(match.rule).toBe('*.js @js-team');
    });

    it('should return undefined rule when no match', () => {
      const content = `
/docs/ @docs-team
`;
      const codeowners = parseCodeownersContent(content);
      const match = matchFileDetailed(codeowners, 'src/test.js');

      expect(match.path).toBe('src/test.js');
      expect(match.owners).toEqual([]);
      expect(match.rule).toBeUndefined();
    });

    it('should respect precedence in rule matching', () => {
      const content = `
* @global-owner
*.js @js-team
/src/special.js @special-owner
`;
      const codeowners = parseCodeownersContent(content);
      const match = matchFileDetailed(codeowners, 'src/special.js');

      expect(match.owners).toEqual(['@special-owner']);
      expect(match.rule).toBe('/src/special.js @special-owner');
    });
  });

  describe('getRules', () => {
    it('should return all rules', () => {
      const content = `
* @global-owner
/docs/ @docs-team
*.js @js-team
`;
      const codeowners = parseCodeownersContent(content);
      const rules = getRules(codeowners);

      expect(rules).toHaveLength(3);
      expect(rules[0].rule).toBe('* @global-owner');
      expect(rules[1].rule).toBe('/docs/ @docs-team');
      expect(rules[2].rule).toBe('*.js @js-team');
    });

    it('should track match counts', () => {
      const content = `
* @global-owner
*.js @js-team
`;
      const codeowners = parseCodeownersContent(content);

      // Initially, no matches
      let rules = getRules(codeowners);
      expect(rules[0].matched).toBe(0);
      expect(rules[1].matched).toBe(0);

      // Match some files
      matchFile(codeowners, 'test.js');
      matchFile(codeowners, 'another.js');
      matchFile(codeowners, 'README.md');

      // Check counts
      rules = getRules(codeowners);
      expect(rules[0].matched).toBe(1); // README.md matched global
      expect(rules[1].matched).toBe(2); // test.js and another.js matched *.js
    });
  });

  describe('matchFiles', () => {
    it('should match multiple files', () => {
      const content = `
* @global-owner
/docs/ @docs-team
*.js @js-team
`;
      const codeowners = parseCodeownersContent(content);
      const files = ['test.js', 'docs/README.md', 'src/index.ts'];
      const ownershipMap = matchFiles(codeowners, files);

      expect(ownershipMap.size).toBe(3);
      expect(ownershipMap.get('test.js')).toEqual(['@js-team']);
      expect(ownershipMap.get('docs/README.md')).toEqual(['@docs-team']);
      expect(ownershipMap.get('src/index.ts')).toEqual(['@global-owner']);
    });

    it('should handle empty file list', () => {
      const content = `
* @global-owner
`;
      const codeowners = parseCodeownersContent(content);
      const ownershipMap = matchFiles(codeowners, []);

      expect(ownershipMap.size).toBe(0);
    });

    it('should handle files with no matches', () => {
      const content = `
/docs/ @docs-team
`;
      const codeowners = parseCodeownersContent(content);
      const files = ['src/test.js', 'README.md'];
      const ownershipMap = matchFiles(codeowners, files);

      expect(ownershipMap.size).toBe(2);
      expect(ownershipMap.get('src/test.js')).toEqual([]);
      expect(ownershipMap.get('README.md')).toEqual([]);
    });
  });

  describe('Pattern matching edge cases', () => {
    it('should handle patterns with leading slash', () => {
      const content = `
/src/ @src-team
`;
      const codeowners = parseCodeownersContent(content);

      expect(matchFile(codeowners, 'src/index.js')).toEqual(['@src-team']);
      expect(matchFile(codeowners, 'docs/src/test.js')).toEqual([]);
    });

    it('should handle patterns without leading slash', () => {
      const content = `
src/ @src-team
`;
      const codeowners = parseCodeownersContent(content);

      expect(matchFile(codeowners, 'src/index.js')).toEqual(['@src-team']);
      expect(matchFile(codeowners, 'docs/src/test.js')).toEqual(['@src-team']);
    });

    it('should handle /* pattern correctly', () => {
      const content = `
/* @root-files
`;
      const codeowners = parseCodeownersContent(content);

      // Should match root files only, not nested
      expect(matchFile(codeowners, 'README.md')).toEqual(['@root-files']);
      expect(matchFile(codeowners, 'package.json')).toEqual(['@root-files']);
      expect(matchFile(codeowners, 'src/index.js')).toEqual([]);
    });

    it('should handle /** pattern', () => {
      const content = `
/** @all-files
`;
      const codeowners = parseCodeownersContent(content);

      expect(matchFile(codeowners, 'README.md')).toEqual(['@all-files']);
      expect(matchFile(codeowners, 'src/index.js')).toEqual(['@all-files']);
      expect(matchFile(codeowners, 'docs/guide/intro.md')).toEqual(['@all-files']);
    });

    it('should handle question mark wildcard', () => {
      const content = `
test?.js @test-team
`;
      const codeowners = parseCodeownersContent(content);

      expect(matchFile(codeowners, 'test1.js')).toEqual(['@test-team']);
      expect(matchFile(codeowners, 'testa.js')).toEqual(['@test-team']);
      expect(matchFile(codeowners, 'test.js')).toEqual([]);
      expect(matchFile(codeowners, 'test12.js')).toEqual([]);
    });
  });

  describe('Owner validation', () => {
    it('should reject invalid owner formats', () => {
      const content = `
*.js invalid-owner
`;
      expect(() => parseCodeownersContent(content)).toThrow('invalid-owner is not a valid owner name');
    });

    it('should accept valid username format', () => {
      const content = `
*.js @valid-username
`;
      expect(() => parseCodeownersContent(content)).not.toThrow();
    });

    it('should accept valid org/team format', () => {
      const content = `
*.js @myorg/my-team
`;
      expect(() => parseCodeownersContent(content)).not.toThrow();
    });

    it('should accept valid email format', () => {
      const content = `
*.js user@example.com
`;
      expect(() => parseCodeownersContent(content)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const content = `
*.js invalid@email
`;
      expect(() => parseCodeownersContent(content)).toThrow('invalid@email is not a valid owner name');
    });
  });
});
