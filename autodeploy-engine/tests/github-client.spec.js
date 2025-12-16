import test from 'ava';
import { GitHubClient } from '../cli/utils/github.js';
import nock from 'nock';
import sinon from 'sinon';

test.beforeEach(() => {
  nock.disableNetConnect();
});

test.afterEach.always(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

test.serial('getRepoInfo should parse owner and repo from git remote url', async t => {
  const execSyncStub = sinon.stub().returns('git@github.com:test-owner/test-repo.git');
  const client = new GitHubClient('test-token', { execSync: execSyncStub });

  const { owner, repo } = await client.getRepoInfo();

  t.is(owner, 'test-owner');
  t.is(repo, 'test-repo');
});

test.serial('getRepoInfo should throw an error if not a github repository', async t => {
    const execSyncStub = sinon.stub().returns('git@gitlab.com:test-owner/test-repo.git');
    const client = new GitHubClient('test-token', { execSync: execSyncStub });

    await t.throwsAsync(async () => {
        await client.getRepoInfo();
    }, { message: 'Could not detect GitHub repository. Make sure you have a git remote configured.' });
});

test.serial('verifyPermissions should return ok for all checks', async t => {
    const execSyncStub = sinon.stub().returns('git@github.com:test-owner/test-repo.git');
    const client = new GitHubClient('test-token', { execSync: execSyncStub });

  nock('https://api.github.com')
    .get('/repos/test-owner/test-repo')
    .reply(200, { permissions: { admin: true, push: true, pull: true } });

  const results = await client.verifyPermissions();

  t.true(results.every(r => r.status === 'ok'));
  t.is(results.length, 3);
});

test.serial('verifyPermissions should return failed for failed checks', async t => {
    const execSyncStub = sinon.stub().returns('git@github.com:test-owner/test-repo.git');
    const client = new GitHubClient('test-token', { execSync: execSyncStub });

    nock('https://api.github.com')
        .get('/repos/test-owner/test-repo')
        .reply(200, { permissions: { admin: false, push: false, pull: false } });

    const results = await client.verifyPermissions();

    t.true(results.every(r => r.status === 'failed'));
});

test.serial('createWorkflow should create a new workflow file', async t => {
    const execSyncStub = sinon.stub().returns('git@github.com:test-owner/test-repo.git');
    const client = new GitHubClient('test-token', { execSync: execSyncStub });

    const workflowPath = '.github/workflows/test.yml';
    nock('https://api.github.com')
      .get(`/repos/test-owner/test-repo/contents/${encodeURIComponent(workflowPath)}`)
      .reply(404);

    nock('https://api.github.com')
      .put(`/repos/test-owner/test-repo/contents/${encodeURIComponent(workflowPath)}`)
      .reply(201);

    const result = await client.createWorkflow('test.yml', 'content');

    t.is(result.status, 'created');
});

test.serial('createWorkflow should update an existing workflow file', async t => {
    const execSyncStub = sinon.stub().returns('git@github.com:test-owner/test-repo.git');
    const client = new GitHubClient('test-token', { execSync: execSyncStub });

    const workflowPath = '.github/workflows/test.yml';
    nock('https://api.github.com')
      .get(`/repos/test-owner/test-repo/contents/${encodeURIComponent(workflowPath)}`)
      .reply(200, { sha: '123' });

    nock('https://api.github.com')
      .put(`/repos/test-owner/test-repo/contents/${encodeURIComponent(workflowPath)}`)
      .reply(200);

    const result = await client.createWorkflow('test.yml', 'content');

    t.is(result.status, 'updated');
});

test.serial('createWorkflow should throw an error on failure', async t => {
    const execSyncStub = sinon.stub().returns('git@github.com:test-owner/test-repo.git');
    const client = new GitHubClient('test-token', { execSync: execSyncStub });

    const workflowPath = '.github/workflows/test.yml';
    nock('https://api.github.com')
        .get(`/repos/test-owner/test-repo/contents/${encodeURIComponent(workflowPath)}`)
        .reply(500);

    await t.throwsAsync(async () => {
        await client.createWorkflow('test.yml', 'content');
    });
});

test.serial('setSecret should set a repository secret', async t => {
    const execSyncStub = sinon.stub().returns('git@github.com:test-owner/test-repo.git');
    const client = new GitHubClient('test-token', { execSync: execSyncStub });
    sinon.stub(client, '_encryptSecret').resolves('encrypted-value');

    nock('https://api.github.com')
        .get('/repos/test-owner/test-repo/actions/secrets/public-key')
        .reply(200, { key_id: '123', key: 'abc' });

    nock('https://api.github.com')
        .put('/repos/test-owner/test-repo/actions/secrets/MY_SECRET')
        .reply(204);

    const result = await client.setSecret('MY_SECRET', 'my-value');
    t.is(result.secretName, 'MY_SECRET');
});

test.serial('triggerWorkflow should trigger a workflow', async t => {
    const execSyncStub = sinon.stub();
    execSyncStub.withArgs('git remote get-url origin', { encoding: 'utf8' }).returns('git@github.com:test-owner/test-repo.git');
    execSyncStub.withArgs('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).returns('my-branch');
    const client = new GitHubClient('test-token', { execSync: execSyncStub });

    nock('https://api.github.com')
        .post('/repos/test-owner/test-repo/actions/workflows/test.yml/dispatches', body => {
            return body.ref === 'my-branch';
        })
        .reply(204);

    const result = await client.triggerWorkflow('test.yml');
    t.is(result.workflowName, 'test.yml');
    t.is(result.branch, 'my-branch');
});

test.serial('getWorkflowRuns should return workflow runs', async t => {
    const execSyncStub = sinon.stub().returns('git@github.com:test-owner/test-repo.git');
    const client = new GitHubClient('test-token', { execSync: execSyncStub });

    nock('https://api.github.com')
        .get('/repos/test-owner/test-repo/actions/workflows/test.yml/runs?per_page=5')
        .reply(200, { workflow_runs: [{ id: 1 }] });

    const result = await client.getWorkflowRuns('test.yml');
    t.is(result.length, 1);
    t.is(result[0].id, 1);
});
