import { Application, Context } from 'egg';
import Webhooks from '@octokit/webhooks';
import EventSource from 'eventsource';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { InstallationInitEvent } from '../installation-manager/types';
import { GitHubClientConfig } from '../github-client-manager/GitHubInstallationConfig';

export class GitHubWebhook extends AppPluginBase<null> {

  private webhooks: Map<number, Webhooks>;

  constructor(config: null, app: Application) {
    super(config, app);
    this.webhooks = new Map<number, Webhooks>();
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeAll(InstallationInitEvent, async e => {
      // init webhooks for each app
      const config: GitHubClientConfig = e.config;
      const webhooks = new Webhooks({
        secret: config.webhook.secret,
      });
      this.webhooks.set(e.installationId, webhooks);

      // setup proxy using smee.io
      if (config.webhook.proxyUrl) {
        const source = new EventSource(config.webhook.proxyUrl);
        source.onmessage = (event: any) => {
          const webhookEvent = JSON.parse(event.data);
          webhooks.verifyAndReceive({
            id: webhookEvent['x-request-id'],
            name: webhookEvent['x-github-event'],
            signature: webhookEvent['x-hub-signature'],
            payload: webhookEvent.body,
          }).catch(this.logger.error);
        };
      }

      // setup router
      const path = `${config.webhook.path}/${e.installationId}`;
      this.logger.info(`Load webhooks for ${e.name} on /${this.name}/${path}`);
      this.get(path, async (ctx: Context, next: any) => {
        // pass to webhooks
        webhooks.verifyAndReceive({
          id: ctx.headers['x-request-id'],
          name: ctx.headers['x-github-event'],
          signature: ctx.headers['x-hub-signature'],
          payload: ctx.body,
        }).catch(this.logger.error);
        ctx.body = 'ok';
        await next();
      });
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  protected checkConfigFields(): string[] {
    return [ 'path', 'secret' ];
  }

}
