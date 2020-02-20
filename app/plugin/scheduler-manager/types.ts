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

/**
 * Job callback function, send schedule time as parameter
 */
export type ISchedulerJobCallback = (time: Date) => void;

/**
 * Job handler to munipulate a job
 */
export interface ISchedulerJobHandler {
  /**
   * cancel current scheduler
   */
  cancel(): void;
  /**
   * reschedule the scheduler
   */
  reschedule(time: string): void;
  /**
   * get next schedule time
   */
  nextScheduleTime(): Date;
}
