import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import { URL } from 'url';
import { Route, JsonResponse, HttpError, RequestConsumer } from 'tumau';
import { ROUTES } from '../constants';
import { YupValidator } from '../YupValidator';
import { OptionsContext } from '../contexts';
import { LomasiTokenData, LoginBody, LoginResponse } from '@lomasi/common';
import { Security } from '../Security';

const loginBodyValidator = YupValidator<LoginBody>(
  Yup.object().shape({
    email: Yup.string()
      .email()
      .lowercase()
      .required(),
    callback: Yup.string().required(),
    password: Yup.string()
      .min(4)
      .required(),
  })
);

export const LoginRoute = Route.POST(ROUTES.login, loginBodyValidator.validate, async ctx => {
  const options = ctx.getOrThrow(OptionsContext.Consumer);
  const request = ctx.getOrThrow(RequestConsumer);

  const body = loginBodyValidator.getValue(ctx);
  const url = new URL(body.callback);
  const cbOrigin = url.origin;
  const app = options.apps.find((v): boolean => v.origin === cbOrigin);
  if (app === undefined) {
    throw new HttpError.Unauthorized('Callback origin not allowed');
  }
  if (options.skipOriginCheck !== true) {
    Security.checkOrigin(request.origin, app);
  }

  Security.checkUser(body.email, app);

  const tokenData: LomasiTokenData = {
    email: body.email,
    app: app.origin,
  };

  const jwtPass = app.jwtMailSecret + body.password;

  const token = jwt.sign(tokenData, jwtPass, {
    expiresIn: app.jwtMailExpireIn,
  });

  const link = body.callback.replace('{{TOKEN}}', encodeURIComponent(token));

  await options.mailer.sendMail({
    to: body.email,
    subject: 'Magic link 🎩',
    html: [`<h1>Magic link 🎩 !</h1>`, `<a href="${link}">Login to ${url.origin}</a>`].join(''),
    text: `Magic link: ${link}`,
  });
  return JsonResponse.with<LoginResponse>({
    message: 'check your mail',
  });
});
