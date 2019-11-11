import { Server, Middleware, JsonParser, ErrorToJson, Compress, Cors } from 'tumau';
import { OptionsContext } from './contexts';
import { Routes } from './routes';
import { UserOptions, Options, AppConfigResolved, APP_CONFIG_DEFAULTS, OPTIONS_DEFAULTS } from './Options';

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
