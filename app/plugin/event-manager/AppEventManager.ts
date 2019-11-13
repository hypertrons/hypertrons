import { Application } from 'egg';
import { getClassName, IPC_EVENT_NAME, IpcEventType } from './Helper';
import { EventHandlerMap } from './EventHandlerMap';
import { AppPluginBase } from '../../basic/AppPluginBase';

export class AppEventManager extends AppPluginBase<null> {

  private oneHandlerMap: EventHandlerMap;
  private allHandlerMap: EventHandlerMap;

  constructor(config: null, app: Application) {
    super(config, app);
    this.oneHandlerMap = new EventHandlerMap();
    this.allHandlerMap = new EventHandlerMap();
    this.app.messenger.on(IPC_EVENT_NAME, (e: IpcEventType) => {
      this.consume(e.className, e.type, e.payload);
    });
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public subscribeOne<T>(constructor: new (...args: any) => T, func: EventHandler<T>): void {
    const className = getClassName(constructor);
    this.oneHandlerMap.add(className, func);
  }

  public subscribeAll<T>(constructor: new (...args: any) => T, func: EventHandler<T>): void {
    const className = getClassName(constructor);
    this.allHandlerMap.add(className, func);
  }

  public publish<T>(type: 'worker' | 'workers' | 'agent' | 'all', constructor: new (...args: any) => T, param: T): void {
    const p: IpcEventType = {
      type,
      className: getClassName(constructor),
      payload: param,
    };
    switch (type) {
      case 'worker':
        // if worker, consume immediately by self
        this.consume(getClassName(constructor), type, param);
        break;
      case 'workers':
        // if workers, send to all workers
        this.app.messenger.sendToApp(IPC_EVENT_NAME, p);
        break;
      case 'agent':
        // if agent, send to agent
        this.app.messenger.sendToAgent(IPC_EVENT_NAME, p);
        break;
      case 'all':
        // broadcast will send to agent and all workers
        this.app.messenger.broadcast(IPC_EVENT_NAME, p);
        this.consume(getClassName(constructor), 'worker', param);
        break;
      default: break;
    }
  }

  private async consume<T>(className: string, type: 'worker' | 'workers' | 'agent' | 'all', param: T): Promise<void> {
    switch (type) {
      case 'worker':
        try {
          await this.oneHandlerMap.exec(className, param);
        } catch (e) {
          this.logger.error(`Error processing handlers, className=${className}, e=`, e);
        }
        break;
      case 'workers':
      case 'all':
        try {
          await this.allHandlerMap.exec(className, param);
        } catch (e) {
          this.logger.error(`Error processing handlers, className=${className}, e=`, e);
        }
        break;
      case 'agent':
        this.logger.error(`Worker recieve agent event. className=${className}`);
        break;
      default:
        break;
    }
  }

}

type EventHandler<T> = (event: T) => Promise<void>;
