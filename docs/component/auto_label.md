# Auto Label

When a PR or issue containing a specific keyword is created or modified, the PR or issue will be tagged with a specific label.

## Configuration parameters

- actions

String array type. Will trigger the automatic labeling action, the default is `['opened', 'edited']`.

- events

String array type. The webhook event that will trigger adding a tag . The default is `['IssueEvent', 'PullRequestEvent']`.

## Related components

-label_setup
