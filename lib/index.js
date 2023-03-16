const Express = require("express");
const gplay = require("google-play-scraper");
const qs = require("querystring");
const fs = require("fs");
const path = require("path");
const router = Express.Router();  

const toList = (apps) => ({
	results: apps
}); 

function searchTermMore(term, num) {
	const arr = {};
	let total = -1;
	let i = 0;
	let count = 0;

	gplay.search({
		term: term,
		num: Math.min(num, 250), // add a check to stop at 250 apps
	}).then(first);

	function first(apps) {
		total = Math.min(apps.length, 250); // add a check to stop at 250 apps

		for (let app of apps) {
			arr[app.appId] = app;
			i++;

			if (i >= 250) { // add a check to stop at 250 apps
				break;
			}

			gplay.search({
				term: app.title,
				num: 100,
			}).then(second);
		}

		function second(apps2) {
			for (let app of apps2) {
				if (!(app.appId in arr)) {
					arr[app.appId] = app;
					i++;

					if (i >= 250) { // add a check to stop at 250 apps
						break;
					}
				}
			}
			count++;
		}
	}
 
	function writeOutputFile(arr, outputFilePath) {
		const arrValues = Object.values(arr);
		const outputFileData = JSON.stringify(arrValues, null, 2);

		const dirPath = path.join(__dirname, "app-reviews");
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath);
		}

		fs.writeFile(path.join(dirPath, outputFilePath), outputFileData, (err) => {
			if (err) { 
				console.log(err);
			} else {
				console.log("JSON data is saved.");
			}
		});
	}

	function checkFlag() {
		if (count != total) {
			setTimeout(checkFlag, 1000);
		} else {
			writeOutputFile(arr, `${term}.json`);
		}
	}

	checkFlag();
}

const cleanUrls = (req) => (app) => Object.assign({}, app, {
	playstoreUrl: app.url,
	url: buildUrl(req, "apps/" + app.appId),
	permissions: buildUrl(req, "apps/" + app.appId + "/permissions"),
	similar: buildUrl(req, "apps/" + app.appId + "/similar"),
	reviews: buildUrl(req, "apps/" + app.appId + "/reviews"),
	datasafety: buildUrl(req, "apps/" + app.appId + "/datasafety"),
	developer: {
		devId: app.developer,
		url: buildUrl(req, "developers/" + qs.escape(app.developer))
	},
	categories: buildUrl(req, "categories/") + "?" + qs.stringify({
		cat: app.genre
	})
});

const buildUrl = (req, subpath) => {
	if (typeof subpath !== "string") {
		throw new TypeError("The 'subpath' argument must be of type string.");
	}
	return req.protocol + "://" + path.join(req.get("host"), req.baseUrl, subpath);
};

/* Index */
router.get("/", (req, res) =>
	res.json({
		apps: buildUrl(req, "apps"),
		developers: buildUrl(req, "developers"),
		categories: buildUrl(req, "categories")
	}));   
	
	const TOKEN_BUCKET_CAPACITY = 10;
	const TOKEN_BUCKET_REFILL_RATE = 2; // tokens per second
	
	let lastTokenRefillTime = Date.now();
	let tokenBucket = TOKEN_BUCKET_CAPACITY;
	
	function getToken() {
	  const now = Date.now();
	  const timeSinceLastRefill = (now - lastTokenRefillTime) / 1000; // in seconds
	  const tokensToAdd = timeSinceLastRefill * TOKEN_BUCKET_REFILL_RATE;
	
	  tokenBucket = Math.min(tokenBucket + tokensToAdd, TOKEN_BUCKET_CAPACITY);
	  lastTokenRefillTime = now;
	
	  if (tokenBucket > 0) {
		tokenBucket -= 1;
		return true;
	  } else {
		return false;
	  }
	}
	
	const MAX_RETRIES = 5; // Maximum number of retries
	const INITIAL_BACKOFF_DELAY = 500; // Initial backoff delay in milliseconds
	const BACKOFF_FACTOR = 2; // Backoff factor for exponential backoff
	const CACHE_TTL = 300; // Time-to-live for cache in seconds
	
	// A simple in-memory cache implementation
	const cache = new Map();
	
	router.get("/apps", async (req, res, next) => {
	  let retries = 0; // Number of retries so far
	  let backoffDelay = INITIAL_BACKOFF_DELAY; // Current backoff delay
	
	  while (retries < MAX_RETRIES) {
		try {
		  const query = req.query.q || "";
		  const num = parseInt(req.query.num, 10) || 20;
		  const page = parseInt(req.query.page, 10) || 1;
		  const startIndex = (page - 1) * num;
	
		  if (!getToken()) {
			// If there are no tokens left, wait for the next refill before processing the request
			await new Promise((resolve) =>
			  setTimeout(resolve, 1000 / TOKEN_BUCKET_REFILL_RATE)
			);
			lastTokenRefillTime = Date.now(); // Reset lastTokenRefillTime to avoid adding too many tokens
		  }
	
		  searchTermMore(query, startIndex + num);
	
		  // Check cache first
		  const cacheKey = `${query}-${startIndex}-${num}`;
		  const cachedData = cache.get(cacheKey);
		  if (cachedData) {
			const { data, updatedAt } = cachedData;
			if (Date.now() - updatedAt <= CACHE_TTL * 1000) {
			  // If the cached data is still valid, return it
			  res.json(data);
			  return;
			} else {
			  // Otherwise, delete the stale cache entry
			  cache.delete(cacheKey);
			}
		  }
	
		  const apps = require(
			path.join(__dirname, "app-reviews", `${query}.json`)
		  );
		  const cleanApps = apps.map(cleanUrls(req)).filter((app) => app.url);
		  const totalPages = Math.ceil(cleanApps.length / num);
		  const results = cleanApps.slice(startIndex, startIndex + num);
		  const responseData = { query, pageNum: page, totalPages, results };
	
		  // Cache the response data
		  cache.set(cacheKey, { data: responseData, updatedAt: Date.now() });
	
		  res.json(responseData);
		  return; // Return immediately if the request is successful
	
		} catch (error) {
		  if (error.response && error.response.status === 429) {
			// If the error is a 429, wait for an exponentially increasing amount of time before retrying
			const waitTime = backoffDelay * BACKOFF_FACTOR ** retries;
			await new Promise((resolve) => setTimeout(resolve, waitTime));
			retries++;
			// Reset cache for the current query if we've exhausted all retries
			if (retries >= MAX_RETRIES) {
			  const cacheKey = `${query}-${startIndex}-${num}`;
			  cache.delete(cacheKey);
			}
		  } else {
			next(error); // For any other error, pass it to the error handling middleware
			return;
		  }
		}
	  }
	
	  // If we reach this point, it means we've exceeded the maximum number of retries
	  res.status(429).send("Too many requests. Please try again later.");
	});	

