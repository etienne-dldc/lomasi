import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import { URL } from 'url';
import { Route, JsonResponse, HttpError, RequestConsumer } from 'tumau';
import { ROUTES } from '../constants';
import { YupValidator } from '../YupValidator';
import { OptionsContext } from '../contexts';

interface LoginBody {
  email: string;
  callback: string;
}

const loginBodyValidator = YupValidator<LoginBody>(
  Yup.object().shape({
    email: Yup.string()
      .email()
      .lowercase()
      .required(),
    callback: Yup.string().required(),
  })
);

export const LoginRoute = Route.POST(ROUTES.login, loginBodyValidator.validate, async ctx => {
  const options = ctx.getOrThrow(OptionsContext.Consumer);
  const request = ctx.getOrThrow(RequestConsumer);

  const body = loginBodyValidator.getValue(ctx);
  const url = new URL(body.callback);
  const host = url.host;
  const app = options.apps.find((v): boolean => v.domain === host);
  if (app === undefined) {
    throw new HttpError.Unauthorized('Host not allowed');
  }
  if (options.skipOriginCheck !== true) {
    if (request.origin === null) {
      throw new HttpError.Unauthorized('Missing origin');
    }
    if (app.allowedOrigin === null || app.allowedOrigin === undefined) {
      // no setting => allow only the app origin
      if (app.domain !== request.origin) {
        // TODO:  remove details (only for debug)
        throw new HttpError.Unauthorized(`Invalid origin (got ${request.origin} expect ${app.domain})`);
      }
    } else {
      if (app.allowedOrigin.includes(request.origin) === false) {
        throw new HttpError.Unauthorized(`Invalid origin`);
      }
    }
  }

  if (app.usersBlackList) {
    if (app.usersBlackList.includes(body.email)) {
      throw new HttpError.Unauthorized(`Unauthorized user`);
    }
  }
  if (app.usersWhiteList) {
    if (app.usersWhiteList.includes(body.email) === false) {
      throw new HttpError.Unauthorized(`Unauthorized user`);
    }
  }

  const token = jwt.sign({ email: body.email, app: host }, app.jwtSecret, {
    expiresIn: '1h',
  });
  const link = body.callback.replace('{{TOKEN}}', encodeURIComponent(token));

  await options.mailer.sendMail({
    to: body.email,
    subject: 'Magic link 🎩',
    html: [`<h1>Magic link 🎩 !</h1>`, `<a href="${link}">Login to ${url.origin}</a>`].join(''),
    text: `Magic link: ${link}`,
  });
  return JsonResponse.with({
    message: 'check your mail',
  });
});
