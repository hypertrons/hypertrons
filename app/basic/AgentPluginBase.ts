import { Agent } from 'egg';
import assert from 'assert';
import { GloablEvents } from './Utils';

interface PluginLogger {
  debug: (msg: any, ...args: any[]) => void;
  info: (msg: any, ...args: any[]) => void;
  warn: (msg: any, ...args: any[]) => void;
  error: (msg: any, ...args: any[]) => void;
}

/**
 * Oss mentor bot agent plugin base class
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
  protected logger: PluginLogger;

  constructor(config: TConfig, agent: Agent) {
    this.agent = agent;
    this.config = config;
    const logPrefix = () => `[${this.name}-agent]`;
    this.logger = {
      debug: (msg, ...args) => this.agent.logger.debug(logPrefix(), msg, ...args),
      info: (msg, ...args) => this.agent.logger.info(logPrefix(), msg, ...args),
      warn: (msg, ...args) => this.agent.logger.warn(logPrefix(), msg, ...args),
      error: (msg, ...args) => this.agent.logger.error(logPrefix(), msg, ...args),
    };
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
