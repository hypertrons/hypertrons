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

import { Application, Context } from 'egg';
import { join } from 'path';
import assert from 'assert';
import { GloablEvents } from './Utils';

interface PluginLogger {
  debug: (msg: any, ...args: any[]) => void;
  info: (msg: any, ...args: any[]) => void;
  warn: (msg: any, ...args: any[]) => void;
  error: (msg: any, ...args: any[]) => void;
}

/**
 * Oss mentor bot app plugin base class
 * Provide basic functions:
 *   1. LoadToApp static function
 *   2. app hooks on start
 *   3. getConfig function to get config for certain repo
 */
export abstract class AppPluginBase<TConfig> {

  /**
   * Use this function to load plugin into app
   * @param name plugin name
   * @param constructor plugin class, need to derive from AppPluginBase
   * @param app application
   */
  static LoadToApp<T extends AppPluginBase<TConfig>, TConfig>
    (name: string, constructor: new (...args: any) => T, app: Application) {
    // check the plugin type should derive from base
    if (!Object.prototype.isPrototypeOf.call(AppPluginBase, constructor)) {
      throw new Error(`Invalid plugin type for ${name}`);
    }
    app.addSingleton(name, (config: TConfig, app: Application) => {
      const plugin = new constructor(config, app);
      plugin.name = name;
      plugin.logger.info('Going to load');
      return plugin;
    });
  }

  protected app: Application;
  protected name: string;
  protected config: TConfig;
  protected logger: PluginLogger;

  constructor(config: TConfig, app: Application) {
    this.app = app;
    this.config = config;
    const logPrefix = () => `[${this.name}-app]`;
    this.logger = {
      debug: (msg, ...args) => this.app.logger.debug(logPrefix(), msg, ...args),
      info: (msg, ...args) => this.app.logger.info(logPrefix(), msg, ...args),
      warn: (msg, ...args) => this.app.logger.warn(logPrefix(), msg, ...args),
      error: (msg, ...args) => this.app.logger.error(logPrefix(), msg, ...args),
    };
    this.checkConfigFields().forEach(f => this.checkConfig(config, f));
    this.app.messenger.on(GloablEvents.READY, () => {
      this.logger.info('Bot ready, start to run onReady.');
      this.onReady();
    });
    this.app.messenger.on(GloablEvents.START, () => {
      this.logger.info('Bot start, start to run onStart.');
      this.onStart();
    });
    this.app.messenger.on(GloablEvents.CLOSE, () => {
      this.logger.info('Bot close, start to run onClose.');
      this.onClose();
    });
  }

  /**
   * get method
   * @param path path
   * @param middlewares middlewares
   */
  protected get(path: string, ...middlewares: Middleware[]) {
    this.app.router.get(this.getRouterPath(path), ...middlewares);
  }

  /**
   * post method
   * @param path path
   * @param middlewares middlewares
   */
  protected post(path: string, ...middlewares: Middleware[]) {
    this.app.router.post(this.getRouterPath(path), ...middlewares);
  }

  /**
   * put method
   * @param path path
   * @param middlewares middlewares
   */
  protected put(path: string, ...middlewares: Middleware[]) {
    this.app.router.put(this.getRouterPath(path), ...middlewares);
  }

  /**
   * delete method
   * @param path path
   * @param middlewares middlewares
   */
  protected delete(path: string, ...middlewares: Middleware[]) {
    this.app.router.delete(this.getRouterPath(path), ...middlewares);
  }

  // generate router path, use plugin name as prefix
  private getRouterPath(path: string): string {
    return join('/', this.name, path);
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

/**
 * Middleware of koa
 */
type Middleware = (ctx: Context, next: any) => Promise<void>;
