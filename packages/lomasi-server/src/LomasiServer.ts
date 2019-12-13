import { Server, Middleware, JsonParser, ErrorToJson, Compress, Cors } from 'tumau';
import { UserOptions, LomasiCore } from '@lomasi/core';
import { Routes } from './routes';
import { LomasiCoreContext } from './contexts';

export const LomasiServer = {
  create: createLomasiServer,
};

function createLomasiServer(userOptions: UserOptions): Server {
  const core = LomasiCore.create(userOptions);

  const server = Server.create(
    Middleware.compose(
      Middleware.provider(LomasiCoreContext.Provider(core)),
      Compress(),
      Cors.create(),
      ErrorToJson,
      JsonParser(),
      Routes
    )
  );

  return server;
}
