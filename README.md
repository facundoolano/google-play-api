# scu-hci-google-play-scraper

Turns [google-play-scraper](https://github.com/facundoolano/google-play-scraper/) into a Node.js Electron GUI app.

## App Features

**Search**

```http
GET /api/apps/org.wikipedia/datasafety/
```

**App List**

```http
GET /api/apps/org.wikipedia/similar/
```

**Developer**

```http
GET /api/apps/org.wikipedia/reviews/
```

**Reviews**

```http
GET /api/apps/?q=facebook
```

**Similar Apps**

```http
GET /api/apps/?suggest=face
```

**Permissions**

```http
GET /api/developers/Wikimedia%20Foundation/
```

**Data Safety**

## License

- This project is licensed under the MIT License - see the LICENSE file for details. 