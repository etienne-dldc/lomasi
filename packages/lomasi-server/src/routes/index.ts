import { RouterPackage } from 'tumau';
import { LoginRoute } from './Login';
import { NotFoundRoute } from './NotFoundRoute';

export const Routes = RouterPackage([LoginRoute, NotFoundRoute]);
