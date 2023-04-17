# Components

Component is a functional component provided by Hypertrons framework or custom developed, which can perform specific tasks. A component mainly includes `lua script file` (not required), `configuration definition` file, `default configuration` file and `version` file. The execution environment of the components is isolated, with the repository as the basic unit. Hypertrons has designed the components to be open source. Anyone can contribute new components or optimize existing components.

---

# For users

For users of Hypertrons, you don't need to know the details of Hypertrons framework or any components. You can directly use any components we provided to manage your community.

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

---

# For Developers

For component developers, you may need to know the basic APIs for components provided by Hypertrons framework.

## Triggers

The triggers of the Hypertrons component mainly includes the following two types:

- [schedule](/component/core/schedule.md)
- [event](/component/core/event.md)

## API

APIs are used to interact with exteranl paltform supported by Hypertrons.

- [API](/component/core/API.md)
