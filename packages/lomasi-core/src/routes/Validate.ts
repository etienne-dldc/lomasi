import { ValidateBody, ValidateResponse } from '@lomasi/common';
import { Options } from '../Options';
import { AuthenticateRoute } from './Authenticate';

export async function ValidateRoute(
  origin: string | null,
  body: ValidateBody,
  options: Options
): Promise<ValidateResponse> {
  try {
    const res = await AuthenticateRoute(origin, body, options);
    if (res.type === 'Authorized') {
      return { type: 'Validated' };
    }
    return res;
  } catch (error) {
    return {
      type: 'InternalError',
      message: error instanceof Error ? error.message : error && error.toString(),
    };
  }
}
