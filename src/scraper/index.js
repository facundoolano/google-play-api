import { constants } from './lib/constants.js';
import appMethod from './lib/app.js';

import list from './lib/list.js';
import search from './lib/search.js';
import suggest from './lib/suggest.js';
import developer from './lib/developer.js';
import reviews from './lib/reviews.js';
import similar from './lib/similar.js';
import permissions from './lib/permissions.js';
import datasafety from './lib/datasafety.js';
import categories from './lib/categories.js';
import { withRequestContext } from './context.js';

const app = withRequestContext(appMethod);
const methods = {
  app,
  list: withRequestContext(list),
  search: withRequestContext((opts) => search(app, opts)),
  suggest: withRequestContext(suggest),
  developer: withRequestContext(developer),
  reviews: withRequestContext(reviews),
  similar: withRequestContext(similar),
  permissions: withRequestContext(permissions),
  datasafety: withRequestContext(datasafety),
  categories: withRequestContext(categories)
};

export default Object.assign({}, constants, methods);
