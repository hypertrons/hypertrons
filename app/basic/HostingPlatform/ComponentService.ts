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
  private hostId: number;
  private logger: BotLogger;
  private config: ComponentConfig;
  private componentLoaded: boolean;
  private components: ComponentSet;

  constructor(hostId: number, config: ComponentConfig, app: Application) {
    this.app = app;
    this.hostId = hostId;
    this.logger = loggerWrapper(app.logger, `[component-server-${this.hostId}]`);
    this.config = config;
    this.componentLoaded = false;
    this.components = new Map<string, Map<number, Component>>();
  }

  public getLatestConfigStructure(): any {
    return {};
  }

  public getConfigStructureByVersion(name: string, version: number): any {
    console.log(name, version);
    return {};
  }

  protected checkConfigFields(): string[] {
    return [ 'basePath', 'entryModule', 'configModule' ];
  }

  public getComponentLoaded(): boolean {
    return this.componentLoaded;
  }

  public getComponents(): ComponentSet | undefined {
    if (this.componentLoaded) return this.components;
    return undefined;
  }

  public setComponents(comp: Map<string, Map<number, Component>>) {
    this.components = comp;
  }

  public async loadComponents(): Promise<ComponentSet | undefined> {
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
      componentsDir.forEach(async path => {
        await this.loadComponent(join(basePath, path), path);
      });
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
      const versionStr = readFileSync(versionPath, 'utf8');
      const version = Number(versionStr);
      if (isNaN(version)) {
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
        if (!existsSync(luaScriptPath)) {
          this.logger.error(`Component ${name} lua script file not exist.`);
        } else {
          componentBody.luaScript = readFileSync(versionPath, 'utf8');
        }
      } catch (e) {
        this.logger.warn(`Error loading config of ${name}, e=`, e);
      }

      // save to map
      const componentMap = new Map<number, Component>();
      componentMap.set(version, componentBody);
      this.components.set(name, componentMap);

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

  public getDefaultConfig(compKeys: Array<{ name: string, version: number }>): { config: any, lua: string } {
    waitUntil(() => this.componentLoaded);

    const config: any = {};
    const lua: any = {};
    compKeys.forEach(compKey => {
      const comp = this.components.get(compKey.name);
      if (comp === undefined) return;

      const compBody = comp.get(compKey.version);
      if (compBody === undefined) return;

      if (compBody.config) config[name] = cloneDeep(compBody.config);
      if (compBody.luaScript) lua[name] = cloneDeep(compBody.luaScript);
    });
    return { config, lua };
  }

}

export interface Component {
  name: string;
  version: number;
  config: any;
  configStructure: any;
  luaScript: string;
}

export type ComponentSet = Map<string, Map<number, Component>>;
