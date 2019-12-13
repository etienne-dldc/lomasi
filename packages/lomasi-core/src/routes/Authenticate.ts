import jwt from 'jsonwebtoken';
import { URL } from 'url';
import { LomasiTokenData, LomasiToken, AuthenticateBody, AuthenticateResponse } from '@lomasi/common';
import { Security } from '../Security';
import { Options, DEFAULT_AUTH_TOKEN_EXPIRE_IN } from '../Options';

export async function AuthenticateRoute(
  origin: string | null,
  body: AuthenticateBody,
  options: Options
): Promise<AuthenticateResponse> {
  try {
    const res = await TryAuthenticateRoute(origin, body, options);
    return res;
  } catch (error) {
    return {
      type: 'InternalError',
      message: error instanceof Error ? error.message : error && error.toString(),
    };
  }
}

async function TryAuthenticateRoute(
  origin: string | null,
  body: AuthenticateBody,
  options: Options
): Promise<AuthenticateResponse> {
  const prevTokenData = ((): LomasiToken | false => {
    try {
      return jwt.decode(body.token) as any;
    } catch (error) {
      return false;
    }
  })();

  if (prevTokenData === false) {
    return { type: 'InvalidTokenOrPassword' };
  }

  const url = new URL(prevTokenData.app);
  const cbOrigin = url.origin;
  const app = options.apps.find((v): boolean => v.origin === cbOrigin);

  if (app === undefined) {
    return { type: 'InvalidOrigin' };
  }

  if (app.authToken === null) {
    return { type: 'AuthTokenNotConfigured' };
  }

  if (options.skipOriginCheck !== true) {
    const originAllowed = Security.checkOrigin(origin, app);
    if (originAllowed !== true) {
      return originAllowed;
    }
  }

  const jwtPass = app.refreshToken.jwtSecret + body.password;

  const prevTokenRes = getPrevToken(body.token, jwtPass);
  if (prevTokenRes.type === 'Error') {
    return prevTokenRes.error;
  }
  const prevToken = prevTokenRes.token;
  const user = prevToken.email;

  const userAllowed = await Security.checkUser(user, app);
  if (userAllowed !== true) {
    return userAllowed;
  }

  const tokenData: LomasiTokenData = {
    email: user,
    app: cbOrigin,
  };

  const token = jwt.sign(tokenData, app.authToken.jwtSecret, {
    expiresIn: app.authToken.jwtExpireIn || DEFAULT_AUTH_TOKEN_EXPIRE_IN,
  });

  return {
    type: 'Authorized',
    token,
  };
}

function getPrevToken(
  token: string,
  jwtPass: string
): { type: 'Success'; token: LomasiToken } | { type: 'Error'; error: AuthenticateResponse } {
  try {
    const tokenDecoded = jwt.verify(token, jwtPass) as any;
    return {
      type: 'Success',
      token: tokenDecoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        type: 'Error',
        error: {
          type: 'TokenExpired',
        },
      };
    }
    return {
      type: 'Error',
      error: {
        type: 'InvalidTokenOrPassword',
      },
    };
  }
}
