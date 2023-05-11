const { ipcRenderer } = require("electron");

const search = {
  input: document.getElementById("search-input"),
  form: document.getElementById("search-form"),
  tooltip: document.getElementById('search-tooltip'),
  suggestionsList: document.getElementById('suggestions-list')
};

const reviews = {
  input: document.getElementById("review-input"),
  form: document.getElementById("review-form"), 
  sortSelect: document.getElementById("review-sort")
};

const developer = {
  input: document.getElementById("developer-input"),
  form: document.getElementById("developer-form"),
  errorTooltip: document.getElementById('error-tooltip')
};

const permission = {
  input: document.getElementById("permission-input"),
  form: document.getElementById("permission-form")
};

const dataSafety = {
  input: document.getElementById("data-safety-input"),
  form: document.getElementById("data-safety-form")
};

const similarApps = {
  input: document.getElementById("similar-apps-input"),
  form: document.getElementById("similar-apps-form")
};

const appList = {
  form: document.getElementById("app-list-form"), 
  collectionList: document.getElementById("app-list-collection"),
  categoryList: document.getElementById("app-list-category"),
  ageList: document.getElementById("app-list-age")
};

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

// Function to show buffer animation
function showBufferAnimation() {
  const bufferDiv = document.createElement("div");
  bufferDiv.classList.add("buffer-div");
  const bufferAnimation = document.createElement("div");
  bufferAnimation.classList.add("buffer-animation");
  bufferDiv.appendChild(bufferAnimation);
  document.body.appendChild(bufferDiv);
  return bufferDiv;
}

if (search.input && search.form) {
  let suggestTimeout;

  // Search form event listener
  search.form.addEventListener("submit", (event) => { // time complexity: O(1)
    event.preventDefault(); 

    // Clear the previous suggestions
    search.suggestionsList.innerHTML = '';

    // Show buffer animation while search results are being fetched
    const bufferDiv = showBufferAnimation();

    ipcRenderer.send("search", search.input.value.trim());

    // Remove the buffer animation div from the DOM once search results are fetched
    ipcRenderer.once("search-results", () => {
      document.body.removeChild(bufferDiv);
    });
  });

  // Search input event listeners
  search.input.addEventListener("input", async () => { // time complexity: O(1) 

    // Only show the tooltip if the search term is not empty
    if (search.input.value.trim() !== '') {
      // Check if there is a pending suggest request
      if (suggestTimeout) {
        clearTimeout(suggestTimeout);
      }

      // Set a timer to aggregate similar search requests
      suggestTimeout = setTimeout(async () => {
        try {
          // Get the suggestions from the main process
          const suggestions = await ipcRenderer.send('suggest', search.input.value.trim());

          // Clear the previous suggestions
          search.suggestionsList.innerHTML = '';

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
            search.suggestionsList.appendChild(noSuggestionsElement);
          }

          // Show the tooltip
          search.tooltip.classList.remove('hidden');
        } catch (err) {
          console.error("Error occurred while getting suggestions:", err);
        }
      }, 500);
    } else {
      // Hide the tooltip when the search input is empty
      search.tooltip.classList.add('hidden');
      // Clear the suggestions list when hiding the tooltip
      search.suggestionsList.innerHTML = '';
    }
  });

  // Hide the tooltip when the user clicks outside of it or the search input
  document.addEventListener('click', (event) => {
    if (!search.tooltip.contains(event.target) && !search.input.contains(event.target)) {
      search.tooltip.classList.add('hidden');
      // Clear the suggestions list when hiding the tooltip
      search.suggestionsList.innerHTML = '';
    }
  });

  // Listen for suggestion results from the main process
  ipcRenderer.on('suggest-results', (event, resultsJSON) => {
    const results = JSON.parse(resultsJSON);

    // Clear the previous suggestions
    search.suggestionsList.innerHTML = '';

    // Check if results has at least one suggestion
    if (results.length > 0) {
      // Add each suggestion to the list
      for (const suggestion of results) {
        const suggestionElement = document.createElement('li');
        suggestionElement.classList.add('suggestion');
        suggestionElement.textContent = suggestion;
        search.suggestionsList.appendChild(suggestionElement);

        // Add click event listener to suggestion element
        suggestionElement.addEventListener('click', () => {
          // Set the value of the search input to the suggestion text
          search.input.value = suggestion;
          search.tooltip.classList.add('hidden');
          // Clear the suggestions list when hiding the tooltip
          search.suggestionsList.innerHTML = '';
        });
      }
    } else {
      // If no suggestions, display "No suggestions"
      const noSuggestionsElement = document.createElement('li');
      noSuggestionsElement.textContent = "No suggestions";
      search.suggestionsList.appendChild(noSuggestionsElement);
    }

    // Show the tooltip
    search.tooltip.classList.remove('hidden');
  });
}
 
