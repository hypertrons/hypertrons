import { Application, Context } from 'egg';
import Webhooks from '@octokit/webhooks';
import EventSource from 'eventsource';
import { AppPluginBase } from '../../basic/AppPluginBase';

export class GitHubWebhook extends AppPluginBase<Config> {

  public webhooks: Webhooks;

  constructor(config: Config, app: Application) {
    super(config, app);
    this.webhooks = new Webhooks({
      secret: this.config.secret,
    });

    if (this.config.proxyUrl) {
      // use smee.io proxy
      const source = new EventSource(this.config.proxyUrl);
      source.onmessage = (event: any) => {
        const webhookEvent = JSON.parse(event.data);
        this.webhooks.verifyAndReceive({
          id: webhookEvent['x-request-id'],
          name: webhookEvent['x-github-event'],
          signature: webhookEvent['x-hub-signature'],
          payload: webhookEvent.body,
        }).catch(this.logger.error);
      };
    }
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> {
    // get router for webhook
    this.get(this.config.path, async (ctx: Context, next: any) => {
      // pass to webhooks
      this.webhooks.verifyAndReceive({
        id: ctx.headers['x-request-id'],
        name: ctx.headers['x-github-event'],
        signature: ctx.headers['x-hub-signature'],
        payload: ctx.body,
      }).catch(this.logger.error);
      ctx.body = 'ok';
      await next();
    });
  }

  public async onClose(): Promise<void> { }

  protected checkConfigFields(): string[] {
    return ['path', 'secret'];
  }
}

interface Config {
  path: string;
  secret: string;
  proxyUrl?: string;
}
