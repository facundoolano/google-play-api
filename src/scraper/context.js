import { createRequestContext } from './lib/utils/request.js';

export function withRequestContext (fn) {
  return (opts = {}) => fn({
    ...opts,
    requestContext: opts.requestContext || createRequestContext()
  });
}
