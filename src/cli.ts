#!/usr/bin/env node
import * as path from 'path';

import { Command } from 'commander';

import { audit } from './commands/audit';
import { who } from './commands/who';
import { git } from './commands/git';
import { log } from './lib/logger';

import { OUTPUT_FORMAT } from './lib/types';
import { validate } from './commands/validate';

const { version } = require('../package.json');

const program = new Command();

program.version(version);

program.command('audit')
  .description('list the owners for all files')
  .option('-d, --dir <dirPath>', 'path to VCS directory', process.cwd())
  .option('-c, --codeowners <filePath>', 'path to codeowners file (default: "<dir>/.github/CODEOWNERS")')
  .option('-o, --output <outputFormat>', `how to output format eg: ${Object.values(OUTPUT_FORMAT).join(', ')}`, OUTPUT_FORMAT.SIMPLE)
  .option('-u, --unloved', 'write unowned files only', false)
  .option('-g, --only-git', 'consider only files tracked by git', false)
  .option('-s, --stats', 'write output stats', false)
  .option('-r, --root <rootPath>', 'the root path to filter files by', '')
  .action(async (options: any) => {
    try {
      if (!options.codeowners) {
        options.codeowners = path.resolve(options.dir, '.github/CODEOWNERS');
      }

      if (options.root) {
        options.dir = path.resolve(options.dir, options.root);
      }

      await audit(options);
    } catch (error) {
      log.error('failed to run audit command', error as Error);
      process.exit(1);
    }
  });

program.command('validate')
  .description('Validates a CODOWNER file and files in dir')
  .option('-d, --dir <dirPath>', 'path to VCS directory', process.cwd())
  .option('-c, --codeowners <filePath>', 'path to codeowners file (default: "<dir>/.github/CODEOWNERS")')
  .option('-r, --root <rootPath>', 'the root path to filter files by', '')
  .action(async (options: any) => {
    try {
      if (!options.codeowners) {
        options.codeowners = path.resolve(options.dir, '.github/CODEOWNERS');
      }

      if (options.root) {
        options.dir = path.resolve(options.dir, options.root);
      }

      await validate(options);
    } catch (error) {
      log.error('failed to run validate command', error as Error);
      process.exit(1);
    }
  });


program.command('who <files...>')
  .description('lists owners of a specific file or files')
  .option('-d, --dir <dirPath>', 'path to VCS directory', process.cwd())
  .option('-c, --codeowners <filePath>', 'path to codeowners file (default: "<dir>/.github/CODEOWNERS")')
  .option('-o, --output <outputFormat>', `how to output format eg: ${Object.values(OUTPUT_FORMAT).join(', ')}`, OUTPUT_FORMAT.SIMPLE)
  .action(async (files: any, options: any) => {
    try {
      if (files.length < 1) {
        throw new Error('a file must be defined');
      }

      options.files = files;

      if (!options.codeowners) {
        options.codeowners = path.resolve(options.dir, '.github/CODEOWNERS');
      }

      await who(options);
    } catch (error) {
      log.error('failed to run who command', error as Error);
      process.exit(1);
    }
  });

program.command('git [shaA] [shaB]')
  .description('lists owners of files changed between commits, a commit against head or staged against head')
  .option('-d, --dir <dirPath>', 'path to VCS directory', process.cwd())
  .option('-c, --codeowners <filePath>', 'path to codeowners file (default: "<dir>/.github/CODEOWNERS")')
  .option('-o, --output <outputFormat>', `how to output format eg: ${Object.values(OUTPUT_FORMAT).join(', ')}`, OUTPUT_FORMAT.SIMPLE)
  .option('-s, --stats', 'output stats, note: line counts are not available for this command', false)
  .action(async (shaA: any, shaB: any, options: any) => {
    try {
      if (!options.codeowners) {
        options.codeowners = path.resolve(options.dir, '.github/CODEOWNERS');
      }

      options.shaA = shaA;
      options.shaB = shaB;

      await git(options);
    } catch (error) {
      log.error('failed to run git command', error as Error);
      process.exit(1);
    }
  });


if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
