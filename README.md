# gps-webtask

Turns [google-play-scraper](https://github.com/facundoolano/google-play-scraper/) into a RESTful API that can be deployed using [webtask.io](https://webtask.io/).

To run locally:

```
npm run start
```

To run in webtask (requires an initialized [wt-cli](https://github.com/auth0/wt-cli) and [webtask-bundle](https://github.com/auth0/webtask-bundle)):

```
npm run push
```

## Example requests

Get the top free apps (default list)
```
GET /gps-api/apps/
```

Get the top free apps with full detail

```
GET /gps-api/apps/?fullDetail=true
```

Get the top selling action games in russia

```
GET /gps-api/apps/?collection=topselling_paid&category=GAME_ACTION&country=ru
```

Get an app detail

```
GET /gps-api/apps/com.dxco.pandavszombies/
```

Get an app detail in spanish

```
GET /gps-api/apps/com.dxco.pandavszombies/?lang=es
```

Get similar apps

```
GET /gps-api/apps/com.dxco.pandavszombies/similar/
```

Get an app's reviews

```
GET /gps-api/apps/com.dxco.pandavszombies/reviews/
```

Search apps

```
GET /gps-api/apps/?q=facebook 
```

Get search suggestions for a partial term

```
GET /gps-api/apps/?suggest=face
```

Get apps by developer

```
GET /gps-api/developers/DxCo%20Games/
```

The parameters are taken directly from google-play-scraper. For a full reference check its [documentation](https://github.com/facundoolano/google-play-scraper/#usage).
