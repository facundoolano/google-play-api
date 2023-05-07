const {
  ipcRenderer
} = require("electron");

// Get the search input and form
const searchInput = document.getElementById("search-input");
const searchForm = document.getElementById("search-form");

// Get the tooltip element and suggestions list
const tooltip = document.getElementById('search-tooltip');
const suggestionsList = document.getElementById('suggestions-list');
 
// Get the review input and form
const reviewInput = document.getElementById("review-input");
const reviewForm = document.getElementById("review-form");
const reviewAmountSelect = document.getElementById("review-amount");
const reviewSortSelect = document.getElementById("review-sort");

// Get developer input and form
const developerInput = document.getElementById("developer-input");
const developerForm = document.getElementById("developer-form"); 
const ErrorTooltip = document.getElementById('error-tooltip');

// Get permission input and form
const permissionInput = document.getElementById("permission-input");
const permissionForm = document.getElementById("permission-form");

// Get data safety input and form
const dataSafetyInput = document.getElementById("data-safety-input");
const dataSafetyForm = document.getElementById("data-safety-form");

// Get similar apps input and form
const similarAppsInput = document.getElementById("similar-apps-input");
const similarAppsForm = document.getElementById("similar-apps-form");

// Get app details input and form
const appDetailsInput = document.getElementById("app-details-input");
const appDetailsForm = document.getElementById("app-details-form");

// Get app list amount select
const appListForm = document.getElementById("app-list-form");
const appListAmount = document.getElementById("app-list-amount");
const appCollectionList = document.getElementById("app-list-collection");
const appCategoryList = document.getElementById("app-list-category");
const appAgeList = document.getElementById("app-list-age");

document.getElementById("backButton").onclick = function() {
  location.href = "../src/index.html";
};

// Function to generate CSV data from an array of objects
function generateCSVData(data, fields) { // time complexity: O(N * M)
  let objects = Array.isArray(data) ? data : [data];
  let csvData = "";

  // Loop through each object and add it to the CSV data string
  csvData += fields.join(",") + "\n";
  objects.forEach((obj) => {
    const row = [];
    fields.forEach((field) => {
      if (field in obj) {
        if (typeof obj[field] === "string") {
          row.push(`"${obj[field].replace(/"/g, '""')}"`);
        } else {
          row.push(obj[field]);
        }
      } else {
        row.push("N/A");
      }
    });
    csvData += row.join(",") + "\n";
  });

  return csvData;
}

// Function to download a CSV file with the given data and filename
function downloadCSVFile(csvData, filename) { // time complexity: O(1)
  // Create a temporary link to download the CSV file
  const link = document.createElement("a");
  link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvData));
  // save to csvs folder
  link.setAttribute("download", filename);

  // Append the link to the document body and click it to download the CSV file
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

