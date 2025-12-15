import test from 'ava';
import sinon from 'sinon';
import { initCommand, program } from '../cli/index.js';
import { GitHubClient, TokenManager } from '../cli/utils/github.js';

test.beforeEach(() => {
    sinon.stub(GitHubClient.prototype, 'getRepoInfo').resolves({ owner: 'test-owner', repo: 'test-repo' });
    sinon.stub(GitHubClient.prototype, 'verifyPermissions').resolves([]);
    sinon.stub(GitHubClient.prototype, 'createWorkflow').resolves({ status: 'created', workflowName: 'test.yml' });
});

test.afterEach.always(() => {
    sinon.restore();
});

test.serial('should show help message', async t => {
    const writeStub = sinon.stub(process.stdout, 'write');
    try {
        await program.parseAsync(['node', 'autodeploy', '--help'], { from: 'user' });
    } catch (e) {
        // an exit override will still throw an error
    }
    const output = writeStub.getCall(0).args[0];
    t.regex(output, /Usage: autodeploy/);
    writeStub.restore();
});

test.serial('should show version', async t => {
    const writeStub = sinon.stub(process.stdout, 'write');
    try {
        await program.parseAsync(['node', 'autodeploy', '--version'], { from: 'user' });
    } catch (e) {
        // an exit override will still throw an error
    }
    const output = writeStub.getCall(0).args[0];
    t.regex(output, /\d+\.\d+\.\d+/);
    writeStub.restore();
});

test.serial('init command should generate files non-interactively', async t => {
    const generateFiles = sinon.stub().resolves([{ path: 'test.txt', content: 'test' }]);
    const tokenManager = new TokenManager();
    sinon.stub(tokenManager, 'loadToken').resolves(null);

    const options = {
        projectType: 'web',
        framework: 'nextjs',
        budget: 'free',
        technical: 'beginner',
        projectName: 'my-project',
        autoSetup: false,
    };

    await initCommand(options, { generateFiles, tokenManager });

    t.true(generateFiles.calledOnce);
});
