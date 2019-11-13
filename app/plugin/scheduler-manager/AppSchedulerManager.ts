import { Application } from 'egg';
import { scheduleJob } from 'node-schedule';
import { BasicJobHanlder } from './BasicJobHandler';
import { SchedulerAgentScheduleEvent, AgentWorkerJobHandler } from './AgentWorkerJobHandler';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { ISchedulerJobCallback, ISchedulerJobHandler } from './types';

export class AppSchedulerManager extends AppPluginBase<null> {

  private handlerMap: Map<string, AgentWorkerJobHandler>;

  constructor(config: null, app: Application) {
    super(config, app);
    this.handlerMap = new Map<string, AgentWorkerJobHandler>();
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeOne(SchedulerAgentScheduleEvent, async e => {
      this.scheduleAgentJob(e.name);
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public register(name: string, time: string, type: 'worker' | 'workers', func: ISchedulerJobCallback): ISchedulerJobHandler {
    switch (type) {
      case 'worker':
        // register on agent
        const awj = new AgentWorkerJobHandler(this.app, name, time, func, this.handlerMap);
        return awj;
      case 'workers':
        // register on self
        const j = scheduleJob(name, time, func);
        return new BasicJobHanlder(j);
      default:
        throw new Error(`Not supported type ${type}.`);
    }
  }

  private async scheduleAgentJob(name: string) {
    const job = this.handlerMap.get(name);
    if (job) {
      job.invoke();
    }
  }

}
