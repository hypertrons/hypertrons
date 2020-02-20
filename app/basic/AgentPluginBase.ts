// Copyright 2019 - present Xlab
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

import { Agent } from 'egg';
import assert from 'assert';
import { GloablEvents, BotLogger, loggerWrapper } from './Utils';

/**
 * Hypertrons agent plugin base class
 * Provide basic functions:
 *   1. LoadToAgent static function
 *   2. agent hooks on start
 *   3. getConfig function to get config for certain repo
 */
export abstract class AgentPluginBase<TConfig> {

  /**
   * Use this function to load plugin into app
   * @param name plugin name
   * @param constructor plugin class, need to derive from AgentPluginBase
   * @param app application
   */
  static LoadToAgent<T extends AgentPluginBase<TConfig>, TConfig>
    (name: string, constructor: new (...args: any) => T, agent: Agent) {
    // check the plugin type should derive from base
    if (!Object.prototype.isPrototypeOf.call(AgentPluginBase, constructor)) {
      throw new Error(`Invalid plugin type for ${name}`);
    }
    agent.addSingleton(name, (config: TConfig, agent: Agent) => {
      const plugin = new constructor(config, agent);
      plugin.name = name;
      plugin.logger.info('Going to load');
      return plugin;
    });
  }

  protected agent: Agent;
  protected name: string;
  protected config: TConfig;
  public logger: BotLogger;

  constructor(config: TConfig, agent: Agent) {
    this.agent = agent;
    this.config = config;
    this.logger = loggerWrapper(this.agent.logger, () => `[${this.name}-agent]`);
    this.checkConfigFields().forEach(f => this.checkConfig(config, f));
    this.agent.messenger.on(GloablEvents.READY, () => {
      this.logger.info('Bot ready, start to run onReady.');
      this.onReady();
    });
    this.agent.messenger.on(GloablEvents.START, () => {
      this.logger.info('Bot start, start to run onStart.');
      this.onStart();
    });
    this.agent.messenger.on(GloablEvents.CLOSE, () => {
      this.logger.info('Bot close, start to run onClose.');
      this.onClose();
    });
  }

  // assert fields that should exists on the config
  protected checkConfigFields(): string[] {
    return [];
  }

  // check the config for specific field
  private checkConfig(config: TConfig, field: string): void {
    assert.notEqual(config[field], undefined);
  }

  /**
   * When plugin ready
   */
  public abstract async onReady(): Promise<void>;

  /**
   * When server start
   */
  public abstract async onStart(): Promise<void>;

  /**
   * When app close
   */
  public abstract async onClose(): Promise<void>;
}
