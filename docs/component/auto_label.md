# Auto Label

When a PR or issue with specific keywords in title is created or modified, the PR or issue will be labeled with a specific label.

## Configuration parameters

- actions

String array type. Will trigger the automatic labeling action, the default is `['opened', 'edited']`.

- events

String array type. The webhook event that will trigger adding a label . The default is `['IssueEvent', 'PullRequestEvent']`.

## Related components

- [label_setup](/component/label_setup.md)
