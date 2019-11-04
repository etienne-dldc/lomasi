import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import { URL } from 'url';
import { Route, JsonResponse, HttpError, RequestConsumer } from 'tumau';
import { ROUTES } from '../constants';
import { YupValidator } from '../YupValidator';
import { OptionsContext } from '../contexts';
import { LomasiTokenData, LomasiToken } from '@lomasi/common';
import { Security } from '../Security';
import { nowInSeconds } from '../utils';

interface RenewBody {
  token: string;
  callback: string;
}

const renewBodyValidator = YupValidator<RenewBody>(
  Yup.object().shape({
    token: Yup.string().required(),
    callback: Yup.string().required(),
  })
);

export const RenewRoute = Route.POST(ROUTES.renew, renewBodyValidator.validate, async ctx => {
  const options = ctx.getOrThrow(OptionsContext.Consumer);
  const request = ctx.getOrThrow(RequestConsumer);

  const body = renewBodyValidator.getValue(ctx);
  const url = new URL(body.callback);
  const cbOrigin = url.origin;
  const app = options.apps.find((v): boolean => v.origin === cbOrigin);

  if (app === undefined) {
    throw new HttpError.Unauthorized('Callback origin not allowed');
  }

  if (options.skipOriginCheck !== true) {
    Security.checkOrigin(request.origin, app);
  }

  const prevToken: LomasiToken = (() => {
    try {
      return jwt.verify(body.token, app.jwtSecret, {
        ignoreExpiration: true,
      }) as any;
    } catch (error) {
      throw new HttpError.Unauthorized(`Invalid token`);
    }
  })();

  const user = prevToken.email;

  const tokenRenewExpire = prevToken.exp + app.maxRenewDelay;

  const timeBeforeExpire = tokenRenewExpire - nowInSeconds();

  if (prevToken.renew === 0) {
    throw new HttpError.Unauthorized('Renewal limit reached');
  }

  if (timeBeforeExpire <= 0) {
    throw new HttpError.Unauthorized('Token is too old');
  }

  Security.checkUser(user, app);

  const tokenData: LomasiTokenData = {
    email: user,
    app: cbOrigin,
    renew: Math.max(0, prevToken.renew - 1),
  };

  const token = jwt.sign(tokenData, app.jwtSecret, {
    expiresIn: app.tokenExpireIn,
  });

  const link = body.callback.replace('{{TOKEN}}', encodeURIComponent(token));

  return JsonResponse.with({
    token,
    link,
  });
});
