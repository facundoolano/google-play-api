const { app, BrowserWindow, ipcMain, session } = require("electron");
const gplay = require("google-play-scraper"); // https://www.npmjs.com/package/google-play-scraper

// Set ELECTRON_DISABLE_SECURITY_WARNINGS environment variable
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

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

	mainWindow.loadFile(__dirname + "/index.html");

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

		if (results.length === 0) {
			event.sender.send('search-error', 'No apps found for this search term.');
			return;
		}

		event.sender.send('search-results', JSON.stringify(results), searchTerm); 
	} catch (err) {
		event.sender.send('search-error', err.message);
	}
});

/* App Suggest */
ipcMain.on('suggest', async (event, searchTerm) => {
	try {
		const results = await gplay.suggest({term: searchTerm});
		event.sender.send('suggest-results', JSON.stringify(results), searchTerm);
	} catch (err) {
		event.sender.send('suggest-error', err.message);
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

  /* App List */
  ipcMain.on('get-app-list', async (event, numAppList, sortByCollection, sortByCategory, sortByAge ) => { 
	try {
		const collectionOptions = (() => {
			switch(sortByCollection) {
			  case "TOP_PAID": return gplay.sort.TOP_PAID;
			  case "GROSSING": return gplay.sort.GROSSING;
			  default: return gplay.sort.TOP_FREE;
			}
		  })();

		  const categoryOptions = (() => {
			switch(sortByCategory) {
				case "APPLICATION": return gplay.category.APPLICATION;
				case "ANDROID_WEAR": return gplay.category.ANDROID_WEAR;
				case "ART_AND_DESIGN": return gplay.category.ART_AND_DESIGN;
				case "AUTO_AND_VEHICLES": return gplay.category.AUTO_AND_VEHICLES;
				case "BEAUTY": return gplay.category.BEAUTY;
				case "BOOKS_AND_REFERENCE": return gplay.category.BOOKS_AND_REFERENCE;
				case "BUSINESS": return gplay.category.BUSINESS;
				case "COMICS": return gplay.category.COMICS;
				case "COMMUNICATION": return gplay.category.COMMUNICATION;
				case "DATING": return gplay.category.DATING;
				case "EDUCATION": return gplay.category.EDUCATION;
				case "ENTERTAINMENT": return gplay.category.ENTERTAINMENT;
				case "EVENTS": return gplay.category.EVENTS;
				case "FINANCE": return gplay.category.FINANCE;
				case "FOOD_AND_DRINK": return gplay.category.FOOD_AND_DRINK;
				case "HEALTH_AND_FITNESS": return gplay.category.HEALTH_AND_FITNESS;
				case "HOUSE_AND_HOME": return gplay.category.HOUSE_AND_HOME;
				case "LIBRARIES_AND_DEMO": return gplay.category.LIBRARIES_AND_DEMO;
				case "LIFESTYLE": return gplay.category.LIFESTYLE;
				case "MAPS_AND_NAVIGATION": return gplay.category.MAPS_AND_NAVIGATION;
				case "MEDICAL": return gplay.category.MEDICAL;
				case "MUSIC_AND_AUDIO": return gplay.category.MUSIC_AND_AUDIO;
				case "NEWS_AND_MAGAZINES": return gplay.category.NEWS_AND_MAGAZINES;
				case "PARENTING": return gplay.category.PARENTING;
				case "PERSONALIZATION": return gplay.category.PERSONALIZATION;
				case "PHOTOGRAPHY": return gplay.category.PHOTOGRAPHY;
				case "PRODUCTIVITY": return gplay.category.PRODUCTIVITY;
				case "SHOPPING": return gplay.category.SHOPPING;
				case "SOCIAL": return gplay.category.SOCIAL;
				case "SPORTS": return gplay.category.SPORTS;
				case "TOOLS": return gplay.category.TOOLS;
				case "TRAVEL_AND_LOCAL": return gplay.category.TRAVEL_AND_LOCAL;
				case "VIDEO_PLAYERS": return gplay.category.VIDEO_PLAYERS;
				case "WATCH_FACE": return gplay.category.WATCH_FACE;
				case "WEATHER": return gplay.category.WEATHER;
				case "GAME": return gplay.category.GAME;
				case "GAME_ACTION": return gplay.category.GAME_ACTION;
				case "GAME_ADVENTURE": return gplay.category.GAME_ADVENTURE;
				case "GAME_ARCADE": return gplay.category.GAME_ARCADE;
				case "GAME_BOARD": return gplay.category.GAME_BOARD;
				case "GAME_CARD": return gplay.category.GAME_CARD;
				case "GAME_CASINO": return gplay.category.GAME_CASINO;
				case "GAME_CASUAL": return gplay.category.GAME_CASUAL;
				case "GAME_EDUCATIONAL": return gplay.category.GAME_EDUCATIONAL;
				case "GAME_MUSIC": return gplay.category.GAME_MUSIC;
				case "GAME_PUZZLE": return gplay.category.GAME_PUZZLE;
				case "GAME_RACING": return gplay.category.GAME_RACING;
				case "GAME_ROLE_PLAYING": return gplay.category.GAME_ROLE_PLAYING;
				case "GAME_SIMULATION": return gplay.category.GAME_SIMULATION;
				case "GAME_SPORTS": return gplay.category.GAME_SPORTS;
				case "GAME_STRATEGY": return gplay.category.GAME_STRATEGY;
				case "GAME_TRIVIA": return gplay.category.GAME_TRIVIA;
				case "GAME_WORD": return gplay.category.GAME_WORD;
			}
		})();

		const ageOptions = (() => {
			switch(sortByAge) {
				case "FIVE_UNDER": return gplay.age.FIVE_UNDER;
				case "SIX_EIGHT": return gplay.age.SIX_EIGHT;
				case "NINE_UP": return gplay.age.NINE_UP;
			}
		})();

		const appList = await gplay.list({
			collection: collectionOptions,
			category: categoryOptions,
			age: ageOptions,
			num: parseInt(numAppList),
			lang: 'en',
			country: 'us'
		});

		event.sender.send('app-list-results', appList, sortByCollection, sortByCategory, sortByAge);
		  
	} catch (err) {
		event.sender.send('app-list-error', err.message);
	}
});

/* Developer */
ipcMain.on('get-developer', async (event, devId) => {
	try {
	  const options = {
		devId: devId,
		lang: 'en',
		country: 'us'
	  };
  
	  const developer = await gplay.developer(options);
  
	  if (developer.length === 0) {
		event.sender.send('developer-error', 'Developer information is not available for this app.');
		return;
	  }
  
	  event.sender.send('developer-results', developer, devId);
	} catch (err) {
	  	event.sender.send('developer-error', err.message);
	}
  });
  
/* Data Safety */
ipcMain.on('get-data-safety', async (event, appId) => {
	try { 
	  const dataSafety = await gplay.datasafety({ appId: appId, lang: 'en', country: 'us' }); 
	  if (
		!dataSafety.sharedData.length &&
		!dataSafety.collectedData.length &&
		!dataSafety.securityPractices.length &&
		dataSafety.privacyPolicyUrl === undefined
	  ) {
		event.sender.send('data-safety-error', 'Data safety information is not available for this app.');
		return;
	  }
	  
	  event.sender.send('data-safety-results', dataSafety, appId);
	} catch (err) {
	  event.sender.send('data-safety-error', err.message);
	}
  });  
  
  /* App Permissions */
  ipcMain.on('get-app-permissions', async (event, appId) => {
	try {
	  const permissions = await gplay.permissions({ appId: appId, lang: 'en', country: 'us' }); 
	  if (permissions.length === 0) {
		// Display an error tooltip when the app has no permissions
		event.sender.send('permission-error', 'Permission information is not available for this app.');
		return;
	  }
	  
	  event.sender.send('permission-results', permissions, appId); 
	} catch (err) {
		console.error("Error generating permissions for app:", appId, err);
		event.sender.send('permission-error', err.message);
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
		
		// { data: [], nextPaginationToken: null }
		if (reviews.data.length === 0) {
		  event.sender.send('reviews-error', 'No reviews found for this app.');
		  return;
		}

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

async function searchTermMore(term, arr = {}) { // time complexity: O(n^2)
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