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
	
/* App search */
router.get("/apps", async (req, res, next) => {
	try {
		const query = req.query.q || "";
		const num = parseInt(req.query.num, 10) || 20;
		const page = parseInt(req.query.page, 10) || 1;
		const startIndex = (page - 1) * num; 

		searchTermMore(query, startIndex + num);

		setTimeout(() => {
		let apps;
		try {
			apps = require(path.join(__dirname, "app-reviews", `${query}.json`));
		} catch (error) {
			apps = [];
		}
		const cleanApps = apps.map(cleanUrls(req)).filter((app) => app.url);

		const totalPages = Math.ceil(cleanApps.length / num);
		const results = cleanApps.slice(startIndex, startIndex + num); 

		res.json({ query, pageNum: page, totalPages, results });
		}, 5000);
	} catch (error) {
		next(error);
	}
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