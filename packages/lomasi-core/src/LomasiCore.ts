import { LoginRoute, AuthenticateRoute } from './routes';
import { UserOptions, Options, AppConfigResolved, APP_CONFIG_DEFAULTS, OPTIONS_DEFAULTS } from './Options';
import { LoginBody, LoginResponse, AuthenticateBody, AuthenticateResponse, ValidateResponse } from '@lomasi/common';
import { ValidateRoute } from './routes/Validate';

export interface LomasiCore {
  login: (origin: string | null, body: LoginBody) => Promise<LoginResponse>;
  authenticate: (origin: string | null, body: AuthenticateBody) => Promise<AuthenticateResponse>;
  validate: (origin: string | null, body: AuthenticateBody) => Promise<ValidateResponse>;
}

export const LomasiCore = {
  create: createLomasiCore,
};

function createLomasiCore(userOptions: UserOptions): LomasiCore {
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

  return {
    login: (origin, body) => LoginRoute(origin, body, options),
    authenticate: (origin, body) => AuthenticateRoute(origin, body, options),
    validate: (origin, body) => ValidateRoute(origin, body, options),
  };
}
