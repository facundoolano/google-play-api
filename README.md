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

## Try

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/14476425-6c81de84-6e95-48af-8f67-2c9d993a6162?action=collection%2Ffork&collection-url=entityId%3D14476425-6c81de84-6e95-48af-8f67-2c9d993a6162%26entityType%3Dcollection%26workspaceId%3D8dad75f0-8f24-4de1-b8d8-f78d2b788df8#?env%5BHeroku%20-%20Google%20Play%20API%5D=W3sia2V5IjoiSE9TVCIsInZhbHVlIjoiaHR0cHM6Ly9ncGxheWFwaS5oZXJva3VhcHAuY29tIiwiZW5hYmxlZCI6dHJ1ZX1d)


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
GET /api/apps/com.dxco.pandavszombies/
```

Get an app detail in spanish

```http
GET /api/apps/com.dxco.pandavszombies/?lang=es
```

Get app required permissions with full descriptions

```http
GET /api/apps/com.dxco.pandavszombies/permissions/
```

Get app required permissions (short list)

```http
GET /api/apps/com.dxco.pandavszombies/permissions/?short=true
```

Get similar apps

```http
GET /api/apps/com.dxco.pandavszombies/similar/
```

Get an app's reviews

```http
GET /api/apps/com.dxco.pandavszombies/reviews/
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
GET /api/developers/DxCo%20Games/
```
