/**
 * Get class name by type
 */
export function getClassName<T>(constructor: new (...args: any[]) => T): string {
  return constructor.name;
}

export const IPC_EVENT_NAME = '__IPC_EVENT_NAME__';

export interface IpcEventType {
  className: string;
  type: 'worker' | 'workers' | 'agent' | 'all';
  payload: any;
}
