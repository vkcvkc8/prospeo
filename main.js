import Papa from 'papaparse';

// Integrated API key
const PROSPEO_API_KEY = 'e89cd25c23ea559352eb96d0bc2c4c68';

let isProcessing = false;
let shouldStop = false;
let searchResults = [];
let totalSearches = 0;
let contactsFound = 0;

async function fetchEmail(firstName, lastName, company) {
  if (!company) {
    logMessage("❌ Error: Company field is required", "error");
    return null;
  }

  // Use a CORS proxy service to handle the API call
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  const targetUrl = 'https://api.prospeo.io/email-finder';
  const url = proxyUrl + targetUrl;
  
  const data = {
    first_name: firstName || '',
    last_name: lastName || '',
    company: company
  };

  try {
    logMessage(`🔍 Searching for: ${firstName} ${lastName} @ ${company}`, "info");
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': PROSPEO_API_KEY,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logMessage(`❌ HTTP error ${response.status}: ${errorText}`, "error");
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    logMessage(`✅ API request successful for ${firstName} ${lastName}`, "success");
    return JSON.stringify(result);
  } catch (error) {
    logMessage(`❌ Fetch error: ${error.message}`, "error");
    
    // If CORS proxy fails, try alternative approach
    if (error.message.includes('cors') || error.message.includes('CORS')) {
      logMessage("🔄 Trying alternative API approach...", "info");
      return await tryAlternativeAPI(firstName, lastName, company);
    }
    
    return null;
  }
}

// Alternative API approach using a different method
async function tryAlternativeAPI(firstName, lastName, company) {
  try {
    // Try direct API call with different headers
    const response = await fetch('https://api.prospeo.io/email-finder', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': PROSPEO_API_KEY,
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify({
        first_name: firstName || '',
        last_name: lastName || '',
        company: company
      })
    });

    if (response.ok) {
      const result = await response.json();
      logMessage(`✅ Alternative API successful`, "success");
      return JSON.stringify(result);
    } else {
      logMessage(`❌ Alternative API failed: ${response.status}`, "error");
      return null;
    }
  } catch (error) {
    logMessage(`❌ Alternative API error: ${error.message}`, "error");
    return null;
  }
}

function logMessage(message, type = "info") {
  const log = document.getElementById('log');
  const timestamp = new Date().toLocaleTimeString();
  const className = type === "error" ? "error" : type === "success" ? "success" : "info";
  log.innerHTML += `<span class="${className}">[${timestamp}] ${message}</span><br>`;
  log.scrollTop = log.scrollHeight;
}

function updateStats() {
  document.getElementById('totalSearches').textContent = totalSearches;
  document.getElementById('contactsFound').textContent = contactsFound;
  const successRate = totalSearches > 0 ? Math.round((contactsFound / totalSearches) * 100) : 0;
  document.getElementById('successRate').textContent = successRate + '%';
}

function addResultToTable(firstName, lastName, company, email, status, index) {
  const tbody = document.getElementById('resultsTableBody');
  
  // Remove empty state if it exists
  if (tbody.children.length === 1 && tbody.children[0].children.length === 1) {
    tbody.innerHTML = '';
  }

  const row = document.createElement('tr');
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'N/A';
  const emailDisplay = email || 'Not found';
  const emailClass = email ? 'email-found' : 'email-not-found';
  
  row.innerHTML = `
    <td>${index}</td>
    <td>${fullName}</td>
    <td>${company}</td>
    <td class="${emailClass}">${emailDisplay}</td>
    <td>${status}</td>
    <td>
      <button class="btn-secondary" onclick="selectResult(${index - 1})" style="padding: 5px 10px; font-size: 12px;">
        Select
      </button>
    </td>
  `;
  
  tbody.appendChild(row);
}

function selectResult(index) {
  const result = searchResults[index];
  if (result) {
    logMessage(`📋 Selected: ${result.firstName} ${result.lastName} - ${result.email || 'No email'}`, "info");
  }
}

async function searchSingle() {
  if (isProcessing) return;
  
  const firstName = document.getElementById('firstNameInput').value.trim();
  const lastName = document.getElementById('lastNameInput').value.trim();
  const company = document.getElementById('companyInput').value.trim();
  
  if (!company) {
    logMessage("❌ Please enter a company domain", "error");
    return;
  }

  setButtonLoading('searchSingleBtn', 'searchSingleText', true, 'Searching...');
  document.getElementById('searchStatus').textContent = 'Searching...';
  
  const response = await fetchEmail(firstName, lastName, company);
  let email = '';
  let status = 'NO_RESULT';
  
  if (response) {
    try {
      const jsonResponse = JSON.parse(response);
      email = jsonResponse.response?.email || '';
      status = jsonResponse.response?.email_status || 'NO_RESULT';
      
      if (email) {
        logMessage(`🎉 Found email: ${email}`, "success");
        contactsFound++;
      } else {
        logMessage(`❌ No email found for ${firstName} ${lastName}`, "error");
      }
    } catch (e) {
      logMessage(`❌ Error parsing response`, "error");
    }
  }
  
  totalSearches++;
  const result = { firstName, lastName, company, email, status };
  searchResults.push(result);
  
  addResultToTable(firstName, lastName, company, email, status, totalSearches);
  updateStats();
  
  document.getElementById('exportBtn').disabled = false;
  document.getElementById('searchStatus').textContent = 'Search completed';
  setButtonLoading('searchSingleBtn', 'searchSingleText', false, '🔍 Search Single');
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  logMessage(`📁 Processing file: ${file.name}`, "info");
  processCSV(file);
}

