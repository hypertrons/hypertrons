# Hypertrons

Hypertrons is an open source robot hosting platform which supports [GitHub](https://www.github.com) and [GitLab](https://www.gitlab.com).

## Start using Hypertrons

Hypertrons framework is written in [TypeScript](https://github.com/Microsoft/TypeScript) to improve development quality and the components are written in [Lua](https://www.lua.org) to improve security and support component hot fix/reload.

### Platform configuration

Run `npm install` after cloning the repository and add a `globalConfig.json` file to configure the robot account, the content of the file should be like below, and you can find a sample config in [`globalConfigTemplate.json`](https://github.com/hypertrons/hypertrons/blob/master/globalConfigTemplate.json).

For config details, please refer to [robot config](./docs/configs/README.md).

### Run the robot

Need to pass the config file into environment viriable `GLOBAL_CONFIG` and run `npm start` to start the robot.

You can also run the robot by [Docker](https://www.docker.com/), `Dockerfile` is provided to start the project, use `docker build` to build the image and use `docker run` to run the image. Notice that the port exposed by default is 7001.

### Configuration

Further configuration should be configured in specific repo or private local file, for more information please refer to [robot config](./docs/configs/README.md).

## Start developing Hypertrons

Before developing Hypertrons, please make sure you read [the contributing guide](https://github.com/hypertrons/hypertrons/blob/master/CONTRIBUTING.md) to understand the basic process and requirement of the project.

### Architecture

The underlying developing framework is [eggjs](https://eggjs.org/) which does a great job in cluster management, messenger system, router and logs stuff.

The upper layer is written in TypeScript and implement the event manager, schedule manager, hosting platform manager, etc.

On the client layer, [fengari](https://github.com/fengari-lua/fengari/) is used to provide a Lua VM approach using Node.js. [Limited Lua binding](https://github.com/hypertrons/hypertrons/blob/master/app/lua-vm/LuaVm.ts) is written to provide Lua code execution alibity in TypeScript.

The components are all written in Lua to provide hot fix/reload and logic customization.

For more details, please refer to [architecture](/architecture.md).

## Community

Hypertrons also use hypertrons(play as menbotics) to manage community, the community roles can be found in [config file](https://github.com/hypertrons/hypertrons/blob/master/.github/hypertrons.json).

## Support

If you have any questions or feature requests, please feel free to submit an issue.
