# Approve

When the user enters the "/approve" command in the PR comment area, the PR will be marked with a specific label.

(Subsequent operations can be carried out like merging PR, etc.)

Take the default parameters as an example:

Enter `/approve` in the PR comment area, then the PR will be labeled with `pull/approved`.

## Configuration Parameters

- label

String type. The label that will be added after entering the command, the default is `pull/approved`.

- command

String type. The command to add tags will be triggered. The default is `/approve`.

## Related Component

- command
- auto_label
