import chainplugin from '@lumoscompany/chainplugin';
import { NotificationsProvider, EventsProvider, AssetsProvider } from './providers';

export default chainplugin({
  assets: async function () {
    return new AssetsProvider();
  },

  events: async function () {
    return new EventsProvider();
  },

  notifications: async function (args) {
    return new NotificationsProvider(args);
  },
});
