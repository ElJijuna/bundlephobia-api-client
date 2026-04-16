export type RequestFn = <T>(
  path: string,
  params?: Record<string, string | number | boolean>,
  signal?: AbortSignal,
) => Promise<T>;
