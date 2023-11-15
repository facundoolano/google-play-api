# google-play-api

Turns [google-play-scraper](https://github.com/facundoolano/google-play-scraper/) into a RESTful API.

To run locally:

```
npm install
npm start
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
