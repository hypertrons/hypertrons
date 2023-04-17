# Roles

Define the role type of the members in the warehouse. Different roles have different permission to use commands.

## Configuration parameters

- name

String type. The name of the role. There are two reserved roles: `notauthor`(which means the command can not br triggered by the author of the issue or pull request) and `anyone`(which means the commands can be triggered by anyone).

- description

String type. The description of the role.

- users

String array type. Users(GitHub logins) who have permissions to this role.

- commands

String array type. Commands that can be used by permissions of this role. See the `command` component.

## Related components

- [command](/component/command.md)
