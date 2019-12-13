import * as Yup from 'yup';
import { Route, JsonResponse, HttpError, RequestConsumer } from 'tumau';
import { ROUTES } from '../constants';
import { YupValidator } from '../YupValidator';
import { LomasiCoreContext } from '../contexts';
import { AuthenticateBody, AuthenticateResponse } from '@lomasi/common';

const authenticateBodyValidator = YupValidator<AuthenticateBody>(
  Yup.object().shape({
    token: Yup.string().required(),
    password: Yup.string().required(),
  })
);

export const AuthenticateRoute = Route.POST(ROUTES.authenticate, authenticateBodyValidator.validate, async ctx => {
  const core = ctx.getOrThrow(LomasiCoreContext.Consumer);
  const request = ctx.getOrThrow(RequestConsumer);
  const body = authenticateBodyValidator.getValue(ctx);
  const res = await core.authenticate(request.origin, body);

  if (res.type === 'Authorized') {
    return JsonResponse.with<AuthenticateResponse>(res);
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
  if (res.type === 'InvalidTokenOrPassword') {
    throw new HttpError.Unauthorized('Invalid Token or Password');
  }
  if (res.type === 'TokenExpired') {
    throw new HttpError.Unauthorized('Token Expired');
  }
  throw new HttpError.Internal();
});
