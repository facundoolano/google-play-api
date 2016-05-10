# google-play-api

Turns [google-play-scraper](https://github.com/facundoolano/google-play-scraper/) into a RESTful API.
See it working [now](https://google-play-api-aubdcilepc.now.sh/api/).

To run locally:

```
npm install
npm run start
```

To run using [now](https://zeit.co/now/):

```
npm insall -g now
now
```

## Example requests

Get the top free apps (default list)
```
GET /api/apps/
```

Get the top free apps with full detail

```
GET /api/apps/?fullDetail=true
```

Get the top selling action games in russia

```
GET /api/apps/?collection=topselling_paid&category=GAME_ACTION&country=ru
```

Get an app detail

```
GET /api/apps/com.dxco.pandavszombies/
```

Get an app detail in spanish

```
GET /api/apps/com.dxco.pandavszombies/?lang=es
```

Get similar apps

```
GET /api/apps/com.dxco.pandavszombies/similar/
```

Get an app's reviews

```
GET /api/apps/com.dxco.pandavszombies/reviews/
```

Search apps

```
GET /api/apps/?q=facebook
```

Get search suggestions for a partial term

```
GET /api/apps/?suggest=face
```

Get apps by developer

```
GET /api/developers/DxCo%20Games/
```

The parameters are taken directly from google-play-scraper. For a full reference check its [documentation](https://github.com/facundoolano/google-play-scraper/#usage).
