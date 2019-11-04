import { RouterPackage } from 'tumau';
import { LoginRoute } from './Login';
import { NotFoundRoute } from './NotFound';
import { RenewRoute } from './Renew';

export const Routes = RouterPackage([LoginRoute, RenewRoute, NotFoundRoute]);
