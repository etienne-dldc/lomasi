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

function checkUser(user: string, app: AppConfigResolved): true | CheckUserError {
  if (app.usersBlackList) {
    if (app.usersBlackList.includes(user)) {
      return { type: 'UnauthorizedUser' };
    }
  }
  if (app.usersWhiteList) {
    if (app.usersWhiteList.includes(user) === false) {
      return { type: 'UnauthorizedUser' };
    }
  }
  return true;
}
