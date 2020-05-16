# Components

Component is a functional component provided by hypertrons, which can perform specific tasks. A component mainly includes `lua script file` (not required), `configuration definition` file, `default configuration` file and `version` file. The execution environment of the components is isolated, with the repository as the basic unit. Hypertrons has designed the components to be open source. Anyone can contribute new components or optimize existing components.

The triggering of the hypertrons component mainly includes the following two types:

- Scheduled tasks
- Event driven

Currently, we have following components:

- [approve](/component/approve.md)
- [auto_label](/component/auto_label.md)
- [ci](/component/ci.md)
- [command](/component/command.md)
- [complete_checklist](/component/complete_checklist.md)
- [im](/component/im.md)
- [label_setup](/component/label_setup.md)
- [rerun](/component/rerun.md)
- [role](/component/role.md)
- [self_assign](/component/self_assign.md)
- [vote](/component/vote.md)