if (appList.form) { 
  // App list form event listener
  appList.form.addEventListener("submit", (event) => {
      event.preventDefault(); // prevent form submission 

      // Show buffer animation while app list is being fetched
      const bufferDiv = showBufferAnimation();

      ipcRenderer.send("get-app-list",  appList.collectionList.value, appList.categoryList.value, appList.ageList.value);
      
      // Remove the buffer animation div from the DOM once app list is fetched
      ipcRenderer.once("app-list-results", () => {
        document.body.removeChild(bufferDiv);
      });
  });
}

if (developer.input && developer.form) {
  // Developer form event listener
  developer.form.addEventListener("submit", (event) => {
    event.preventDefault(); 
    if (developer.input.value.trim() === '') {
      // Display an error tooltip when the input is empty
      developer.errorTooltip.style.visibility = "visible";
    } else {
      // Hide the error tooltip when the input is not empty
      developer.errorTooltip.style.visibility = "hidden";

      // Show buffer animation while developer apps are being fetched
      const bufferDiv = showBufferAnimation();
      ipcRenderer.send('get-developer', developer.input.value.trim());

      // Remove the buffer animation div from the DOM once developer apps are fetched
      ipcRenderer.once("developer-results", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });

      // Remove the buffer animation div from the DOM if an error occurs
      ipcRenderer.once("app-error", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });
    }
  });
}

// Developer results event listener 
ipcRenderer.on("developer-results", async (event, developerApps, developerId) => {
  console.log("Received developer apps for developer:", developerId); 

  // Download the CSV file with the developer apps
  downloadCSVFile(generateCSVData(developerApps, ["url", "appId", "title", "summary", "developer", "developerId", "icon", "score", "scoreText", "priceText", "free"]), `${developerId}-developerApps.csv`);
});  

if (reviews.input && reviews.form) {
  // Developer form event listener
  reviews.form.addEventListener("submit", (event) => {
    event.preventDefault(); 
    if (reviews.input.value.trim() === '') {
      // Display an error tooltip when the input is empty
      developer.errorTooltip.style.visibility = "visible";
    } else {
      // Hide the error tooltip when the input is not empty
      developer.errorTooltip.style.visibility = "hidden";

      // Show buffer animation while developer apps are being fetched
      const bufferDiv = showBufferAnimation();
      ipcRenderer.send('get-reviews', reviews.input.value.trim());

      // Remove the buffer animation div from the DOM once developer apps are fetched
      ipcRenderer.once("reviews-results", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });

      // Remove the buffer animation div from the DOM if an error occurs
      ipcRenderer.once("app-error", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });
    }
  });
}

    // Remove the buffer animation div from the DOM once reviews are fetched
    ipcRenderer.once("reviews-results", (event, reviewsData, appId) => {
      console.log("Received reviews for app:", appId);

      if (reviewsData.length === 0) {
        // Remove buffer div from DOM if no reviews are returned
        document.body.removeChild(bufferDiv);
        return;
      }

      reviewsData.forEach((review) => {
        if (review.replyDate === null) {
          review.replyDate = "N/A";
        }

        if (review.replyText === null) {
          review.replyText = "N/A";
        }

        if (review.version === null) {
          review.version = "N/A";
        }
      }); 

      // Download the CSV file with the reviews
      downloadCSVFile(generateCSVData(reviewsData, ["id", "userName", "userImage", "score", "scoreText", "date", "url", "text", "replyDate", "replyText", "version", "thumbsUp"]), `${appId}-reviews.csv`);
    }); 

if (permission.input && permission.form) {
  // Developer form event listener
  permission.form.addEventListener("submit", (event) => {
    event.preventDefault(); 
    if (permission.input.value.trim() === '') {
      // Display an error tooltip when the input is empty
      developer.errorTooltip.style.visibility = "visible";
    } else {
      // Hide the error tooltip when the input is not empty
      developer.errorTooltip.style.visibility = "hidden";

      // Show buffer animation while developer apps are being fetched
      const bufferDiv = showBufferAnimation();
      ipcRenderer.send('get-app-permissions', permission.input.value.trim());

      // Remove the buffer animation div from the DOM once developer apps are fetched
      ipcRenderer.once("permission-results", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });

      // Remove the buffer animation div from the DOM if an error occurs
      ipcRenderer.once("app-error", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });
    }
  });
}

