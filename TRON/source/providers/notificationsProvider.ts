import {
  NotificationsProvider as INotificationsProvider,
  NotificationsEmitter,
} from '@lumoscompany/chainplugin';

class NotificationsProvider implements INotificationsProvider {
  readonly emitter: NotificationsEmitter;

  constructor(args: { emitter: NotificationsEmitter }) {
    this.emitter = args.emitter;
  }

  subscribe: (args: { addresses: string[] }) => void;
  unsubscribe: (args: { addresses: string[] }) => void;
}

export { NotificationsProvider };
