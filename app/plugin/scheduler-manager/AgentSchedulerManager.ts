import { Agent } from 'egg';
import { scheduleJob, Job } from 'node-schedule';
import { BasicJobHanlder } from './BasicJobHandler';
import { SchedulerWorkerRegisterEvent, SchedulerWorkerUpdateEvent, SchedulerAgentScheduleEvent } from './AgentWorkerJobHandler';
import { AgentPluginBase } from '../../basic/AgentPluginBase';
import { ISchedulerJobCallback, ISchedulerJobHandler } from './types';

export class AgentSchedulerManager extends AgentPluginBase<null> {

  private workerHandlerMap: Map<string, Job>;

  constructor(config: null, agent: Agent) {
    super(config, agent);
    this.workerHandlerMap = new Map<string, Job>();
  }

  public async onReady(): Promise<void> {
    this.agent.event.subscribe(SchedulerWorkerRegisterEvent, async e => {
      if (this.workerHandlerMap.has(e.name)) return;
      const job = scheduleJob(e.name, e.time, () => {
        this.agent.event.publish('worker', SchedulerAgentScheduleEvent, {
          name: e.name,
        });
      });
      this.workerHandlerMap.set(e.name, job);
    });

    this.agent.event.subscribe(SchedulerWorkerUpdateEvent, async e => {
      const job = this.workerHandlerMap.get(e.name);
      if (!job) return;
      switch (e.type) {
        case 'cancle':
          job.cancel();
          this.workerHandlerMap.delete(e.name);
          break;
        case 'update':
          if (e.time) {
            job.reschedule(e.time);
          }
          break;
        default:
          break;
      }
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  register(name: string, time: string, func: ISchedulerJobCallback): ISchedulerJobHandler {
    const schedJob = scheduleJob(name, time, func);
    const job = new BasicJobHanlder(schedJob);
    return job;
  }

}