// Permission results event listener
ipcRenderer.on("permission-results", async (event, permissions, appId) => {
  console.log("Received permissions for app:", appId); 

  // Download the CSV file with the permissions
  downloadCSVFile(generateCSVData(permissions, ["permission", "type"]), `${appId}-permissions.csv`);
});

ipcRenderer.on("permission-error", (event, errorMessage) => {
  console.error(errorMessage);

  // Show error message in tooltip
  developer.errorTooltip.innerText = errorMessage;
  developer.errorTooltip.style.visibility = "visible";

  // Remove the buffer animation div from the DOM
  const bufferDiv = document.getElementById("buffer-div");
  if (bufferDiv) {
    document.body.removeChild(bufferDiv);
  }
});

if (dataSafety.input && dataSafety.form) {
  // Developer form event listener
  dataSafety.form.addEventListener("submit", (event) => {
    event.preventDefault(); 
    if (dataSafety.input.value.trim() === '') {
      // Display an error tooltip when the input is empty
      developer.errorTooltip.style.visibility = "visible";
    } else {
      // Hide the error tooltip when the input is not empty
      developer.errorTooltip.style.visibility = "hidden";

      // Show buffer animation while developer apps are being fetched
      const bufferDiv = showBufferAnimation();
      ipcRenderer.send('get-data-safety', dataSafety.input.value.trim());

      // Remove the buffer animation div from the DOM once developer apps are fetched
      ipcRenderer.once("data-safety-results", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });

      // Remove the buffer animation div from the DOM if an error occurs
      ipcRenderer.once("app-error", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });
    }
  });
}  

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

if (similarApps.input && similarApps.form) {
  // Developer form event listener
  similarApps.form.addEventListener("submit", (event) => {
    event.preventDefault(); 
    if (similarApps.input.value.trim() === '') {
      // Display an error tooltip when the input is empty
      developer.errorTooltip.style.visibility = "visible";
    } else {
      // Hide the error tooltip when the input is not empty
      developer.errorTooltip.style.visibility = "hidden";

      // Show buffer animation while developer apps are being fetched
      const bufferDiv = showBufferAnimation();
      ipcRenderer.send('get-similar-apps', similarApps.input.value.trim());

      // Remove the buffer animation div from the DOM once developer apps are fetched
      ipcRenderer.once("similar-apps-results", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });

      // Remove the buffer animation div from the DOM if an error occurs
      ipcRenderer.once("app-error", () => {
        if (bufferDiv && bufferDiv.parentNode) {
          bufferDiv.parentNode.removeChild(bufferDiv);
        }
      });
    }
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

  // If no search results, return without doing anything else
  if (results.length === 0) {
    return;
  }

  // Download the CSV file with the search results
  downloadCSVFile(generateCSVData(results, ["url", "appId", "summary", "title", "developer", "developerId", "icon", "score", "scoreText", "priceText", "free"]), `${term}-search.csv`);
});

// App list results event listener  
ipcRenderer.on("app-list-results", async (event, appList, collectionName, categoryName, ageInput ) => {
  console.log("Received app list results");  

  // Download the CSV file with the app list
  downloadCSVFile(generateCSVData(appList, ["title", "appId", "url", "icon", "developer", "currency", "price", "free", "summary", "scoreText", "score"]), `app-list-${collectionName}-${categoryName}-${ageInput}.csv`);
});  

// Similar apps results event listener
ipcRenderer.on("similar-apps-results", async (event, similarApps, appId) => {
  console.log("Received similar apps for app:", appId);

  const fields = ["url", "appId", "summary", "developer", "developerId", "icon", "score", "scoreText", "priceText", "free"];

  const csvData = generateCSVData(similarApps, fields);

  // Download the CSV file with the similar apps
  downloadCSVFile(csvData, `${appId}-similarApps.csv`);
});

// apps error
ipcRenderer.on("app-error", (event, errorMessage) => {
  console.error(errorMessage);

  // Show error message in tooltip
  developer.errorTooltip.innerText = errorMessage;
 
  if (errorMessage === "Cannot read property 'map' of null") {
    developer.errorTooltip.innerText = "No apps found";
  }

  developer.errorTooltip.style.visibility = "visible";

  // Remove the buffer animation div from the DOM
  const bufferDiv = document.getElementById("buffer-div");
  if (bufferDiv) {
    document.body.removeChild(bufferDiv);
  }
});  