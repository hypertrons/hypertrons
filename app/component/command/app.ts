// Copyright 2019 Xlab
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { ComponentContext } from '../../basic/ComponentHelper';
import Config from './config';
import RoleConfig from '../role/config';
import { CommandManagerNewCommandEvent } from '../../plugin/event-manager/events';
// import { IClient } from '../../plugin/installation-manager/IClient';

export default async (ctx: ComponentContext<Config>) => {
  ctx.logger.info('Start to load command component');

  ctx.app.event.subscribeOne(CommandManagerNewCommandEvent, async p => {
    execCommand(p);
  });

  /**
   * check user auth and decide whether to execute command
   * @param e
   */
  async function execCommand(e: CommandManagerNewCommandEvent): Promise<void> {
    // config check
    if (e.from === 'issue' && !e.issue) return;
    if (e.from === 'comment' && !e.comment) return;
    if (!e.client) return;
    const config = e.client.getCompConfig<Config>(ctx.name);
    const roleConfig = e.client.getCompConfig<RoleConfig>('role');
    if (!config || !config.enable || !roleConfig) return;

    // get user role
    let userRole;
    const roles = roleConfig.roles;
    for (let i = 0; !userRole && i < roles.length; i++) {
      const users = roles[i].users;
      for (const user of users) {
        if (user === e.login) {
          userRole = roles[i].name;
          break;
        }
      }
    }
    if (!userRole) return;

    // check auth and exec
    let auth;
    for (const a of config.auth) {
      if (a.role === userRole) {
        auth = a;
        break;
      }
    }
    for (const c of auth.command) {
      if (c === e.command.exec) {
        await exec(e);
        ctx.logger.info(`Execute command ${e.command.exec} with param ${JSON.stringify(e.command.param)}.`);
        break;
      }
    }

  }

  /**
   * do the command execution
   * @param e
   */
  async function exec(e: CommandManagerNewCommandEvent): Promise<void> {
    // NOTE: Only users with push access can add assignees to an issue.
    // so maybe our bot need new auth.
    switch (e.command.exec) {
      case '/assign':
        if (e.command.param.length === 0) {
          await (e.client as any).addAssignees(e.issueNumber, [ e.login ]);
        } else {
          await (e.client as any).addAssignees(e.issueNumber, e.command.param);
        }
        break;
      case '/close':
        break;
      default:
        break;
    }
  }

};
