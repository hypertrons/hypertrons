# GitHub Test Util

Help to test GitHub client from receiving webhooks event to calling raw API.

## Usage

Can refer to `./GitHubApp.test.ts`.

1 . Import `./GitHubTestUtil.ts`. Prepare for app. Init webhooks by `testResult = await initWebhooks(app);`. This step will also get a result array.

2 . Send webhooks event. Like `await sendToWebhooks(app, 'issues.opened')`. The method receive two variable and a optional variable. The first param is test app, the second is webhooks event type, the last is event payload. By default payload will be provided by event type.

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

See `./GitHubTestUtil.ts`.

The GitHubTestUtil simulate the real situation as much as possible. It only replace some methods related to network in this bot. Specifically, it do the following:

1. Mock GitHub raw client, replace all API with functions that push params into a result array.
2. To avoid network communication, rewrite the `getInstalledRepos()` and `addRepo()` in GitHubApp, mock the DataCat. Thus all data are fake.
3. Set specific global config, load private config from `./0_owner_repo.json`.
4. Provide `sendToWebhooks()` and `getPayload()` to simplify test cases. The previous method help to pass hash check, the latter return webhook event template based on event type.

## TODO

1. Thoroughly hijack network request without mock.
2. Provide methods to customize repo data.
