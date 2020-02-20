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

import { Application } from 'egg';
import { existsSync, readdirSync, statSync, readFileSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { waitUntil, BotLogger, loggerWrapper } from '../../basic/Utils';
import { cloneDeep } from 'lodash';
import { getConfigMeta } from '../../config-generator/decorators';
import { ComponentConfig, ComponentRemoteConfig } from './HostingConfigBase';

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
    this.components = {};
    this.configStructure = {};
  }

  public getLatestConfigStructure(): any {
    return this.configStructure;
  }

  public getConfigStructureByVersion(name: string, version: number): any {
    if (this.components[name] && this.components[name][version]) return this.configStructure[name][version];
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

  /**
   * Load components
   * Never overlay previous loaded component.
   * If different components have the same name, those after will not be loaded.
   */
  public async loadComponents(): Promise<any> {
    try {
      // create or update config dependency
      const historyPath = join(this.app.baseDir, 'component-history');
      if (!existsSync(historyPath) || !existsSync(join(historyPath, '/config-generator')) || !existsSync(join(historyPath, '/basic'))) {
        mkdirSync(join(historyPath, '/config-generator'), { recursive: true });
        mkdirSync(join(historyPath, '/basic'), { recursive: true });
      }
      copyFileSync(join(this.app.baseDir, 'app/config-generator/decorators.ts'), join(historyPath, 'config-generator/decorators.ts'));
      copyFileSync(join(this.app.baseDir, 'app/basic/DataTypes.ts'), join(historyPath, '/basic/DataTypes.ts'));

      if (this.config.file) {
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
          // do not reload exist component
          if (this.components[index]) {
            continue;
          }
          await this.loadComponent(join(basePath, componentsDir[index]), componentsDir[index], this.config.file);
        }
      }

      if (this.config.remote) {
        const githubRemoteRepo = this.config.remote.filter(c => c.type === 'github');
        // There might be multiple remote repos in a same platform
        for (const grr of githubRemoteRepo) {
          // origin url form: https://github.com/owner/repo/
          const s = grr.url.split('/');
          const repo = `${s[3]}/${s[4]}`;
          // api: https://developer.github.com/v3/repos/contents/#get-contents
          const compResponse = await fetch(
            `https://api.github.com/repos/${repo}/contents/${grr.basePath}`,
            { headers: grr.token ? { Authorization: `bearer ${grr.token}` } : {} },
          );
          if (!compResponse.ok) {
            throw {
              status: compResponse.status,
              body: compResponse,
            };
          }
          const compList = await compResponse.json();
          for (const comp of compList) {
            // do not reload exist component
            if (this.components[comp.name]) {
              continue;
            }
            await this.loadComponentFromGitHub(repo, comp.path, comp.name, grr);
          }
        }

        // load saved local file in last step
        const basePath = join(this.app.baseDir, 'component-history');
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
          // do not reload exist component and never load config-generator
          if (this.components[componentsDir[index]] || componentsDir[index] === 'config-generator' || componentsDir[index] === 'basic') {
            continue;
          }
          const versionsDir = readdirSync(join(basePath, componentsDir[index]));
          for (const vi in versionsDir) {
            // local file structure is base on first remote repo
            await this.loadComponent(join(basePath, componentsDir[index], versionsDir[vi]), componentsDir[index], this.config.remote[0]);

          }
        }
      }

      this.componentLoaded = true;
      return this.components;
    } catch (e) {
      this.logger.error(`Error while load components, e=${e}`);
    }
  }

  private async loadComponent(path: string, name: string, compSourceConfig: any): Promise<void> {
    try {
      // check if path exist
      this.logger.info(`Gonna load component under ${name}`);
      const pathInfo = statSync(path);
      if (!pathInfo.isDirectory()) {
        this.logger.error(`Component ${name} path is not a directory.`);
        return;
      }

      // get version
      const versionPath = join(path, compSourceConfig.versionPath);
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
        constructor = await import(join(path, compSourceConfig.configModule));
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
        const luaScriptPath = join(path, compSourceConfig.luaModule);
        if (existsSync(luaScriptPath)) {
          componentBody.luaScript = readFileSync(luaScriptPath, 'utf8');
        }
      } catch (e) {
        this.logger.warn(`Error loading lua of ${name}, e=`, e);
      }

      // save
      if (!this.components[name]) {
        this.components[name] = {};
        this.configStructure[name] = {};
      }
      this.components[name][version.version] = componentBody;
      this.configStructure[name][version.version] = componentBody.configStructure;
    } catch (e) {
      this.logger.error(`Error while load component ${name}, e=${e}`);
    }
  }

  private async loadComponentFromGitHub(repo: string, path: string, name: string, remoteConfig: ComponentRemoteConfig): Promise<void> {
    try {
      // make a dir for store history component
      const compHistoryPath = join(this.app.baseDir, 'component-history/', name);
      if (!existsSync(compHistoryPath)) {
        mkdirSync(compHistoryPath);
      }
      // get all commits that related with component dir
      const commitsResponse = await fetch(
        `https://api.github.com/repos/${repo}/commits?path=${path}`,
        { headers: remoteConfig.token ? { Authorization: `bearer ${remoteConfig.token}` } : {} },
      );
      if (!commitsResponse.ok) {
        throw {
          status: commitsResponse.status,
          body: commitsResponse,
        };
      }
      const commitsJson = await commitsResponse.json();
      const versionsJson = commitsJson.map(commit => ({
        sha: commit.sha,
      }));

      await Promise.all(
        versionsJson.map(async commit => {
          try {
            commit.content = JSON.parse(await getContent(repo, commit.sha, join(path, remoteConfig.versionPath), remoteConfig.token));
          } catch (e) {
            commit.content = undefined;
          }
        }),
      );

      // record latest commit of specific version
      const versionMap = new Map<number, string>();
      for (const v of versionsJson) {
        if (!v.content) {
          continue;
        }
        if (!versionMap.get(v.content.version)) {
          const compVersionPath = join(compHistoryPath, '/' + v.content.version);
          // if dir exists, do not reload this version.
          if (existsSync(compVersionPath)) {
            continue;
          }
          versionMap.set(v.content.version, v.sha);
          mkdirSync(join(compHistoryPath, '/' + v.content.version));
          writeFileSync(compHistoryPath + '/' + v.content.version + '/version.json', JSON.stringify(v.content));
        }
      }

      // save different version
      const versionList: any[] = [];
      // turn map into array so that use Promise.all
      versionMap.forEach((v, k) => {
        versionList.push([ k, v ]);
      });
      await Promise.all(
        versionList.map(async val => {
          // get file content
          const compConfig = await getContent(repo, val[1], join(path, '/config.ts'), remoteConfig.token);
          const compConfigStructure = await getContent(repo, val[1], join(path, '/defaultConfig.ts'), remoteConfig.token);
          const compLuaScript = await getContent(repo, val[1], join(path, remoteConfig.luaModule), remoteConfig.token);
          // save as local file
          const compVersionPath = join(compHistoryPath, '/' + val[0]);
          // later will turn this magic value into config
          writeFileSync(join(compVersionPath, '/config.ts'), compConfig);
          writeFileSync(join(compVersionPath, '/defaultConfig.ts'), compConfigStructure);
          writeFileSync(join(compVersionPath, '/index.lua'), compLuaScript);
        }),
      );
    } catch (e) {
      this.logger.error(`Error while save component ${name} local files, e=${e}`);
    }

    // get file content by github api
    async function getContent(repo: string, sha: string, path: string, token: string) {
      const contentResponse = await fetch(
        `https://api.github.com/repos/${repo}/contents${path}?ref=${sha}`,
        { headers: token ? { Authorization: `bearer ${token}` } : {} },
      );
      if (contentResponse.status === 404) {
        return '';
      }
      const contentJson = await contentResponse.json();
      if (!contentResponse.ok) {
        throw {
          status: contentResponse.status,
          body: contentJson,
        };
      }
      const content = Buffer.from(contentJson.content, 'base64').toString('ascii');
      return content;
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
