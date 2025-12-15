#!/usr/bin/env node

// cli/index.js - Enhanced with GitHub integration

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { generateFiles as defaultGenerateFiles } from './commands/generate.js';
import { GitHubClient, TokenManager, setupGitHubToken } from './utils/github.js';
import simpleGit from 'simple-git';

export const program = new Command();
const git = simpleGit();

export async function initCommand(options, { generateFiles = defaultGenerateFiles, tokenManager = new TokenManager() } = {}) {
    console.log(chalk.bold.blue('\n🚀 AutoDeploy Engine\n'));

    // Check if in git repo
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      const { shouldInit } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldInit',
        message: 'Not a git repository. Initialize?',
        default: true
      }]);

      if (shouldInit) {
        await git.init();
        console.log(chalk.green('✓ Git repository initialized'));
      }
    }

    // Step 1: Gather project info
    let answers = { ...options };

    if (!options.projectType) {
      answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectType',
          message: 'What are you deploying?',
          choices: [
            { name: '🌐 Web Application', value: 'web' },
            { name: '📱 Android App', value: 'android' },
            { name: '⚙️  Backend API', value: 'backend' },
            { name: '🔄 Full Stack', value: 'fullstack' }
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
              fullstack: ['Next.js + Node', 'React + Python']
            };
            return frameworks[answers.projectType] || ['Next.js'];
          }
        },
        {
          type: 'list',
          name: 'budget',
          message: 'Monthly budget?',
          choices: [
            { name: '💚 Free ($0)', value: 'free' },
            { name: '💙 Low ($5-20)', value: 'low' }
          ]
        },
        {
          type: 'list',
          name: 'technical',
          message: 'Your comfort level?',
          choices: [
            { name: '🌱 Beginner', value: 'beginner' },
            { name: '🔧 Intermediate', value: 'intermediate' },
            { name: '⚡ Advanced', value: 'advanced' }
          ]
        },
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name?',
          default: path.basename(process.cwd())
        },
        {
          type: 'confirm',
          name: 'useGitHub',
          message: 'Automatically configure GitHub? (requires token)',
          default: false,
          when: () => !options.autoSetup
        }
      ]);
    } else {
      answers.useGitHub = options.autoSetup;
    }

    // Step 2: Generate files
    const spinner = ora('Generating configuration files...').start();

    try {
      const files = await generateFiles(answers);
      const existingFiles = files.filter(file => fs.existsSync(path.join(process.cwd(), file.path)));
      if (existingFiles.length > 0) {
        spinner.stop();
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
        spinner.start('Generating configuration files...');
      }

      for (const file of files) {
        const filePath = path.join(process.cwd(), file.path);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, file.content);
      }

      spinner.succeed(chalk.green(`Generated ${files.length} files`));

      console.log(chalk.bold('\n📦 Created files:'));
      files.forEach(f => console.log(chalk.gray('  - ') + f.path));

      // Step 3: GitHub auto-setup
      if (answers.useGitHub) {
        spinner.start('Setting up GitHub integration...');

        let token = await tokenManager.loadToken();

        if (!token) {
          spinner.stop();
          console.log(chalk.yellow('\n⚠️  No GitHub token found.\n'));
          const { shouldSetup } = await inquirer.prompt([{
            type: 'confirm',
            name: 'shouldSetup',
            message: 'Set up GitHub token now?',
            default: true
          }]);

          if (shouldSetup) {
            await setupGitHubToken();
            token = await tokenManager.loadToken();
          }
        }

        if (token) {
          const github = new GitHubClient(token);

          try {
            // Push workflows to GitHub
            for (const file of files) {
              if (file.path.startsWith('.github/workflows/')) {
                const result = await github.createWorkflow(path.basename(file.path), file.content);
                if (result.status === 'created') {
                  spinner.succeed(chalk.green(`✓ Created workflow: ${result.workflowName}`));
                } else {
                  spinner.succeed(chalk.green(`✓ Updated workflow: ${result.workflowName}`));
                }
              }
            }

            // Set up secrets if needed (e.g., for Android)
            if (answers.projectType === 'android') {
              const { setupSecrets } = await inquirer.prompt([{
                type: 'confirm',
                name: 'setupSecrets',
                message: 'Set up Android signing secrets now?',
                default: false
              }]);

              if (setupSecrets) {
                const secrets = await inquirer.prompt([
                  { type: 'password', name: 'keystoreBase64', message: 'KEYSTORE_BASE64:' },
                  { type: 'password', name: 'keystorePassword', message: 'KEY_STORE_PASSWORD:' },
                  { type: 'input', name: 'keyAlias', message: 'KEY_ALIAS:', default: 'upload' },
                  { type: 'password', name: 'keyPassword', message: 'KEY_PASSWORD:' }
                ]);

                const keystoreBase64Result = await github.setSecret('KEYSTORE_BASE64', secrets.keystoreBase64);
                spinner.succeed(chalk.green(`✓ Set secret: ${keystoreBase64Result.secretName}`));
                const keystorePasswordResult = await github.setSecret('KEY_STORE_PASSWORD', secrets.keystorePassword);
                spinner.succeed(chalk.green(`✓ Set secret: ${keystorePasswordResult.secretName}`));
                const keyAliasResult = await github.setSecret('KEY_ALIAS', secrets.keyAlias);
                spinner.succeed(chalk.green(`✓ Set secret: ${keyAliasResult.secretName}`));
                const keyPasswordResult = await github.setSecret('KEY_PASSWORD', secrets.keyPassword);
                spinner.succeed(chalk.green(`✓ Set secret: ${keyPasswordResult.secretName}`));
              }
            }

            spinner.succeed(chalk.green('GitHub configured successfully!'));
          } catch (error) {
            spinner.fail(chalk.red(`GitHub setup failed: ${error.message}`));
          }
        }
      }

      // Step 4: Show next steps
      console.log(chalk.bold.blue('\n✨ Next steps:\n'));

      if (answers.useGitHub) {
        console.log('1. Review generated files');
        console.log('2. git add . && git commit -m "Add deployment config"');
        console.log('3. git push origin main');
        console.log('4. GitHub Actions will run automatically! 🎉\n');
      } else {
        console.log('1. Review README-DEPLOYMENT.md');
        console.log('2. Set up GitHub manually (or run: autodeploy github setup)');
        console.log('3. git add . && git commit -m "Add deployment config"');
        console.log('4. git push origin main\n');
      }

    } catch (error) {
      spinner.fail(chalk.red('Error generating files'));
      console.error(error);
      process.exit(1);
    }
}


