import test from 'ava';
import sinon from 'sinon';
import { initCommand } from '../cli/index.js';
import { GitHubClient, TokenManager } from '../cli/utils/github.js';
import inquirer from 'inquirer';

test.beforeEach(() => {
    sinon.stub(GitHubClient.prototype, 'getRepoInfo').resolves({ owner: 'test-owner', repo: 'test-repo' });
    sinon.stub(GitHubClient.prototype, 'verifyPermissions').resolves([]);
    sinon.stub(GitHubClient.prototype, 'createWorkflow').resolves({ status: 'created', workflowName: 'test.yml' });
});

test.afterEach.always(() => {
    sinon.restore();
});

test.serial('init command should generate files', async t => {
    const generateFiles = sinon.stub().resolves([{ path: 'test.txt', content: 'test' }]);
    const tokenManager = new TokenManager();
    sinon.stub(tokenManager, 'loadToken').resolves(null);
    sinon.stub(inquirer, 'prompt').resolves({
        projectType: 'web',
        framework: 'nextjs',
        budget: 'free',
        technical: 'beginner',
        projectName: 'my-project',
        useGitHub: false,
    });

    const options = {};

    await initCommand(options, { generateFiles, tokenManager });

    t.true(generateFiles.calledOnce);
});

test.serial('init command with --auto-setup should generate files and configure github', async t => {
    const generateFiles = sinon.stub().resolves([{ path: '.github/workflows/test.yml', content: 'test' }]);
    const tokenManager = new TokenManager();
    sinon.stub(tokenManager, 'loadToken').resolves('test-token');
    sinon.stub(inquirer, 'prompt').resolves({});

    const options = {
        projectType: 'web',
        framework: 'nextjs',
        budget: 'free',
        technical: 'beginner',
        projectName: 'my-project',
        autoSetup: true,
    };

    await initCommand(options, { generateFiles, tokenManager });

    t.true(generateFiles.calledOnce);
});
