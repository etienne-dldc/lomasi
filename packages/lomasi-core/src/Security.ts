import { AppConfigResolved } from './Options';
import { CheckOriginError, CheckUserError } from '@lomasi/common';

export const Security = {
  checkOrigin,
  checkUser,
};

function checkOrigin(origin: string | null, app: AppConfigResolved): true | CheckOriginError {
  if (origin === null) {
    return { type: 'MissingOrigin' };
  }
  if (app.allowedOrigin === null) {
    // no setting => allow only the app origin
    if (app.origin !== origin) {
      return { type: 'InvalidOrigin' };
    }
  } else {
    if (app.allowedOrigin.includes(origin) === false) {
      return { type: 'InvalidOrigin' };
    }
  }
  return true;
}

async function checkUser(user: string, app: AppConfigResolved): Promise<true | CheckUserError> {
  if (app.isUserAllowed) {
    const res = await app.isUserAllowed(user);
    if (res === false) {
      return { type: 'UnauthorizedUser' };
    }
  }
  return true;
}
