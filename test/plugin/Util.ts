// wait for milliseconds until ipc finish
export function waitFor(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, milliseconds);
    });
  }