if (searchInput && searchForm) {
  let suggestTimeout;

  // Search form event listener
  searchForm.addEventListener("submit", (event) => { // time complexity: O(1)
    event.preventDefault();

    const searchTerm = searchInput.value.trim();

    // Clear the previous suggestions
    suggestionsList.innerHTML = '';

    ipcRenderer.send("search", searchTerm);
  });

  // Search input event listeners
  searchInput.addEventListener("input", async () => { // time complexity: O(1)
    const searchTerm = searchInput.value.trim();

    // Only show the tooltip if the search term is not empty
    if (searchTerm !== '') {
      // Check if there is a pending suggest request
      if (suggestTimeout) {
        clearTimeout(suggestTimeout);
      }

      // Set a timer to aggregate similar search requests
      suggestTimeout = setTimeout(async () => {
        try {
          // Get the suggestions from the main process
          const suggestions = await ipcRenderer.send('suggest', searchTerm);

          // Clear the previous suggestions
          suggestionsList.innerHTML = '';

          // Check if suggestions is iterable and has at least one suggestion
          if (Symbol.iterator in Object(suggestions) && suggestions.length > 0) {
            // Add each suggestion to the list
            for (const suggestion of suggestions) {
              const suggestionElement = document.createElement('li');
              suggestionElement.classList.add('suggestion');
              suggestionElement.textContent = suggestion;
              suggestionsList.appendChild(suggestionElement);
            }
          } else {
            // If no suggestions, display "No suggestions"
            const noSuggestionsElement = document.createElement('li');
            noSuggestionsElement.textContent = "No suggestions";
            suggestionsList.appendChild(noSuggestionsElement);
          }

          // Show the tooltip
          tooltip.classList.remove('hidden');
        } catch (err) {
          console.error("Error occurred while getting suggestions:", err);
        }
      }, 500);
    } else {
      // Hide the tooltip when the search input is empty
      tooltip.classList.add('hidden');
      // Clear the suggestions list when hiding the tooltip
      suggestionsList.innerHTML = '';
    }
  });

  // Hide the tooltip when the user clicks outside of it or the search input
  document.addEventListener('click', (event) => {
    if (!tooltip.contains(event.target) && !searchInput.contains(event.target)) {
      tooltip.classList.add('hidden');
      // Clear the suggestions list when hiding the tooltip
      suggestionsList.innerHTML = '';
    }
  });

  // Listen for suggestion results from the main process
  ipcRenderer.on('suggest-results', (event, resultsJSON) => {
    const results = JSON.parse(resultsJSON);

    // Clear the previous suggestions
    suggestionsList.innerHTML = '';

    // Check if results has at least one suggestion
    if (results.length > 0) {
      // Add each suggestion to the list
      for (const suggestion of results) {
        const suggestionElement = document.createElement('li');
        suggestionElement.classList.add('suggestion');
        suggestionElement.textContent = suggestion;
        suggestionsList.appendChild(suggestionElement);

        // Add click event listener to suggestion element
        suggestionElement.addEventListener('click', () => {
          // Set the value of the search input to the suggestion text
          searchInput.value = suggestion;
          tooltip.classList.add('hidden');
          // Clear the suggestions list when hiding the tooltip
          suggestionsList.innerHTML = '';
        });
      }
    } else {
      // If no suggestions, display "No suggestions"
      const noSuggestionsElement = document.createElement('li');
      noSuggestionsElement.textContent = "No suggestions";
      suggestionsList.appendChild(noSuggestionsElement);
    }

    // Show the tooltip
    tooltip.classList.remove('hidden');
  });

  // Suggestions error
  ipcRenderer.on('suggest-error', (event, error) => {
    if (error.includes("Cannot read property 'map' of null")) {
      return;
    }
    console.error("Error occurred while getting suggestions:", error);
  });
   
}
 
if (appListForm) {

  // App list form event listener
  appListForm.addEventListener("submit", (event) => {
      event.preventDefault(); // prevent form submission
      
      const appListAmountValue = appListAmount.value;
      const appCollectionListValue = appCollectionList.value;
      const appCategoryListValue = appCategoryList.value;
      const appAgeListValue = appAgeList.value;

      ipcRenderer.send("get-app-list", appListAmountValue, appCollectionListValue, appCategoryListValue, appAgeListValue);
  });
}

if (developerInput && developerForm) {
  // Developer form event listener
  developerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const developerName = developerInput.value.trim();
    if (developerName === '') {
      // Display an error tooltip when the input is empty
      ErrorTooltip.style.visibility = "visible";
    } else {
      // Hide the error tooltip when the input is not empty
      ErrorTooltip.style.visibility = "hidden";
      ipcRenderer.send('get-developer', developerName, 60);
    }
  });
}

if (reviewInput && reviewForm) {
  // Review form event listener
  reviewForm.addEventListener("submit", (event) => {
      event.preventDefault(); // prevent form submission

      const appId = reviewInput.value.trim();
      const reviewAmount = reviewAmountSelect.value;
      const reviewSort = reviewSortSelect.value;

      if (!appId) {
          // do nothing if input is empty
          return;
      }

      ipcRenderer.send("get-reviews", appId, reviewAmount, reviewSort);
  });
}

if (permissionInput && permissionForm) {
  // Permission form event listener
  permissionForm.addEventListener("submit", (event) => {
      event.preventDefault(); // prevent form submission

      const appId = permissionInput.value.trim();

      if (!appId) {
          // do nothing if input is empty
          return;
      }

      ipcRenderer.send("get-app-permissions", appId);
  });
}

