import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import { URL } from 'url';
import { Route, JsonResponse, HttpError, RequestConsumer } from 'tumau';
import { ROUTES } from '../constants';
import { YupValidator } from '../YupValidator';
import { OptionsContext } from '../contexts';
import { LomasiTokenData, LomasiToken, AuthenticateBody, AuthenticateResponse } from '@lomasi/common';
import { Security } from '../Security';

const authenticateBodyValidator = YupValidator<AuthenticateBody>(
  Yup.object().shape({
    token: Yup.string().required(),
    password: Yup.string().required(),
  })
);

export const AuthenticateRoute = Route.POST(ROUTES.authenticate, authenticateBodyValidator.validate, async ctx => {
  const options = ctx.getOrThrow(OptionsContext.Consumer);
  const request = ctx.getOrThrow(RequestConsumer);

  const body = authenticateBodyValidator.getValue(ctx);

  const prevTokenData: LomasiToken = (() => {
    try {
      return jwt.decode(body.token) as any;
    } catch (error) {
      throw new HttpError.Unauthorized(`Invalid token or password`);
    }
  })();

  const url = new URL(prevTokenData.app);
  const cbOrigin = url.origin;
  const app = options.apps.find((v): boolean => v.origin === cbOrigin);

  if (app === undefined) {
    throw new HttpError.Unauthorized('Callback origin not allowed');
  }

  if (options.skipOriginCheck !== true) {
    Security.checkOrigin(request.origin, app);
  }

  const jwtPass = app.jwtMailSecret + body.password;

  const prevToken: LomasiToken = (() => {
    try {
      return jwt.verify(body.token, jwtPass) as any;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new HttpError.Unauthorized(`Token expired`);
      }
      throw new HttpError.Unauthorized(`Invalid token or password`);
    }
  })();

  const user = prevToken.email;

  Security.checkUser(user, app);

  const tokenData: LomasiTokenData = {
    email: user,
    app: cbOrigin,
  };

  const token = jwt.sign(tokenData, app.jwtAuthSecret, {
    expiresIn: app.jwtAuthExpireIn,
  });

  return JsonResponse.with<AuthenticateResponse>({
    token,
  });
});
