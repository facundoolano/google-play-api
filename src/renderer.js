const { ipcRenderer } = require("electron");

const searchForm = document.getElementById("search-form");

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput.value.trim();

  ipcRenderer.send('search', searchTerm);
});

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
    let csvData = "";

    // Loop through each search result and add it to the CSV data string
    csvData += fields.join(",") + "\n";
    for (const resultId in results) {
      const result = results[resultId];
      const row = [];
      fields.forEach((field) => {
        if (field === "developer") {
          row.push(`"${result["developer"].replace(/"/g, '""')}"`);
        } else if (field === "title") {
          row.push(`"${result["title"].replace(/"/g, '""')}"`);
        } 
        else if (field === "free") {
          row.push(result[field] ? "true" : "false");
        } else if (field === "summary") {
          row.push(`"${result[field].replace(/"/g, '""')}"`);
        } else {
          row.push(result[field] || "N/A");
        }
      });
      csvData += row.join(",") + "\n";
    }

    // Create a temporary link to download the CSV file
    const link = document.createElement("a");
    link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvData));
    // save to csvs folder
    link.setAttribute("download", `${term}.csv`);


    // Append the link to the document body and click it to download the CSV file
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Error occurred while processing search results:", err);
    // Show error message to user
  }
});


ipcRenderer.on('search-error', (event, err) => {
  console.error("Error occurred during search:", err);
  // Show error message to user
});