program
  .name('autodeploy')
  .description('Generate and deploy CI/CD configurations automatically')
  .version('1.0.0');

// ============================================
// COMMAND: init (with optional auto-setup)
// ============================================
program
  .command('init')
  .description('Interactive setup wizard')
  .option('--auto-setup', 'Automatically push to GitHub and configure')
  .option('-t, --projectType <type>', 'Project type (web, android, backend, fullstack)')
  .option('-f, --framework <framework>', 'Framework (Next.js, React, etc.)')
  .option('-b, --budget <budget>', 'Budget (free, low, medium, pro, pro-azure)')
  .option('-l, --technical <level>', 'Technical level (beginner, intermediate, advanced)')
  .option('-n, --projectName <name>', 'Project name')
  .action(initCommand);

// ============================================
// COMMAND: github (token management)
// ============================================
program
  .command('github')
  .description('Manage GitHub integration')
  .action(async () => {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🔐 Setup token', value: 'setup' },
        { name: '✅ Verify token', value: 'verify' },
        { name: '🚀 Trigger workflow', value: 'trigger' },
        { name: '📊 View workflow runs', value: 'runs' },
        { name: '🗑️  Delete token', value: 'delete' }
      ]
    }]);

    const tokenManager = new TokenManager();

    if (action === 'setup') {
      await setupGitHubToken();

    } else if (action === 'verify') {
      const token = await tokenManager.loadToken();
      if (!token) {
        console.log(chalk.red('\n✗ No token found. Run: autodeploy github setup\n'));
        return;
      }

      const spinner = ora('Verifying token...').start();
      const github = new GitHubClient(token);

      try {
        const results = await github.verifyPermissions();
        spinner.stop();

        console.log('\nPermission check:');
        results.forEach(r => {
          const status = r.status === 'ok' ? chalk.green('✓') : chalk.red('✗');
          console.log(`${status} ${r.name}`);
        });
        console.log();
      } catch (error) {
        spinner.fail(chalk.red(`Verification failed: ${error.message}`));
      }

    } else if (action === 'trigger') {
      const token = await tokenManager.loadToken();
      if (!token) {
        console.log(chalk.red('\n✗ No token found.\n'));
        return;
      }

      const { workflow } = await inquirer.prompt([{
        type: 'input',
        name: 'workflow',
        message: 'Workflow file name (e.g., android-build.yml):',
        validate: input => input.length > 0
      }]);

      const spinner = ora('Triggering workflow...').start();
      const github = new GitHubClient(token);

      try {
        const result = await github.triggerWorkflow(workflow);
        spinner.succeed(chalk.green(`✓ Triggered workflow: ${result.workflowName} on branch ${result.branch}`));
        const { owner, repo } = await github.getRepoInfo();
        console.log(`\nView progress: https://github.com/${owner}/${repo}/actions\n`);
      } catch (error) {
        spinner.fail(chalk.red(`Failed: ${error.message}`));
      }

    } else if (action === 'runs') {
      const token = await tokenManager.loadToken();
      if (!token) {
        console.log(chalk.red('\n✗ No token found.\n'));
        return;
      }

      const { workflow } = await inquirer.prompt([{
        type: 'input',
        name: 'workflow',
        message: 'Workflow file name:',
        default: 'android-build.yml'
      }]);

      const spinner = ora('Fetching workflow runs...').start();
      const github = new GitHubClient(token);

      try {
        const runs = await github.getWorkflowRuns(workflow);
        spinner.stop();

        if (runs.length === 0) {
          console.log(chalk.yellow('\nNo workflow runs found.\n'));
          return;
        }

        console.log('\nRecent runs:');
        runs.forEach(run => {
          const status = run.conclusion === 'success' ? chalk.green('✓') :
                        run.conclusion === 'failure' ? chalk.red('✗') :
                        chalk.yellow('⏳');
          console.log(`${status} ${run.name} - ${run.head_branch} - ${run.created_at}`);
        });
        console.log();
      } catch (error) {
        spinner.fail(chalk.red(`Failed: ${error.message}`));
      }

    } else if (action === 'delete') {
      await tokenManager.deleteToken();
      console.log(chalk.green(`✓ Token deleted`));
    }
  });

