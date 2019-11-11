import { RouterPackage } from 'tumau';
import { LoginRoute } from './Login';
import { NotFoundRoute } from './NotFound';
import { AuthenticateRoute } from './Authenticate';

export const Routes = RouterPackage([LoginRoute, AuthenticateRoute, NotFoundRoute]);
