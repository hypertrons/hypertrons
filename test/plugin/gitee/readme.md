# Gitee Test Util

Help to test Gitee client from receiving webhooks event to calling API.

## Usage

Can refer to `./gitee-app.test.ts`.

1 . Import `./gitee-test-util.ts`. Prepare for app. Init webhooks by `testResult = await initWebhooks(app);`. This step will also get a result array. The `globalConfig` and `repoData` will be provided By default, source files are `./data/global-config.json` and `./data/repo-data.json`. The previous offer hypertrons global config, the latter set init git repo data. They can also be customized by passing params.

2 . Send webhooks event. Like `await sendToWebhooks(app, headers, payload)`. The method receive three variables. The first param is test app, the second is webhooks event headers, the last is event payload. There are some webhook template in `./data/webhook`. They are all real webhook event records.

3 . Wait for about 30 ms since event transmission consumes time. Then check the result. The result is an array, whose first element is the API method name, the rest are the params that pass to it. Like:

``` ts
assert.deepStrictEqual(testResult, [
  [ 'issues.addLabels',
    {
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      labels: [ 'difficulty/5' ],
    },
  ],
]);
```

4 . If need to test for multiple times in a file, use `testResult.length = 0;` to reset result.

## Mechanism

See `./gitee-test-util.ts`.

The GiteeTestUtil simulate the real situation as much as possible. It only replace some methods related to network in this bot. Specifically, it do the following:

1. Mock Gitee client, replace all API with functions that push params into a result array.
2. To avoid network communication, rewrite the `getInstalledRepos()` and `addRepo()` in GitHubApp, mock the rawClient. Thus all data are fake.
3. Set specific global config, load private config from `./0_owner_repo.json`.
4. Provide `sendToWebhooks()` and some webhook template to simplify test cases. The previous method help to pass hash check, the latter offer webhook event template based on real payload.

## Notice

The webhook payload's owner and repo data, have to keep in line with that in custom.repoData. Or the test won't work correctly.

VERY IMPORTANT!!!

e.g. `./data/repo-data.json` is a repo data template. `./data/webhook/**` are webhook response. The latter's owner is `goodmeowing` and repo name is `push_test`. So the former's attributes: `owner` and `name` should keep the same.

As long as you obey this rule, you can custom your own test data.

## TODO

1. Support series webhook event test. In other word, a test begin with a webhook event, but does not end with sending a request. Because hypertrons might receive another webhook event, which are caused by last request.
