#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import simpleGit from 'simple-git';
import { generateFiles } from './commands/generate.js';

const program = new Command();
const git = simpleGit();

program
  .name('autodeploy')
  .description('Generate production-ready CI/CD configurations')
  .version('1.0.0');

program
  .command('init')
  .description('Interactive setup wizard')
  .option('-t, --projectType <type>', 'Project type (web, android, backend, fullstack)')
  .option('-f, --framework <framework>', 'Framework (Next.js, React, etc.)')
  .option('-b, --budget <budget>', 'Budget (free, low, medium, pro, pro-azure)')
  .option('-l, --technical <level>', 'Technical level (beginner, intermediate, advanced)')
  .option('-n, --projectName <name>', 'Project name')
  .action(async (options) => {
    console.log(chalk.bold.blue('\n🚀 AutoDeploy Engine\n'));

    // Check if in git repo
    if (!options.projectType) {
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        console.log(chalk.yellow('⚠️  Not a git repository. Initialize? (y/n)'));
        const { shouldInit } = await inquirer.prompt([{
          type: 'confirm',
          name: 'shouldInit',
          message: 'Initialize git repository?',
          default: true
        }]);

        if (shouldInit) {
          await git.init();
          console.log(chalk.green('✓ Git repository initialized'));
        }
      }
    }

    let answers = { ...options };

    if (!options.projectType) {
      // Interactive questions
      answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectType',
          message: 'What are you deploying?',
          choices: [
            { name: '🌐 Web Application (React, Next.js, Vue)', value: 'web' },
            { name: '📱 Android App (Flutter, React Native)', value: 'android' },
            { name: '⚙️  Backend API (Node, Python, Go)', value: 'backend' },
            { name: '🔄 Full Stack (Frontend + Backend + DB)', value: 'fullstack' }
          ]
        },
        {
          type: 'list',
          name: 'framework',
          message: 'Which framework?',
          choices: (answers) => {
            const frameworks = {
              web: ['Next.js', 'React (Vite)', 'Vue.js', 'Static HTML'],
              android: ['Flutter', 'React Native', 'Native Android'],
              backend: ['Node.js', 'Python', 'Go'],
              fullstack: ['Next.js + Node', 'React + Python', 'Custom']
            };
            return frameworks[answers.projectType];
          }
        },
        {
          type: 'list',
          name: 'budget',
          message: 'Monthly budget?',
          choices: [
            { name: '💚 Free ($0)', value: 'free' },
            { name: '💙 Low ($5-20)', value: 'low' },
            { name: '💛 Medium ($20-100)', value: 'medium' },
            { name: '🚀 Production (AWS)', value: 'pro' },
            { name: '🔷 Production (Azure)', value: 'pro-azure' }
          ]
        },
        {
          type: 'list',
          name: 'technical',
          message: 'Your comfort level?',
          choices: [
            { name: '🌱 Beginner (I avoid config files)', value: 'beginner' },
            { name: '🔧 Intermediate (I can follow tutorials)', value: 'intermediate' },
            { name: '⚡ Advanced (I know Docker/K8s)', value: 'advanced' }
          ]
        },
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name?',
          default: path.basename(process.cwd()),
          validate: function (input) {
            if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
            else return 'Project name may only include letters, numbers, underscores and hashes.';
          }
        }
      ]);
    }

    // Check for existing files
    const files = await generateFiles(answers);
    const existingFiles = files.filter(file => fs.existsSync(path.join(process.cwd(), file.path)));
    if (existingFiles.length > 0) {
      console.log(chalk.yellow('\n⚠️  The following files already exist:'));
      existingFiles.forEach(file => console.log(chalk.gray('  - ') + file.path));
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite these files?',
        default: false
      }]);
      if (!overwrite) {
        console.log(chalk.red('Aborted.'));
        return;
      }
    }

    // Generate files
    const spinner = ora('Generating configuration files...').start();

    try {
      // Write files
      for (const file of files) {
        const filePath = path.join(process.cwd(), file.path);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, file.content);
      }

      spinner.succeed(chalk.green(`Generated ${files.length} files`));

      console.log(chalk.bold('\n📦 Created files:'));
      files.forEach(f => console.log(chalk.gray('  - ') + f.path));

      console.log(chalk.bold.blue('\n✨ Next steps:\n'));
      console.log('1. Review README-DEPLOYMENT.md');
      console.log('2. Add secrets to GitHub (if needed)');
      console.log('3. git add . && git commit -m "Add deployment config"');
      console.log('4. git push origin main');
      console.log('\n🚀 Your app will deploy automatically!\n');

    } catch (error) {
      spinner.fail(chalk.red('Error generating files'));
      console.error(error);
    }
  });

program
  .command('generate')
  .description('Generate specific configuration')
  .option('-p, --platform <platform>', 'Platform (vercel, netlify, railway)')
  .option('-t, --type <type>', 'Project type (web, android, backend)')
  .action(async (options) => {
    // Quick generation without prompts
    console.log(chalk.blue('Generating for'), options.platform);
    // Implementation...
  });

program.parse();
