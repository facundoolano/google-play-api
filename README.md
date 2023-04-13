# scu-hci-google-play-scraper

Turns [google-play-scraper](https://github.com/facundoolano/google-play-scraper/) into a Node.js Electron GUI app.

To run locally:

```
npm install
npm start
```

## Example requests

The parameters for each endpoint are taken directly from google-play-scraper. For a full reference check its [documentation](https://github.com/facundoolano/google-play-scraper/#usage).
 
Get the top free apps with full detail

```http
GET /api/apps/?fullDetail=true
``` 

Get app required permissions with full descriptions

```http
GET /api/apps/org.wikipedia/permissions/
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

## License
This project is licensed under the MIT License - see the LICENSE file for details.