if (dataSafetyInput && dataSafetyForm) {
  // Data safety form event listener
  dataSafetyForm.addEventListener("submit", (event) => {
      event.preventDefault(); // prevent form submission

      const appId = dataSafetyInput.value.trim();

      if (!appId) {
          // do nothing if input is empty
          return;
      }

      ipcRenderer.send("get-data-safety", appId);
  });
}

if (similarAppsInput && similarAppsForm) {
  // Similar apps form event listener
  similarAppsForm.addEventListener("submit", (event) => {
      event.preventDefault(); // prevent form submission

      const appId = similarAppsInput.value.trim();

      if (!appId) {
          // do nothing if input is empty 
          return;
      }

      ipcRenderer.send("get-similar-apps", appId);
  });
}

if (appDetailsInput && appDetailsForm) {
  // App details form event listener
  appDetailsForm.addEventListener("submit", (event) => {
      event.preventDefault(); // prevent form submission

      const appId = appDetailsInput.value.trim();

      if (!appId) {
          // do nothing if input is empty
          return;
      }

      ipcRenderer.send("get-app-details", appId);
  });
}

// Search results event listener
ipcRenderer.on("search-results", async (event, resultsData, term) => {
  console.log("Received search results for term:", term);

  let results;
  try {
      results = JSON.parse(resultsData);
  } catch (err) {
      console.error("Error parsing search results data:", err);
      return;
  }

  const fields = ["url", "appId", "summary", "title", "developer", "developerId", "icon", "score", "scoreText", "priceText", "free"];

  const csvData = generateCSVData(results, fields);

  // Download the CSV file with the search results
  downloadCSVFile(csvData, `${term}-search.csv`);
});

// App list results event listener  
ipcRenderer.on("app-list-results", async (event, appList, collectionName, categoryName, ageInput ) => {
  console.log("Received app list results");

  const fields = ["title", "appId", "url", "icon", "developer", "currency", "price", "free", "summary", "scoreText", "score"];

  const csvData = generateCSVData(appList, fields);

  // Download the CSV file with the app list
  downloadCSVFile(csvData, `app-list-${collectionName}-${categoryName}-${ageInput}.csv`);
});

// Developer results event listener
ipcRenderer.on("developer-results", async (event, developerApps, developerId) => {
  console.log("Received developer apps for developer:", developerId);

  const fields = ["url", "appId", "title", "summary", "developer", "developerId", "icon", "score", "scoreText", "priceText", "free"];

  const csvData = generateCSVData(developerApps, fields);

  // Download the CSV file with the developer apps
  downloadCSVFile(csvData, `${developerId}-developerApps.csv`);
});
 
// Review results event listener
ipcRenderer.on("reviews-results", async (event, paginatedReviews, appId) => {
  console.log("Received reviews for app:", appId);

  const fields = [ "id", "userName", "userImage", "score", "date", "score", "scoreText", "url", "text", "replyDate", "replyText", "version", "thumbsUp"];
  
  // if replyDate is null, N/A
    paginatedReviews.data.forEach((review) => {
      if (review.replyDate === null) {
        review.replyDate = "N/A";
      }

      if (review.replyText === null) {
        review.replyText = "N/A";
      }
    });

  const csvData = generateCSVData(paginatedReviews.data, fields);

  // Download the CSV file with the reviews
  downloadCSVFile(csvData, `${appId}-reviews.csv`);
}); 

// Permission results event listener
ipcRenderer.on("permission-results", async (event, permissions, appId) => {
  console.log("Received permissions for app:", appId);

  const fields = ["permission", "type"];

  const csvData = generateCSVData(permissions, fields);

  // Download the CSV file with the permissions
  downloadCSVFile(csvData, `${appId}-permissions.csv`);
});

