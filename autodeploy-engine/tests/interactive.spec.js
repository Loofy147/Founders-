import test from 'ava';
import run, { ENTER } from 'inquirer-test';
import path from 'path';
import { fileURLToPath } from 'url';
import sinon from 'sinon';
import { GitHubClient, TokenManager } from '../cli/utils/github.js';
import * as generate from '../cli/commands/generate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.join(__dirname, '../cli/run.js');

test.beforeEach(() => {
    sinon.stub(GitHubClient.prototype, 'getRepoInfo').resolves({ owner: 'test-owner', repo: 'test-repo' });
    sinon.stub(GitHubClient.prototype, 'verifyPermissions').resolves([]);
    sinon.stub(GitHubClient.prototype, 'createWorkflow').resolves({ status: 'created', workflowName: 'test.yml' });
    sinon.stub(GitHubClient.prototype, 'triggerWorkflow').resolves({ workflowName: 'test.yml', branch: 'main' });
    sinon.stub(GitHubClient.prototype, 'getWorkflowRuns').resolves([]);
    sinon.stub(generate, 'generateFiles').resolves([{ path: 'test.txt', content: 'test' }]);
});

test.afterEach.always(() => {
    sinon.restore();
});

test.serial('init command should generate files', async t => {
    const result = await run([cliPath, 'init'], [ENTER, ENTER, ENTER, ENTER, 'my-project', ENTER, ENTER]);
    t.regex(result, /Generated 1 files/);
});

test.serial('github command should show setup options', async t => {
    const result = await run([cliPath, 'github'], [ENTER]);
    t.regex(result, /What would you like to do?/);
});

test.serial('deploy command should trigger a deployment', async t => {
    sinon.stub(TokenManager.prototype, 'loadToken').resolves('test-token');
    const result = await run([cliPath, 'deploy'], []);
    t.regex(result, /Deployment triggered/);
});

test.serial('status command should show deployment status', async t => {
    sinon.stub(TokenManager.prototype, 'loadToken').resolves('test-token');
    const result = await run([cliPath, 'status'], []);
    t.regex(result, /No deployments yet/);
});
