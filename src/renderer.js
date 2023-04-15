const { ipcRenderer } = require("electron");

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const reviewForm = document.getElementById("review-form");
const reviewInput = document.getElementById("review-input");

// Function to generate CSV data from an array of objects
function generateCSVData(objects, fields) {
  let csvData = "";

  // Loop through each object and add it to the CSV data string
  csvData += fields.join(",") + "\n";
  for (const obj of objects) {
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
  }

  return csvData;
}

// Function to download a CSV file with the given data and filename
function downloadCSVFile(csvData, filename) {
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

// Search form event listener
searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const term = searchInput.value.trim();

  ipcRenderer.send('search', term);
});

// Review form event listener
reviewForm.addEventListener('submit', (event) => {
  event.preventDefault(); // prevent form submission

  const appId = reviewInput.value.trim();

  if (!appId) {
    // do nothing if input is empty
    return;
  }

  ipcRenderer.send('get-reviews', appId);
});

// Search results event listener
ipcRenderer.on('search-results', async (event, resultsData, term) => {
  console.log("Received search results for term:", term);

  try {
    let results;
    try {
      results = JSON.parse(resultsData);
    } catch (err) {
      console.error("Error parsing search results data:", err);
      return;
    }

    const fields = ["title", "appId", "url", "icon", "developer", "currency", "free", "summary", "scoreText", "score"];
    const csvData = generateCSVData(results, fields);

    // Download the CSV file with the search results
    downloadCSVFile(csvData, `${term}.csv`);
  } catch (err) {
    console.error("Error occurred while processing search results:", err);
    // Show error message to user
  }
});

// Review results event listener
ipcRenderer.on('review-results', async (event, paginatedReviews, appId) => {
  console.log("Received reviews for app:", appId);

  try {
    const fields = ["userName", "userImage", "score", "date", "text"];
    const csvData = generateCSVData(paginatedReviews.data, fields);

    // Download the CSV file with the reviews
    downloadCSVFile(csvData, `${appId}.csv`);
  } catch (err) {
    console.error("Error occurred while processing reviews:", err);
    // Show error message to user
  }
});

// Search error event listener
ipcRenderer.on('search-error', (event, err) => {
  console.error("Error occurred during search:", err);
  // Show error message to user
});

// Review error
ipcRenderer.on('review-error', (event, err) => {
  console.error("Error occurred while getting reviews:", err);
  // Show error message to user
});