// Data safety results event listener
ipcRenderer.on("data-safety-results", async (event, dataSafety, appId) => {
  console.log("Received data safety results for app:", appId)

  const fields = ["category", "data", "optional", "purpose", "type", "securityPractices", "privacyPolicyUrl"];

  const sharedDataFormatted = dataSafety.sharedData.map((item) => {
      return {
          category: "shared data",
          data: item.data,
          optional: item.optional,
          purpose: item.purpose,
          type: item.type,
          securityPractices: dataSafety.securityPractices.map((practice) => `${practice.practice} (${practice.description})`).join("; "),
          privacyPolicyUrl: dataSafety.privacyPolicyUrl
      }
  });

  const collectedDataFormatted = dataSafety.collectedData.map((item) => {
      return {
          category: "collected data",
          data: item.data,
          optional: item.optional,
          purpose: item.purpose,
          type: item.type,
          securityPractices: dataSafety.securityPractices.map((practice) => `${practice.practice} (${practice.description})`).join("; "),
          privacyPolicyUrl: dataSafety.privacyPolicyUrl
      }
  });

  const dataSafetyFormatted = sharedDataFormatted.concat(collectedDataFormatted);

  const csvData = generateCSVData(dataSafetyFormatted, fields);

  // Download the CSV file with the data safety
  downloadCSVFile(csvData, `${appId}-dataSafety.csv`);
});

// Similar apps results event listener
ipcRenderer.on("similar-apps-results", async (event, similarApps, appId) => {
  console.log("Received similar apps for app:", appId);

  const fields = ["url", "appId", "summary", "developer", "developerId", "icon", "score", "scoreText", "priceText", "free"];

  const csvData = generateCSVData(similarApps, fields);

  // Download the CSV file with the similar apps
  downloadCSVFile(csvData, `${appId}-similarApps.csv`);
});

// App details results event listener
ipcRenderer.on("app-details-results", async (event, appDetails, appId) => {
  console.log("Received app details for app:", appId);

  // get all fields
  const fields = ["title", "description", "descriptionHTML", "summary", "installs", "minInstalls", "maxInstalls", "score", "scoreText", "ratings", "reviews", "price", "free", "currency", "priceText", "available", "offersIAP", "IAPRange", "androidVersion", "androidVersionText", "developer", "developerId", "developerEmail", "developerWebsite", "developerAddress", "privacyPolicy", "developerInternalID", "genre", "genreId", "icon", "headerImage", "screenshots", "contentRating", "contentRatingDescription", "adSupported", "released", "updated", "version", "recentChanges", "appId", "url"];

  // concatenate screenshot URLs with ;
  // check if screenshots property exists
  // concatenate screenshot urls with ;
  if (Array.isArray(appDetails.screenshots)) {
      const screenshots = appDetails.screenshots.join(",");
      appDetails.screenshots = screenshots;
  }

  const csvData = generateCSVData([appDetails], fields);

  // Download the CSV file with the app details
  downloadCSVFile(csvData, `${appId}-appDetails.csv`);
});

// Search error event listener
ipcRenderer.on("search-error", (event, err) => {
  ErrorTooltip.style.visibility = "visible";
});

// Review error
ipcRenderer.on("reviews-error", (event, err) => {
  ErrorTooltip.style.visibility = "visible";
});

// Permission error
ipcRenderer.on("permission-error", (event, err) => {
  ErrorTooltip.style.visibility = "visible";
});

// Data safety error
ipcRenderer.on("data-safety-error", (event, err) => {
  // Display an error tooltip when the app is not found or data safety information is not available
  ErrorTooltip.style.visibility = "visible";
});

// Similar apps error
ipcRenderer.on("similar-apps-error", (event, err) => {
  if (err instanceof Error && err.message.includes("App not found (404)")) {
    // Display an error tooltip when the app is not found
    ErrorTooltip.style.visibility = "visible";
  }
});

// App details error
ipcRenderer.on("app-details-error", (event, err) => {
  if (err instanceof Error && err.message.includes("App not found (404)")) {
    // Display an error tooltip when the app is not found
    ErrorTooltip.style.visibility = "visible";
  }
});

// App list error
ipcRenderer.on("app-list-error", (event, err) => {
  console.error("Error occurred while getting app list:", err);
  // Show error message to user
});

// Developer error 
ipcRenderer.on("developer-error", (event, err) => {
  ErrorTooltip.style.visibility = "visible"; 
});