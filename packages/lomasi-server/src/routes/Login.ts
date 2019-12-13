import * as Yup from 'yup';
import { Route, JsonResponse, HttpError, RequestConsumer } from 'tumau';
import { ROUTES } from '../constants';
import { YupValidator } from '../YupValidator';
import { LomasiCoreContext } from '../contexts';
import { LoginBody, LoginResponse } from '@lomasi/common';

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
  const core = ctx.getOrThrow(LomasiCoreContext.Consumer);
  const request = ctx.getOrThrow(RequestConsumer);
  const body = loginBodyValidator.getValue(ctx);

  const res = await core.login(request.origin, body);

  if (res.type === 'MailSend') {
    return JsonResponse.with<LoginResponse>(res);
  }
  if (res.type === 'InternalError') {
    throw new HttpError.Internal(res.message);
  }
  if (res.type === 'InvalidOrigin') {
    throw new HttpError.Unauthorized('Invalid Origin');
  }
  if (res.type === 'MissingOrigin') {
    throw new HttpError.Unauthorized('Missing Origin');
  }
  if (res.type === 'UnauthorizedOrigin') {
    throw new HttpError.Unauthorized('Unauthorized Origin');
  }
  if (res.type === 'UnauthorizedUser') {
    throw new HttpError.Unauthorized('Unauthorized User');
  }
  throw new HttpError.Internal();
});
