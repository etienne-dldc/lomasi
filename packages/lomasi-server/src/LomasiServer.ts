import { Server, Middleware, JsonParser, ErrorToJson, Compress, Cors } from 'tumau';
import { OptionsContext } from './contexts';
import { Routes } from './routes';
import { UserOptions, Options } from './Options';

export const LomasiServer = {
  create: createLomasiServer,
};

function createLomasiServer(userOptions: UserOptions): Server {
  const options: Options = {
    skipOriginCheck: false,
    ...userOptions,
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
