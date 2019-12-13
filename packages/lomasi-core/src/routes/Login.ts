import jwt from 'jsonwebtoken';
import { URL } from 'url';
import { LomasiTokenData, LoginBody, LoginResponse } from '@lomasi/common';
import { Security } from '../Security';
import { Options } from '../Options';

export async function LoginRoute(origin: string | null, body: LoginBody, options: Options): Promise<LoginResponse> {
  try {
    const res = await TryLoginRoute(origin, body, options);
    return res;
  } catch (error) {
    return {
      type: 'InternalError',
      message: error instanceof Error ? error.message : error && error.toString(),
    };
  }
}

async function TryLoginRoute(origin: string | null, body: LoginBody, options: Options): Promise<LoginResponse> {
  const url = new URL(body.callback);
  const cbOrigin = url.origin;
  const app = options.apps.find((v): boolean => v.origin === cbOrigin);
  if (app === undefined) {
    return {
      type: 'UnauthorizedOrigin',
      message: 'Callback origin not allowed',
    };
  }
  if (options.skipOriginCheck !== true) {
    const originAllowed = Security.checkOrigin(origin, app);
    if (originAllowed !== true) {
      return originAllowed;
    }
  }

  const userAllowed = Security.checkUser(body.email, app);
  if (userAllowed !== true) {
    return userAllowed;
  }

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
  return {
    type: 'MailSend',
    message: 'check your mail',
  };
}
