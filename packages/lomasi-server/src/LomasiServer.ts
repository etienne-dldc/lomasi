import { Server, Middleware, JsonParser, ErrorToJson, Compress, Cors } from 'tumau';
import { OptionsContext } from './contexts';
import { Routes } from './routes';
import { UserOptions, Options, AppConfigResolved, APP_CONFIG_DEFAULTS, OPTIONS_DEFAULTS } from './Options';
import { seconds } from './utils';

export const LomasiServer = {
  create: createLomasiServer,
};

function createLomasiServer(userOptions: UserOptions): Server {
  const options: Options = {
    ...OPTIONS_DEFAULTS,
    ...userOptions,
    apps: userOptions.apps.map(
      (app): AppConfigResolved => {
        return {
          ...APP_CONFIG_DEFAULTS,
          ...app,
          maxRenewDelay: seconds(
            app.maxRenewDelay === undefined ? APP_CONFIG_DEFAULTS.maxRenewDelay : app.maxRenewDelay
          ),
        };
      }
    ),
  };

  const server = Server.create(
    Middleware.compose(
      Middleware.provider(OptionsContext.Provider(options)),
      Compress(),
      Cors.create(),
      ErrorToJson,
      JsonParser(),
      Routes
    )
  );

  return server;
}
