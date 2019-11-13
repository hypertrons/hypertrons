/**
 * Job callback function, send schedule time as parameter
 */
export type ISchedulerJobCallback = (time: Date) => void;

/**
 * Job handler to munipulate a job
 */
export interface ISchedulerJobHandler {
  /**
   * cancle current scheduler
   */
  cancle(): void;
  /**
   * reschedule the scheduler
   */
  reschedule(time: string): void;
  /**
   * get next schedule time
   */
  nextScheduleTime(): Date;
}
