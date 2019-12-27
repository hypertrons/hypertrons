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
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { waitUntil, BotLogger, loggerWrapper } from '../../basic/Utils';
import { cloneDeep } from 'lodash';
import { getConfigMeta } from '../../config-generator/decorators';
import { ComponentConfig } from './HostingConfigBase';

export class ComponentService {

  private app: Application;
  private logger: BotLogger;
  private config: ComponentConfig;
  private componentLoaded: boolean;
  private configStructure: any;
  private components: any;

  constructor(hostName: string, config: ComponentConfig, app: Application) {
    this.app = app;
    this.logger = loggerWrapper(app.logger, `[host-${hostName}-component-service]`);
    this.config = config;
    this.componentLoaded = false;
    this.components = { };
    this.configStructure = { };
  }

  public getLatestConfigStructure(): any {
    return this.components;
  }

  public getConfigStructureByVersion(name: string, version: number): any {
    if (this.components[name] && this.components[name][version]) return this.components[name][version];
    return {};
  }

  // protected checkConfigFields(): string[] {
  //   return [ 'basePath', 'entryModule', 'configModule' ];
  // }

  public getComponentLoaded(): boolean {
    return this.componentLoaded;
  }

  public getComponents(): any {
    return this.components;
  }

  public setComponents(comp: any) {
    this.components = comp;
  }

  public async loadComponents(): Promise<any> {
    try {
      const basePath = join(this.app.baseDir, this.config.file.basePath);
      if (!existsSync(basePath)) {
        this.logger.info(`Component directory path not exists, path=${basePath}`);
        return undefined;
      }
      const basePathInfo = statSync(basePath);
      if (!basePathInfo.isDirectory()) {
        this.logger.error(`Component base path is not a directory, path=${basePath}`);
        return undefined;
      }
      const componentsDir = readdirSync(basePath);
      for (const index in componentsDir) {
        await this.loadComponent(join(basePath, componentsDir[index]), componentsDir[index]);
      }
      this.componentLoaded = true;
      return this.components;
    } catch (e) {
      this.logger.error(`Error while load components, e=${e}`);
    }
  }

  private async loadComponent(path: string, name: string): Promise<void> {
    try {
      // check if path exist
      this.logger.info(`Gonna load component under ${name}`);
      const pathInfo = statSync(path);
      if (!pathInfo.isDirectory()) {
        this.logger.error(`Component ${name} path is not a directory.`);
        return;
      }

      // get version
      const versionPath = join(path, this.config.file.versionPath);
      if (!existsSync(versionPath)) {
        this.logger.error(`Component ${name} version file not exist.`);
        return;
      }
      const version = JSON.parse(readFileSync(versionPath).toString());
      if (isNaN(version.version) || isNaN(version.maxAPIVersion) || isNaN(version.minAPIVersion)) {
        this.logger.error(`Component ${name} version version is NaN.`);
        return;
      }

      const componentBody: Component = {
        name,
        version,
        config: null,
        configStructure: null,
        luaScript: '',
      };

      // get config and configStructure
      let constructor: any;
      try {
        constructor = await import(join(path, this.config.file.configModule));
        if (constructor.default) {
          constructor = constructor.default;
          const defaultConfig = new constructor();
          const meta = getConfigMeta(constructor);
          if (meta) {
            componentBody.configStructure = meta;
            // the new default config should be empty, need to generate from meta
            componentBody.config = this.genDefaultConfigByMeta(defaultConfig, meta);
          } else {
            this.logger.error(`Config meta miss on config ${name}`);
          }
        }
      } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') return;
        this.logger.warn(`Error loading config of ${name}, e=`, e);
      }

      // read lua script
      try {
        const luaScriptPath = join(path, this.config.file.luaModule);
        if (existsSync(luaScriptPath)) {
          componentBody.luaScript = readFileSync(luaScriptPath, 'utf8');
        }
      } catch (e) {
        this.logger.warn(`Error loading lua of ${name}, e=`, e);
      }

      // save
      const componentSet: any = {};
      componentSet[version.version] = componentBody;
      this.components[name] = componentSet;
      this.configStructure[name] = componentSet.meta;
    } catch (e) {
      this.logger.error(`Error while load component ${name}, e=${e}`);
    }
  }

  private genDefaultConfigByMeta(config: any, meta: any): any {
    if (!meta.properties) return null;
    meta.properties.forEach(p => {
      if (p.type !== 'object') {
        config[p.name] = p.defaultValue;
      } else {
        config[p.name] = this.genDefaultConfigByMeta({}, p);
      }
    });
    return config;
  }

  public async getDefaultConfig(config: any): Promise<any> {
    if (!config) return {};
    await waitUntil(() => this.componentLoaded, { interval: 500 });
    const res: any = {};
    Object.keys(config).forEach(compName => {
      const component = this.components[compName];
      if (component === undefined) return;

      const compBody = component[config[compName].version];
      if (compBody === undefined || !compBody.config) return;

      res[compName] = cloneDeep(compBody.config);
    });
    return res;
  }

  public async getDefaultLuaScript(config: any): Promise<any> {
    if (!config) return {};
    await waitUntil(() => this.componentLoaded, { interval: 500 });
    const res: any = {};
    Object.keys(config).forEach(compName => {
      const component = this.components[compName];
      if (component === undefined) return;

      const compBody = component[config[compName].version];
      if (compBody === undefined || !compBody.luaScript) return;

      res[compName] = cloneDeep(compBody.luaScript);
    });
    return res;
  }

}

export interface Component {
  name: string;
  version: {
    version: number,
    minAPIVersion: number,
    maxAPIVersion: number,
  };
  config: any;
  configStructure: any;
  luaScript: string;
}
