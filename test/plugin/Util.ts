import mock, { MockApplication } from 'egg-mock';
import { Application, Agent } from 'egg';

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

// prepare application for unit test
export async function prepareTestApplication(): Promise<{app: Application, agent: Agent}> {
  const app = mock.app({
    cache: false,
  });
  await app.ready();
  await initIpc(app);
  return {
    app,
    agent: (app as any).agent,
  };
}

export function testClear(app?: Application, agent?: Agent) {
  if (app) {
    (app.messenger as any).close();
  }
  if (agent) {
    (agent.messenger as any).close();
  }
  mock.restore();
}
