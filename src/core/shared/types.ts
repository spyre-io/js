export type Kv<T> = {[k: string]: T};

export type CancelToken = {
  cancelled: boolean;
  cancel: () => void;
};

export const newCancelToken = () => {
  const token: CancelToken = {
    cancelled: false,
    cancel: () => (token.cancelled = true),
  };

  return token;
};

export class SpyreError extends Error {
  constructor(
    code: number,
    message: string,

    public readonly errors: any[] = [],
  ) {
    super(message);
  }
}
