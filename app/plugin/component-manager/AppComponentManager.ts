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

import { Application } from 'egg';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { ComponentHelper, ComponentContext } from '../../basic/ComponentHelper';
import { Config } from './config/config.default';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export class AppComponentManager extends AppPluginBase<Config> {

  private componentHelper: ComponentHelper;

  constructor(config: Config, app: Application) {
    super(config, app);
    this.componentHelper = new ComponentHelper();
  }

  public async onReady(): Promise<void> {
    this.loadComponents();
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  protected checkConfigFields(): string[] {
    return [ 'basePath' ];
  }

  private loadComponents(): void {
    try {
      const basePath = join(this.app.baseDir, this.config.basePath);
      if (!existsSync(basePath)) {
        this.logger.info(`Component directory path not exists, path=${basePath}`);
        return;
      }
      const basePathInfo = statSync(basePath);
      if (!basePathInfo.isDirectory()) {
        this.logger.error(`Component base path is not a directory, path=${basePath}`);
        return;
      }
      const componentsDir = readdirSync(basePath);
      componentsDir.forEach(path => {
        this.loadComponent(join(basePath, path), path);
      });
    } catch (e) {
      this.logger.error(`Error while load components, e=${e}`);
    }
  }

  private async loadComponent(path: string, name: string): Promise<void> {
    try {
      this.logger.info(`Gonna load component under ${name}`);
      const pathInfo = statSync(path);
      if (!pathInfo.isDirectory()) {
        this.logger.error(`Component ${name} path is not a directory.`);
        return;
      }

      let config: any;
      try {
        config = await import(join(path, this.config.configModule));
        if (config.default) {
          config = config.default;
        }
      } catch {
        this.logger.warn(`Config module not exists for component ${name}`);
      }

      const component = await import(join(path, this.config.entryModule));
      if (!component.default || typeof(component.default) !== 'function') {
        this.logger.error(`Component ${name} not export a function`);
        return;
      }

      const logPrefix = `[component-${name}]`;
      const ctx: ComponentContext<any> = {
        helper: this.componentHelper,
        logger: {
          debug: (msg, ...args) => this.app.logger.debug(logPrefix, msg, ...args),
          info: (msg, ...args) => this.app.logger.info(logPrefix, msg, ...args),
          warn: (msg, ...args) => this.app.logger.warn(logPrefix, msg, ...args),
          error: (msg, ...args) => this.app.logger.error(logPrefix, msg, ...args),
        },
        app: this.app,
        config,
      };
      await component.default(ctx);

    } catch (e) {
      this.logger.error(`Error while load component ${name}, e=${e}`);
    }
  }

}
