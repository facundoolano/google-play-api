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
ipcMain.on('get-reviews', async (event, appId) => {
	const options = {
	  appId: appId,
	  sort: gplay.sort.RATING,
	  lang: 'en',
	  country: 'us',
	  num: 10000, // Number of reviews per request 
	};
	
	// get the total number of reviews for the app using the gplay.reviewsCount method. 
	// Calculate the number of requests required to fetch all the reviews
	// create an array of requests using the Array.from method. 
	// Use the Promise.all method to execute all the requests concurrently
	// merge the results using the concat method.
	// use the push.apply() method to append the reviews data from each pagination request to the allReviews array
	
	try {
	  let reviews = await gplay.reviews(options);
	  const allReviews = reviews.data;
  
	  while (reviews.nextPaginationToken) {
		options.nextPaginationToken = reviews.nextPaginationToken;
		reviews = await gplay.reviews(options);
		allReviews.push.apply(allReviews, reviews.data);
	  }
  
	  event.sender.send('reviews-results', {data: allReviews}, appId);
	} catch (err) {
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