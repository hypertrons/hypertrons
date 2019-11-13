import { ISchedulerJobHandler } from './types';
import { Job } from 'node-schedule';

export class BasicJobHanlder implements ISchedulerJobHandler {

  private job: Job;

  constructor(job: Job) {
    this.job = job;
  }

  cancle(): void {
    this.job.cancel();
  }

  reschedule(time: string): void {
    this.job.reschedule(time);
  }

  nextScheduleTime(): Date {
    return this.job.nextInvocation();
  }

}