/* App detail */
router.get("/apps/:appId", function(req, res, next) {
	const opts = Object.assign({
		appId: req.params.appId
	}, req.query);
	gplay.app(opts)
		.then(cleanUrls(req))
		.then(res.json.bind(res))
		.catch(next);
});

/* Similar apps */
router.get("/apps/:appId/similar", function(req, res, next) {
	const opts = Object.assign({
		appId: req.params.appId
	}, req.query);
	gplay.similar(opts)
		.then((apps) => apps.map(cleanUrls(req)))
		.then(toList)
		.then(res.json.bind(res))
		.catch(next);
});

/* Data Safety */
router.get("/apps/:appId/datasafety", function(req, res, next) {
	const opts = Object.assign({
		appId: req.params.appId
	}, req.query);
	gplay.datasafety(opts)
		.then(toList)
		.then(res.json.bind(res))
		.catch(next);
});

/* App permissions */
router.get("/apps/:appId/permissions", function(req, res, next) {
	const opts = Object.assign({
		appId: req.params.appId
	}, req.query);
	gplay.permissions(opts)
		.then(toList)
		.then(res.json.bind(res))
		.catch(next);
});

/* App reviews */
router.get("/apps/:appId/reviews", function(req, res, next) {
	function paginate(apps) {
		const page = parseInt(req.query.page || "0");

		const subpath = "/apps/" + req.params.appId + "/reviews/";
		if (page > 0) {
			req.query.page = page - 1;
			apps.prev = buildUrl(req, subpath) + "?" + qs.stringify(req.query);
		}

		if (apps.results.length) {
			req.query.page = page + 1;
			apps.next = buildUrl(req, subpath) + "?" + qs.stringify(req.query);
		}

		return apps;
	}

	const opts = Object.assign({
		appId: req.params.appId
	}, req.query);
	gplay.reviews(opts)
		.then(toList)
		.then(paginate)
		.then(res.json.bind(res))
		.catch(next);
});

/* Apps by developer */
router.get("/developers/:devId/", function(req, res, next) {
	const opts = Object.assign({
		devId: req.params.devId
	}, req.query);

	gplay.developer(opts)
		.then((apps) => apps.map(cleanUrls(req)))
		.then((apps) => ({
			devId: req.params.devId,
			apps
		}))
		.then(res.json.bind(res))
		.catch(next);
});

/* Developer list (not supported) */
router.get("/developers/", (req, res) =>
	res.status(400).json({
		message: "Please specify a developer id.",
		example: buildUrl(req, "/developers/" + qs.escape("Wikimedia Foundation"))
	}));

/* Category list */
router.get("/categories/", function(req, res, next) {
	gplay.categories()
		.then(res.json.bind(res))
		.catch(next);
});

function errorHandler(err, req, res, next) {
	res.status(400).json({
		message: err.message
	});
	next();
}

router.use(errorHandler);

module.exports = router;