# Command

Configure the usage rights, effective interval, scope and other parameters of each command.

## Configuration parameters

- name

String type. Identifies the name of the command, starting with a slash, such as `/approve`.

- scopes

String array type. The fields in which the command can work, such as `['pull_comment', 'review', 'review_comment']` means that the command can only take effect in the PR comment area, Review area and Review comment area.

- intervalMinutes

Number type. The minimum time interval for two commands of the same to take effect, the default is 0.