// ============================================
// COMMAND: deploy (trigger deployment)
// ============================================
program
  .command('deploy')
  .description('Trigger deployment workflow')
  .option('-w, --workflow <name>', 'Workflow name', 'deploy.yml')
  .action(async (options) => {
    const tokenManager = new TokenManager();
    const token = await tokenManager.loadToken();

    if (!token) {
      console.log(chalk.red('\n✗ No GitHub token found.'));
      console.log('Run: autodeploy github setup\n');
      return;
    }

    const spinner = ora('Deploying...').start();
    const github = new GitHubClient(token);

    try {
      const result = await github.triggerWorkflow(options.workflow);
      spinner.succeed(chalk.green(`✓ Deployment triggered: ${result.workflowName} on branch ${result.branch}`));

      const { owner, repo } = await github.getRepoInfo();
      console.log(`\n📊 View progress: https://github.com/${owner}/${repo}/actions\n`);
    } catch (error) {
      spinner.fail(chalk.red(`Deployment failed: ${error.message}`));
    }
  });

// ============================================
// COMMAND: status (check deployment status)
// ============================================
program
  .command('status')
  .description('Check deployment status')
  .action(async () => {
    const tokenManager = new TokenManager();
    const token = await tokenManager.loadToken();

    if (!token) {
      console.log(chalk.red('\n✗ No GitHub token found.\n'));
      return;
    }

    const spinner = ora('Checking status...').start();
    const github = new GitHubClient(token);

    try {
      const runs = await github.getWorkflowRuns('deploy.yml');
      spinner.stop();

      if (runs.length === 0) {
        console.log(chalk.yellow('\nNo deployments yet.\n'));
        return;
      }

      const latest = runs[0];
      const status = latest.conclusion === 'success' ? chalk.green('SUCCESS') :
                    latest.conclusion === 'failure' ? chalk.red('FAILED') :
                    chalk.yellow('RUNNING');

      console.log(`\nLatest deployment: ${status}`);
      console.log(`Branch: ${latest.head_branch}`);
      console.log(`Started: ${new Date(latest.created_at).toLocaleString()}`);
      console.log(`URL: ${latest.html_url}\n`);
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${error.message}`));
    }
  });

if (process.env.NODE_ENV === 'test') {
    program.exitOverride();
}
