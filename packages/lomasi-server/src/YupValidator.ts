import * as Yup from 'yup';
import { Middleware, Context, JsonParserConsumer, HttpError } from 'tumau';

export function YupValidator<T>(schema: Yup.Schema<T>) {
  const Ctx = Context.create<T>('YupValidator');

  const validate: Middleware = async (ctx, next) => {
    const jsonBody = ctx.getOrThrow(JsonParserConsumer);
    const body = await schema.validate(jsonBody).catch((e): never => {
      if (e instanceof Yup.ValidationError) {
        throw new HttpError.BadRequest(e.message);
      }
      throw e;
    });
    return next(ctx.set(Ctx.Provider(body)));
  };

  return {
    validate,
    getValue: (ctx: Context) => ctx.getOrThrow(Ctx.Consumer),
  };
}