async function processCSV(file) {
  if (isProcessing) return;
  
  isProcessing = true;
  shouldStop = false;
  setButtonLoading('bulkSearchBtn', 'bulkSearchText', true, 'Processing...');
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('searchStatus').textContent = 'Processing CSV...';
  
  Papa.parse(file, {
    header: true,
    complete: async function(results) {
      const validRows = results.data.filter(row => row.company && row.company.trim());
      logMessage(`📊 Found ${validRows.length} valid rows to process`, "info");
      logMessage(`⏱️ Estimated time: ${Math.ceil(validRows.length * 1.5 / 60)} minutes`, "info");
      
      let processed = 0;
      
      for (const row of validRows) {
        if (shouldStop) {
          logMessage("⏹️ Processing stopped by user", "info");
          break;
        }
        
        const { first_name, last_name, company } = row;
        processed++;
        
        logMessage(`[${processed}/${validRows.length}] Processing: ${first_name || 'N/A'} ${last_name || 'N/A'} @ ${company}`, "info");
        
        const response = await fetchEmail(first_name, last_name, company);
        let email = '';
        let status = 'NO_RESULT';
        
        if (response) {
          try {
            const jsonResponse = JSON.parse(response);
            email = jsonResponse.response?.email || '';
            status = jsonResponse.response?.email_status || 'NO_RESULT';
            
            if (email) {
              logMessage(`✅ Found: ${email}`, "success");
              contactsFound++;
            } else {
              logMessage(`❌ No email found`, "error");
            }
          } catch (e) {
            logMessage(`❌ Error parsing response`, "error");
          }
        }
        
        totalSearches++;
        const result = { 
          firstName: first_name, 
          lastName: last_name, 
          company, 
          email, 
          status,
          ...row 
        };
        searchResults.push(result);
        
        addResultToTable(first_name, last_name, company, email, status, totalSearches);
        updateStats();
        
        // Rate limiting - wait 1.5 seconds between requests
        if (processed < validRows.length && !shouldStop) {
          logMessage(`⏳ Waiting 1.5s for rate limiting...`, "info");
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      if (searchResults.length > 0) {
        document.getElementById('exportBtn').disabled = false;
        logMessage(`🎉 Processing complete! Found ${contactsFound} emails from ${totalSearches} searches`, "success");
      }
      
      isProcessing = false;
      shouldStop = false;
      document.getElementById('stopBtn').disabled = true;
      document.getElementById('searchStatus').textContent = 'Processing completed';
      setButtonLoading('bulkSearchBtn', 'bulkSearchText', false, '📁 Search Bulk');
    },
    error: function(error) {
      logMessage(`❌ CSV parsing error: ${error.message}`, "error");
      isProcessing = false;
      setButtonLoading('bulkSearchBtn', 'bulkSearchText', false, '📁 Search Bulk');
    }
  });
}

function stopProcessing() {
  shouldStop = true;
  logMessage("⏹️ Stopping processing...", "info");
}

function exportResults() {
  if (searchResults.length === 0) {
    logMessage("❌ No results to export", "error");
    return;
  }
  
  try {
    const exportData = searchResults.map(result => ({
      first_name: result.firstName || '',
      last_name: result.lastName || '',
      company: result.company || '',
      email: result.email || '',
      email_status: result.status || 'NO_RESULT'
    }));
    
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospeo_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    logMessage("📥 Results exported successfully!", "success");
  } catch (error) {
    logMessage(`❌ Export error: ${error.message}`, "error");
  }
}

function clearAll() {
  if (confirm('Are you sure you want to clear all results?')) {
    searchResults = [];
    totalSearches = 0;
    contactsFound = 0;
    
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <h4>No search results yet</h4>
          <p>Use single search or upload a CSV file to get started</p>
        </td>
      </tr>
    `;
    
    updateStats();
    document.getElementById('exportBtn').disabled = true;
    document.getElementById('searchStatus').textContent = 'Ready to search';
    
    // Clear input fields
    document.getElementById('firstNameInput').value = '';
    document.getElementById('lastNameInput').value = '';
    document.getElementById('companyInput').value = '';
    
    logMessage("🧹 All results cleared", "info");
  }
}

function setButtonLoading(btnId, textId, loading, text) {
  const btn = document.getElementById(btnId);
  const textEl = document.getElementById(textId);
  
  btn.disabled = loading;
  if (loading) {
    textEl.innerHTML = `<span class="loading"></span> ${text}`;
  } else {
    textEl.textContent = text;
  }
}

// Auto-focus on first name input
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('firstNameInput').focus();
});

// Make functions globally available
window.searchSingle = searchSingle;
window.handleFileUpload = handleFileUpload;
window.stopProcessing = stopProcessing;
window.exportResults = exportResults;
window.clearAll = clearAll;
window.selectResult = selectResult;