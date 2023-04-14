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

/* Search suggest */
ipcMain.on('search-suggest', async (event, query) => {
	if (!query.suggest) {
	  return;
	}
  
	const toJSON = (term) => ({
	  term,
	  url: '/apps/?q=' + encodeURIComponent(term)
	});
  
	try {
	  const terms = await gplay.suggest({ term: query.suggest });
	  const result = terms.map(toJSON);
	  event.reply('search-suggest-result', result);
	} catch (err) {
	  	event.reply('error', err.message);
	}
});

/* Similar apps */
ipcMain.on('get-similar-apps', async (event, options) => {
	try {
	  const apps = await gplay.similar(options);
	  const cleanApps = apps.map(cleanUrls(options));
	  event.reply('similar-apps', cleanApps);
	} catch (err) {
	  	event.reply('error', err.message);
	}
  });
  
  /* Data Safety */
  ipcMain.on('get-data-safety', async (event, options) => {
	try {
	  const dataSafety = await gplay.datasafety(options);
	  event.reply('data-safety', dataSafety);
	} catch (err) {
	  	event.reply('error', err.message);
	}
  });
  
  /* App permissions */
  ipcMain.on('get-app-permissions', async (event, options) => {
	try {
	  const permissions = await gplay.permissions(options);
	  event.reply('app-permissions', permissions);
	} catch (err) {
	  	event.reply('error', err.message);
	}
  });

  /* App reviews */
ipcMain.on('get-reviews', async (event, options) => {
	try {
	  const reviews = await gplay.reviews(options);
	  const page = parseInt(options.page || '0');
	  const subpath = `/apps/${options.appId}/reviews/`;
  
	  if (page > 0) {
		const prevUrl = new URLSearchParams();
		prevUrl.set('page', page - 1);
		reviews.prev = `${subpath}?${prevUrl.toString()}`;
	  }
  
	  if (reviews.results.length) {
		const nextUrl = new URLSearchParams();
		nextUrl.set('page', page + 1);
		reviews.next = `${subpath}?${nextUrl.toString()}`;
	  }
  
	  event.reply('reviews', reviews);
	} catch (err) {
	  	event.reply('error', err.message);
	}
  });
  
/* Apps by developer */
ipcMain.on('get-apps-by-dev', async (event, options) => {
	try {
		const apps = await gplay.developer(options);
		const appsWithCleanUrls = apps.map(cleanUrls(options));
		const data = {
			devId: options.devId,
			apps: appsWithCleanUrls
		};
		event.reply('apps-by-dev', data);
	} catch (err) {
		event.reply('error', err.message);
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

		console.log(`Found ${total} apps for term: ${term}`);

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

					console.log(`Found ${apps2.length} apps for subterm: ${app.title}`);

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
			console.log("searchTermMore returning arr:", Object.values(arr));
			return Object.values(arr);
		}
	} catch (err) {
		console.error("Error occurred during search:", err);
		throw err;
	}
}