# google-play-api

Turns [google-play-scraper](https://github.com/facundoolano/google-play-scraper/) into a RESTful API.

To run locally:

```
npm install
npm start
```

To run using [now](https://zeit.co/now/):

```
npm install -g now
now
```

## Play With Docker

[![Try in PWD](https://raw.githubusercontent.com/play-with-docker/stacks/master/assets/images/button.png)](https://labs.play-with-docker.com/?stack=https://gist.githubusercontent.com/srikanthlogic/49d3dd76cf1117f775fdc5c9746cd091/raw/8593bfa6b15036616147e8f672ecb558fcf87fc6/docker-compose.yml)[![Deploy to Heroku](https://deploy-button.herokuapp.com/deploy.png)](https://deploy-button.herokuapp.com/deploy/facundoolano/google-play-api)

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