# Lua Component Test Util

Help to test .lua file in app environment.

## Usage

Can refer to `./approve/approve.test.ts` or `./auto_merge/auto_merge.test.ts`

1 . Import `./LuaTestUtil.ts`. Init luaVmWrapper by `luaVmWrapper = await prepareLuaTest(__dirname);`. The param can be the component name or directly global var __dirname. You can also set customized config and injected lua method by opt. Like:

``` ts
luaVmWrapper = await prepareLuaTest(__dirname, {
  injectMap: new Map().set('getData', () => ({
    pulls: [
      {
        number: 1,
        labels: [
          'pull/approved',
        ],
        closedAt: null,
      },
    ],
  })),
});
```

2 . Call the `publish` method(for the 'on' function in lua) or `invoke` method(for the 'sched' function in lua). The previous receive a lua event type and the corresponding lua event. The latter receive a sched job name, then the sched job will be exec immediately. And get the result. Like:

``` ts
const result = luaVmWrapper.publish('CommandEvent', {
        number: 42,
        command: '/approve',
      });
```

3 . Check the result. The result is an array, whose first element is the injected method name, the rest are the params that pass to it. Like:

``` ts
assert.deepStrictEqual(result, [
  [ 'addLabels', 42, [ 'pull/approved' ]],
]);
```

4 . If need to test for multiple times in a file, use `luaVmWrapper.clean();` to reset result.

## Mechanism

See `./LuaTestUtil.ts`.

The LuaTestUtil wrap a luaVm and provide `publish`, `invoke`, `clean` method to handle test. The Util load config from `.github/hypertrons` and search component from `app/component/`. By default it mock all injected lua methods and replace it with a function that push params into a result array.

Besides, it rewrite the `on` and `sched` methods. The callback functions that provided to these two will be triggered immediately after `publish` and `invoke` are called.
