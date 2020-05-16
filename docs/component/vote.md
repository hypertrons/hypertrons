# Vote

## Usage

Vote component can help collect vote results. It is the vote initiator who decides which vote choice is finally accepted. Our bot only helps simplify this opinion-collecting process. You can set many customized configs to define your own vote summary info style. If you have questions about that, you can read config.ts and defaultConfig.ts [here](/app/component/vote).

### Start a vote

You can open a new issue when you needs to start a vote on something. You may describe some backgrounds in an issue body. And then start a new vote via a command which looks like the following format:
`/start-vote a,b,c,d replier,commiter 3d`

- The command `start-vote`  is defined in hypertrons config file. You can decide what role can execute this command.
- `a,b,c,d` is four candidate choices divided by comma.
- `replier,commiter`. Both replier and commiter are a kind of role name. It specifies who have right to vote. This is also defined in hypertrons config file. We support multiple roles here.
- `3d` means due date. In this example, the vote will be out-of-date exactly 3 days later. Our vote plugin also supports format like 10h which is short for 10 hours.

Don't worry about making mistakes. If you have spelling error or too many params, vote componet will give you corresponding warning. You can edit your command and update the wrong comment according to the hint.

### Join in a vote

`/vote a`

- The command `vote`  is defined in hypertrons config file.
- `a` is a vote choice from the initiator's start-vote command. The voter can always update their choice, vote component only record their latest choice under the hood. The voter can check vote summary info which is updated immediately after a vote.

Besides spelling and params check, we also check whether this user has right to vote and whether this vote has been out-of-date.

## Implementation

- When receiving `start-vote` command in an issue comment, we first add json formated vote info into the issue body after checking whether it is legal. We call these info as metadata. People can't see this info because we use markdown comment. And then we generate a blank vote summary info.
- When receiving `vote` command in an issue comment, we mainly check whether the voter has right to join in the vote and whether the vote is still valid.
- We regularly check all issues whether they are out of date according to its start time and duration. We add a `vote end` label issue if it's expired.

You can find source code [here](/app/component/vote).

## Limitation

Vote component has only been tested at github for now. So don't be surprised if you meet problems at gitlab or gitee. Haha contributions are very welcome here.

## Related Resource

You can find code and discussions about vote component in [Issue#199](https://github.com/hypertrons/hypertrons/issues/199) and [PR#207](https://github.com/hypertrons/hypertrons/pull/207).
