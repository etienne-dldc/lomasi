import { HttpError, Route } from 'tumau';

export const NotFoundRoute = Route.GET(null, () => {
  throw new HttpError.NotFound();
});
