// cli/utils/github.js
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync as defaultExecSync } from 'child_process';

// Token storage location (encrypted)
const TOKEN_FILE = path.join(os.homedir(), '.autodeploy', 'tokens.enc');
const KEY_FILE = path.join(os.homedir(), '.autodeploy', '.key');

/**
 * GitHub API Client with fine-grained token support
 */
export class GitHubClient {
  constructor(token, { execSync = defaultExecSync } = {}) {
    this.octokit = new Octokit({ auth: token });
    this.token = token;
    this.execSync = execSync;
  }

  /**
   * Get repository details from git remote
   */
  async getRepoInfo() {
    try {
      const remoteUrl = this.execSync('git remote get-url origin', { encoding: 'utf8' }).trim();

      // Parse GitHub URL
      const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
      if (!match) throw new Error('Not a GitHub repository');

      return {
        owner: match[1],
        repo: match[2].replace('.git', '')
      };
    } catch (error) {
      throw new Error('Could not detect GitHub repository. Make sure you have a git remote configured.');
    }
  }

  /**
   * Verify token has required permissions
   */
  async verifyPermissions() {
    try {
      const { owner, repo } = await this.getRepoInfo();
      const { data: repoData } = await this.octokit.repos.get({ owner, repo });
      const permissions = repoData.permissions;

      // Test required permissions
      const checks = [
        { name: 'Read repository', test: () => permissions && permissions.pull },
        { name: 'Write workflows', test: () => permissions && permissions.push },
        { name: 'Create secrets', test: () => permissions && permissions.admin },
      ];

      const results = [];
      for (const check of checks) {
        if (check.test()) {
          results.push({ name: check.name, status: 'ok' });
        } else {
          results.push({ name: check.name, status: 'failed' });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Permission verification failed: ${error.message}`);
    }
  }

  /**
   * Create or update workflow file
   */
  async createWorkflow(workflowName, content) {
    const { owner, repo } = await this.getRepoInfo();
    const workflowPath = `.github/workflows/${workflowName}`;

    try {
      // Try to get existing file
      const { data } = await this.octokit.repos.getContent({ owner, repo, path: workflowPath });

      // Update existing file
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: workflowPath,
        message: `Update ${workflowName}`,
        content: Buffer.from(content).toString('base64'),
        sha: data.sha
      });

      return {
        workflowName,
        status: 'updated'
      }
    } catch (error) {
      if (error.status === 404) {
        // Create new file
        await this.octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: workflowPath,
          message: `Add ${workflowName}`,
          content: Buffer.from(content).toString('base64')
        });

        return {
          workflowName,
          status: 'created'
        }
      } else {
        throw error;
      }
    }
  }

  async _encryptSecret(secretValue, key) {
    // This is hard to test directly, so we extract it.
    const sodium = await import('libsodium-wrappers');
    await sodium.ready;

    const messageBytes = Buffer.from(secretValue);
    const keyBytes = Buffer.from(key, 'base64');
    const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
    return Buffer.from(encryptedBytes).toString('base64');
  }

  /**
   * Set repository secret
   */
  async setSecret(secretName, secretValue) {
    const { owner, repo } = await this.getRepoInfo();

    // Get public key for encryption
    const { data: { key, key_id } } = await this.octokit.actions.getRepoPublicKey({
      owner,
      repo
    });

    const encrypted = await this._encryptSecret(secretValue, key);

    // Create or update secret
    await this.octokit.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: secretName,
      encrypted_value: encrypted,
      key_id
    });

    return {
      secretName
    }
  }

  /**
   * Trigger workflow run
   */
  async triggerWorkflow(workflowName, ref) {
    const { owner, repo } = await this.getRepoInfo();
    let branch = ref;
    if (!branch) {
      branch = this.execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    }

    await this.octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowName,
      ref: branch
    });

    return {
      workflowName,
      branch
    }
  }

  /**
   * Create a release
   */
  async createRelease(tagName, releaseName, body, assets = []) {
    const { owner, repo } = await this.getRepoInfo();

    const { data: release } = await this.octokit.repos.createRelease({
      owner,
      repo,
      tag_name: tagName,
      name: releaseName,
      body,
      draft: false,
      prerelease: false
    });

    // Upload assets if any
    for (const asset of assets) {
      const data = await fs.readFile(asset.path);
      await this.octokit.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: release.id,
        name: asset.name,
        data
      });
    }

    console.log(chalk.green(`✓ Created release: ${tagName}`));
    return release.html_url;
  }

  /**
   * Get workflow runs
   */
  async getWorkflowRuns(workflowName) {
    const { owner, repo } = await this.getRepoInfo();

    const { data } = await this.octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowName,
      per_page: 5
    });

    return data.workflow_runs;
  }
}

/**
 * Token Manager - Securely store and retrieve tokens
 */
export class TokenManager {
  constructor() {
    this.ensureConfigDir();
  }

  ensureConfigDir() {
    const dir = path.dirname(TOKEN_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Get or create encryption key
   */
  async getEncryptionKey() {
    if (fs.existsSync(KEY_FILE)) {
      return await fs.readFile(KEY_FILE);
    }

    // Generate new key
    const key = crypto.randomBytes(32);
    await fs.writeFile(KEY_FILE, key, { mode: 0o600 });
    return key;
  }

  /**
   * Encrypt token
   */
  async encrypt(token) {
    const key = await this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt token
   */
  async decrypt(encrypted, iv, authTag) {
    const key = await this.getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Save token
   */
  async saveToken(token, scope = 'default') {
    const encrypted = await this.encrypt(token);

    let tokens = {};
    if (fs.existsSync(TOKEN_FILE)) {
      tokens = JSON.parse(await fs.readFile(TOKEN_FILE, 'utf8'));
    }

    tokens[scope] = encrypted;
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), { mode: 0o600 });
  }

  /**
   * Load token
   */
  async loadToken(scope = 'default') {
    if (!fs.existsSync(TOKEN_FILE)) {
      return null;
    }

    const tokens = JSON.parse(await fs.readFile(TOKEN_FILE, 'utf8'));
    const tokenData = tokens[scope];

    if (!tokenData) return null;

    return await this.decrypt(tokenData.encrypted, tokenData.iv, tokenData.authTag);
  }

  /**
   * Delete token
   */
  async deleteToken(scope = 'default') {
    if (!fs.existsSync(TOKEN_FILE)) return;

    const tokens = JSON.parse(await fs.readFile(TOKEN_FILE, 'utf8'));
    delete tokens[scope];

    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), { mode: 0o600 });
  }

  /**
   * List all token scopes
   */
  async listTokens() {
    if (!fs.existsSync(TOKEN_FILE)) {
      return [];
    }

    const tokens = JSON.parse(await fs.readFile(TOKEN_FILE, 'utf8'));
    return Object.keys(tokens);
  }
}

/**
 * Setup wizard for GitHub token
 */
export async function setupGitHubToken() {
  const inquirer = (await import('inquirer')).default;
  const tokenManager = new TokenManager();

  console.log(chalk.bold.blue('\n🔐 GitHub Token Setup\n'));

  console.log('To automate deployments, AutoDeploy needs a GitHub fine-grained token.\n');
  console.log(chalk.bold('Required permissions:'));
  console.log('  ✓ Repository: Contents (read & write)');
  console.log('  ✓ Repository: Secrets (read & write)');
  console.log('  ✓ Repository: Workflows (read & write)');
  console.log('  ✓ Repository: Actions (read & write)\n');

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '📝 Create new token (opens GitHub)', value: 'create' },
        { name: '🔑 Enter existing token', value: 'enter' },
        { name: '📋 List saved tokens', value: 'list' },
        { name: '🗑️  Delete saved token', value: 'delete' }
      ]
    }
  ]);

  if (action === 'create') {
    // Open GitHub token creation page
    const open = (await import('open')).default;
    const url = 'https://github.com/settings/personal-access-tokens/new';

    console.log(chalk.yellow('\n📖 Opening GitHub in your browser...\n'));
    console.log('Follow these steps:');
    console.log('1. Name: "AutoDeploy Engine"');
    console.log('2. Expiration: 90 days (recommended)');
    console.log('3. Repository access: Select specific repositories');
    console.log('4. Permissions:');
    console.log('   - Contents: Read & Write');
    console.log('   - Secrets: Read & Write');
    console.log('   - Workflows: Read & Write');
    console.log('   - Actions: Read & Write');
    console.log('5. Click "Generate token"\n');

    await open(url);

    const { token } = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Paste your token here:',
        validate: (input) => input.length > 0 || 'Token cannot be empty'
      }
    ]);

    await tokenManager.saveToken(token);
    console.log(chalk.green(`✓ Token saved securely`));

    // Verify token
    console.log(chalk.yellow('\nVerifying token permissions...'));
    const client = new GitHubClient(token);

    try {
      const results = await client.verifyPermissions();
      console.log('\nPermission check:');
      results.forEach(r => {
        const status = r.status === 'ok' ? chalk.green('✓') : chalk.red('✗');
        console.log(`${status} ${r.name}`);
      });

      const allOk = results.every(r => r.status === 'ok');
      if (allOk) {
        console.log(chalk.green('\n✨ Token verified and saved!\n'));
      } else {
        console.log(chalk.yellow('\n⚠️  Some permissions are missing. You may encounter issues.\n'));
      }
    } catch (error) {
      console.log(chalk.red(`\n✗ Verification failed: ${error.message}\n`));
    }

  } else if (action === 'enter') {
    const { token } = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Enter your GitHub token:',
        validate: (input) => input.length > 0 || 'Token cannot be empty'
      }
    ]);

    await tokenManager.saveToken(token);
    console.log(chalk.green('\n✓ Token saved!\n'));

  } else if (action === 'list') {
    const tokens = await tokenManager.listTokens();
    if (tokens.length === 0) {
      console.log(chalk.yellow('\nNo tokens saved.\n'));
    } else {
      console.log('\nSaved tokens:');
      tokens.forEach(scope => console.log(`  - ${scope}`));
      console.log();
    }

  } else if (action === 'delete') {
    const tokens = await tokenManager.listTokens();
    if (tokens.length === 0) {
      console.log(chalk.yellow('\nNo tokens to delete.\n'));
      return;
    }

    const { scope } = await inquirer.prompt([
      {
        type: 'list',
        name: 'scope',
        message: 'Select token to delete:',
        choices: tokens
      }
    ]);

    await tokenManager.deleteToken(scope);
  }
}

// Export all
export default {
  GitHubClient,
  TokenManager,
  setupGitHubToken
};