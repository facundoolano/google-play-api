# google-play-api

Cloudflare Workers REST API for Google Play app data. Existing API paths,
authentication, query parameters, and response fields are kept compatible with
the original Node.js service.

## Setup

To run locally with Cloudflare Workers:

```bash
# Install dependencies
npm install

# Create local Worker secrets
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set API_KEY

# Start the Worker
npm run dev
```

## google-play-scraper Version

This project vendors the parsing modules from `google-play-scraper` **10.1.3** and
uses a Workers-native `fetch` request adapter. The Node.js-only `got`,
`tough-cookie`, `dotenv`, and Express server entrypoint are not used at runtime.

The parser includes the upstream fix for the bug that caused the following
error for certain apps:

```
TypeError: Cannot read properties of undefined (reading 'length')
```

**Related Issue:** [google-play-scraper#720](https://github.com/facundoolano/google-play-scraper/issues/720)

The bug was fixed in version 10.1.1 by using `Array.isArray()` check instead of just checking for `null`.

## Authentication

All API endpoints require authentication using an API key. Include your API key in the request headers:

```bash
curl -H "x-api-key: your_api_key_here" http://localhost:8080/api/apps/
```

## Example requests

The parameters for each endpoint are taken directly from google-play-scraper. For a full reference check its [documentation](https://github.com/facundoolano/google-play-scraper/#usage).

Get the top free apps (default list)
```http
GET /api/apps/
```

Get the top free apps with full detail
```http
GET /api/apps/?fullDetail=true
```

Get the top selling action games in russia
```http
GET /api/apps/?collection=topselling_paid&category=GAME_ACTION&country=ru
```

Get an app detail
```http
GET /api/apps/org.wikipedia/
```

Get an app detail in spanish
```http
GET /api/apps/org.wikipedia/?lang=es
```

Get app required permissions with full descriptions
```http
GET /api/apps/org.wikipedia/permissions/
```

Get app required permissions (short list)
```http
GET /api/apps/org.wikipedia/permissions/?short=true
```

Get app data safety information
```http
GET /api/apps/org.wikipedia/datasafety/
```

Get similar apps
```http
GET /api/apps/org.wikipedia/similar/
```

Get an app's reviews
```http
GET /api/apps/org.wikipedia/reviews/
```

Search apps
```http
GET /api/apps/?q=facebook
```

Get search suggestions for a partial term
```http
GET /api/apps/?suggest=face
```

Get apps by developer
```http
GET /api/developers/Wikimedia%20Foundation/
```

Get categories
```http
GET /api/categories/
```

Note: Remember to include the `x-api-key` header in all requests.

## Deploy

Set the API key as a Worker secret and deploy with Wrangler:

```bash
npx wrangler login
npx wrangler secret put API_KEY
npm run deploy
```

`PUBLIC_BASE_URL` is optional. When it is not set, generated API links use the
request origin. Set it as a Wrangler variable when the public API is served
behind a custom hostname:

```bash
npx wrangler deploy --var PUBLIC_BASE_URL:https://api.example.com
```

The deployed Worker continues to use the existing `/api/...` routes and
`x-api-key` header, so existing clients do not need to change.
