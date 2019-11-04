import { HttpError } from 'tumau';
import { AppConfigResolved } from './Options';

export const Security = {
  checkOrigin,
  checkUser,
};

function checkOrigin(origin: string | null, app: AppConfigResolved) {
  if (origin === null) {
    throw new HttpError.Unauthorized('Missing origin');
  }
  if (app.allowedOrigin === null) {
    // no setting => allow only the app origin
    if (app.origin !== origin) {
      throw new HttpError.Unauthorized(`Invalid origin`);
    }
  } else {
    if (app.allowedOrigin.includes(origin) === false) {
      throw new HttpError.Unauthorized(`Invalid origin`);
    }
  }
}

function checkUser(user: string, app: AppConfigResolved) {
  if (app.usersBlackList) {
    if (app.usersBlackList.includes(user)) {
      throw new HttpError.Unauthorized(`Unauthorized user`);
    }
  }
  if (app.usersWhiteList) {
    if (app.usersWhiteList.includes(user) === false) {
      throw new HttpError.Unauthorized(`Unauthorized user`);
    }
  }
}
