import { MockApplication } from 'egg-mock';

// wait for milliseconds until ipc finish
export function waitFor(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

// simulate ipc so that agent and app can communicate with each other
export function initIpc(app: MockApplication, milliseconds: number = 10) {
  process.env.SENDMESSAGE_ONE_PROCESS = 'true';
  app.messenger.sendTo(process.pid, 'egg-pids', [ process.pid ]);
  return waitFor(milliseconds);
}
