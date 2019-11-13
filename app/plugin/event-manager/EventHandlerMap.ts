/**
 * Event handler map for event registry
 */
export class EventHandlerMap {

  private map: Map<string, any[]>;

  constructor() {
    this.map = new Map<string, any[]>();
  }

  add(key: string, func: any): void {
    const arr = this.map.get(key);
    if (arr) {
      arr.push(func);
    } else {
      this.map.set(key, Array.of(func));
    }
  }

  async exec(key: string, param: any): Promise<void> {
    const arr = this.map.get(key);
    if (arr) {
      arr.forEach(async fn => {
        await fn(param);
      });
    }
  }

}
