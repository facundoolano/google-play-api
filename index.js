const { app, BrowserWindow, ipcMain, session } = require("electron");
const gplay = require("google-play-scraper"); // https://www.npmjs.com/package/google-play-scraper

function createWindow() {
	const mainWindow = new BrowserWindow({
		webPreferences: {
			// Set the Content Security Policy for the renderer process
			// Only allow content to be loaded from the same origin
			// Disable inline script and eval functions
			// Enable remote module (use with caution)
			// See https://www.electronjs.org/docs/tutorial/security#6-enable-context-isolation-for-remote-content
			// for more information about remote module and context isolation 
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
			contentSecurityPolicy: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'"
		}
	});

	mainWindow.loadFile("index.html");

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
	createWindow();

	app.on("ready", () => {
		session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
			const newHeaders = Object.assign({}, details.responseHeaders, {
				'Content-Security-Policy': ["default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'"],
			});
			callback({
				responseHeaders: newHeaders
			});
		});
	});

	app.on("activate", function() {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", function() {
	if (process.platform !== "darwin") app.quit();
});

/* App Search */ 
ipcMain.on('search', async (event, searchTerm) => {
	try {
		const results = await searchTermMore(searchTerm);
		event.sender.send('search-results', JSON.stringify(results), searchTerm); 
	} catch (err) {
		event.sender.send('search-error', err);
	}
});

/* App Suggest */
ipcMain.on('suggest', async (event, searchTerm) => {
	try {
		const results = await gplay.suggest({term: searchTerm});
		event.sender.send('suggest-results', JSON.stringify(results), searchTerm);
	} catch (err) {
		event.sender.send('suggest-error', err);
	}
});

/* Similar Apps */
ipcMain.on('get-similar-apps', async (event, appId) => {
	try {
		const similarApps = await gplay.similar({ appId: appId, lang: 'en', country: 'us' });
		event.sender.send('similar-apps-results', similarApps, appId);
	} catch (err) {
		event.sender.send('similar-apps-error', err.message);
	}
});

  /* App Details */
  ipcMain.on('get-app-details', async (event, appId) => {
	try {
		const appDetails = await gplay.app({ appId: appId, lang: 'en', country: 'us' });
		event.sender.send('app-details-results', appDetails, appId);
	} catch (err) {
		event.sender.send('app-details-error', err.message);
	}
});
 
/* Data Safety */
ipcMain.on('get-data-safety', async (event, appId) => {
	try { 
	  const dataSafety = await gplay.datasafety({ appId: appId, lang: 'en', country: 'us' }); 
	  event.sender.send('data-safety-results', dataSafety, appId);
	} catch (err) {
	  event.sender.send('data-safety-error', err.message)
	}
  });
  
  
  /* App Permissions */
  ipcMain.on('get-app-permissions', async (event, appId) => {
	try {
	  const permissions = await gplay.permissions({ appId: appId, lang: 'en', country: 'us' }); 
	  event.sender.send('permission-results', permissions, appId); 
	} catch (err) {
		console.error("Error generating permissions for app:", appId, err);
		event.sender.send('permission-results-error', err.message);
	}
  });
  
/* App reviews */ 
const NodeCache = require("node-cache");
const reviewCache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // Cache for 24 hours

ipcMain.on('get-reviews', async (event, appId, numReviews, sortBy) => {
	const cacheKey = `reviews-${appId}-${numReviews}-${sortBy}`;
	const cachedReviews = reviewCache.get(cacheKey);
  
	if (cachedReviews) {
	  console.log(`Returning cached reviews for app: ${appId}`);
	  event.sender.send('reviews-results', cachedReviews, appId);
	  return;
	}
  
	const sortOption = (() => {
	  switch(sortBy) {
		case "RATING": return gplay.sort.RATING;
		case "HELPFULNESS": return gplay.sort.HELPFULNESS;
		default: return gplay.sort.NEWEST;
	  }
	})();
	
	const options = {
	  appId: appId, 
	  sort: sortOption,
	  lang: 'en',
	  country: 'us',
	  num: parseInt(numReviews)
	};
	
	let reviews; // Initialize the variable reviews before it is used
  
	try {
	  reviews = await gplay.reviews(options); // Assign the value returned by the API to reviews
	  if (reviews.length > options.num) {
		reviews = reviews.slice(0, options.num); // Truncate the reviews array to the desired length
	  }
	  reviewCache.set(cacheKey, reviews);
	  console.log(`Caching ${reviews.length} reviews for app: ${appId}`);
	  event.sender.send('reviews-results', reviews, appId);
	} catch (err) {
	  console.error("Error occurred while getting reviews:", err);
	  event.sender.send('reviews-error', err.message);
	}
  });  

async function searchTermMore(term, arr = {}) {
	if (!term) {
		console.error("Error: search term is undefined");
		return;
	}

	let total = 0;
	let i = 0;
	let count = 0;

	console.log("searchTermMore called with term:", term);

	try {
		const apps = await gplay.search({
			term: term,
			num: 20,
		});

		total = apps.length; 

		if (apps.length === 0) {
			console.log(`No apps found for term: ${term}`);
			return Object.values(arr);
		}

		await Promise.all(
			apps.map(async (app) => {
				try {
					const apps2 = await gplay.search({
						term: app.title,
						num: 100,
					}); 

					for (let app of apps2) {
						if (!(app.appId in arr)) {
							arr[app.appId] = app;
							i++;
						}
					}
				} catch (err) {
					console.error(`Error occurred during subterm search for ${app.title}:`, err);
				}
				count++;
			})
		);

		if (count < total) {
			console.log(`Not all apps for term: ${term} have been processed, calling searchTermMore again`);
			return await searchTermMore(term, arr);
		} else { 
			return Object.values(arr);
		}
	} catch (err) {
		console.error("Error occurred during search:", err);
		throw err;
	}
}