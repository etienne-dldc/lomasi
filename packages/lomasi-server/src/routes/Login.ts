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
    throw new HttpError.BadRequest('Host not allowed');
  }
  if (options.skipOriginCheck !== true) {
    if (request.origin === null) {
      throw new HttpError.BadRequest('Origin not allowed');
    }
    // TODO: check origin is the same !
  }
  console.log('origin', request.origin);

  // TODO: check whitelist / backlist
  const token = jwt.sign({ email: body.email, app: host }, app.jwtTokenSecret, {
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
