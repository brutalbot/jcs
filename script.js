let submittedData = JSON.parse(localStorage.getItem("solarData")) || [];
const dataTable = document.getElementById("dataTable");
const noDataMessage = document.getElementById("no-data-message");
const tabButtons = document.querySelectorAll(".tab-btn");
const pages = document.querySelectorAll(".page");
const webhookURL = "https://discord.com/api/webhooks/1359407375966142535/nv11hI0P52b3pEyptBqRNDf37XBAM-03eDpF37Txbjuex4Wqn_PqS4R4I82ZoaY1a320";

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  // Setup tab navigation
  tabButtons.forEach(button => {
    button.addEventListener("click", () => switchPage(button.dataset.page));
  });

  // Load data and update UI
  updateTable();

  // Form submission handler with Discord webhook
  document.getElementById("solarForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    

    submittedData.push(data);
    saveToLocalStorage();
    const jsonData = JSON.stringify(data, null, 2);
    
    try {
      await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "```json\n" + jsonData + "\n```" })
      });
    } catch (error) {
      console.error("Error sending to Discord:", error);
      alert("Failed to send data to Discord.");
    }
    
    updateTable();
    alert("Data submitted successfully!");
    this.reset();
    
    // Switch to view page
    switchPage("view");
  });

  // File import handler
  document.getElementById("importJson").addEventListener("change", handleFileImport);
});

// Switch between pages
function switchPage(pageId) {
  // Update active tab button
  tabButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  // Show selected page, hide others
  pages.forEach(page => {
    page.classList.toggle("active", page.id === pageId + "-page");
  });
}

// Save data to local storage
function saveToLocalStorage() {
  localStorage.setItem("solarData", JSON.stringify(submittedData));
}

// Update data table
function updateTable() {
  if (submittedData.length === 0) {
    dataTable.style.display = "none";
    noDataMessage.style.display = "block";
    return;
  }
  
  dataTable.style.display = "table";
  noDataMessage.style.display = "none";
  
  const headers = Object.keys(submittedData[0]);
  const thead = dataTable.querySelector("thead");
  const tbody = dataTable.querySelector("tbody");
  
  // Create table header
  thead.innerHTML = `
    <tr>
      ${headers.map(header => `<th>${formatHeader(header)}</th>`).join("")}
    </tr>
  `;
  
  // Create table rows
  tbody.innerHTML = submittedData.map(row => `
    <tr>
      ${headers.map(header => `<td>${row[header] || ""}</td>`).join("")}
    </tr>
  `).join("");
}

// Format header text (capitalize, add spaces)
function formatHeader(text) {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Export data as Excel (CSV)
function downloadExcel() {
  if (submittedData.length === 0) {
    alert("No data available to download");
    return;
  }
  
  const headers = Object.keys(submittedData[0]);
  let csv = headers.join(",") + "\n";
  
  submittedData.forEach(row => {
    csv += headers.map(h => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(",") + "\n";
  });
  
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `solar_data_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// Export data as JSON
function exportJSON() {
  if (submittedData.length === 0) {
    alert("No data available to export");
    return;
  }
  
  const blob = new Blob([JSON.stringify(submittedData, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `solar_data_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

// Print data table
function printTable() {
  if (submittedData.length === 0) {
    alert("No data available to print");
    return;
  }
  
  const headers = Object.keys(submittedData[0]);
  
  let html = `
    <html>
    <head>
      <title>Jivika Solar Data - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #4f46e5; text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h1>Jivika Solar Insights Data</h1>
      <p>Report generated: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${formatHeader(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${submittedData.map(row => `
            <tr>${headers.map(h => `<td>${row[h] || ""}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

// Import JSON file
function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      
      if (Array.isArray(imported)) {
        submittedData = imported;
        saveToLocalStorage();
        updateTable();
        alert("Data imported successfully!");
      } else {
        alert("Invalid JSON structure. Please use a valid export file.");
      }
    } catch (err) {
      alert("Error importing file: " + err.message);
    }
  };
  
  reader.readAsText(file);
  event.target.value = ""; // Reset file input
}

// Clear all data
function clearData() {
  if (confirm("Are you sure you want to delete all data? This action cannot be undone.")) {
    submittedData = [];
    saveToLocalStorage();
    updateTable();
    alert("All data has been cleared.");
  }
}