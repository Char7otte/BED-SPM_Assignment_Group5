document.addEventListener('DOMContentLoaded', function() {
  // Skip authentication for testing - use hardcoded user ID
  const TEST_USER_ID = 8; // Change this to match a user ID in your database
  
  try {
    // Initialize current week display
    updateCurrentWeek();
    
    // Load weekly medications
    loadWeeklyMedications(TEST_USER_ID);
    
    // Setup event listeners
    setupEventListeners(TEST_USER_ID);
    
  } catch (error) {
    console.error('Initialization error:', error);
    showAlert('Failed to initialize application. Please refresh the page.', 'danger');
  }
});

function showAlert(message, type = 'success') {
  // Create alert container if it doesn't exist
  let alertContainer = document.getElementById('alert-container');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alert-container';
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '20px';
    alertContainer.style.right = '20px';
    alertContainer.style.zIndex = '9999';
    document.body.appendChild(alertContainer);
  }
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible`;
  alert.style.marginBottom = '10px';
  alert.innerHTML = `
    <button type="button" class="close" onclick="this.parentElement.remove()">
      <span>&times;</span>
    </button>
    ${message}
  `;
  alertContainer.appendChild(alert);
  
  setTimeout(() => {
    if (alert.parentElement) {
      alert.remove();
    }
  }, 5000);
}

let currentWeekStart = null;
let currentWeekEnd = null;

function updateCurrentWeek() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  currentWeekStart = monday;
  currentWeekEnd = sunday;
  
  const options = { month: 'short', day: 'numeric' };
  const weekText = `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;
  document.getElementById('current-week').textContent = weekText;
}

async function loadWeeklyMedications(userId, startDate = null, endDate = null) {
  try {
    // Show loading state
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
      loadingMessage.style.display = 'block';
      loadingMessage.innerHTML = '<div class="alert alert-info"><i class="fa fa-spinner fa-spin"></i> Loading medications...</div>';
    }
    
    let url = `/medications/user/${userId}/weekly`;
    
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    
    // Remove authorization header for testing
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // No medications found - display empty state
        displayWeeklyMedications([]);
        updateWeeklySummary([]);
        if (loadingMessage) {
          loadingMessage.style.display = 'none';
        }
        return;
      }
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const medications = await response.json();
    displayWeeklyMedications(medications);
    updateWeeklySummary(medications);
    
    // Hide loading message
    if (loadingMessage) {
      loadingMessage.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error loading weekly medications:', error);
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
      loadingMessage.innerHTML = `
        <div class="alert alert-danger">
          <i class="fa fa-exclamation-triangle"></i>
          Error loading medications: ${error.message}
          <br><button class="btn btn-sm btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
    showAlert(error.message, 'danger');
  }
}

function displayWeeklyMedications(medications) {
  const calendar = document.getElementById('weekly-calendar');
  const loadingMessage = document.getElementById('loading-message');
  const noMedsMessage = document.getElementById('no-medications-message');
  const errorMessage = document.getElementById('error-message');
  
  // Hide all status messages
  if (loadingMessage) loadingMessage.style.display = 'none';
  if (noMedsMessage) noMedsMessage.style.display = 'none';
  if (errorMessage) errorMessage.style.display = 'none';
  
  if (!medications || medications.length === 0) {
    if (noMedsMessage) noMedsMessage.style.display = 'block';
    calendar.innerHTML = '';
    return;
  }
  
  // Group medications by day
  const medicationsByDay = groupMedicationsByDay(medications);
  
  // Create weekly calendar structure
  let calendarHTML = '<div class="row">';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  days.forEach((day, index) => {
    const dayMeds = medicationsByDay[index] || [];
    
    calendarHTML += `
      <div class="col-md-12" style="margin-bottom: 20px;">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h4>
              <i class="fa fa-calendar-day"></i> ${day}
              <span class="badge pull-right">${dayMeds.length}</span>
            </h4>
          </div>
          <div class="panel-body">
    `;
    
    if (dayMeds.length > 0) {
      dayMeds.forEach(med => {
        const statusClass = med.is_taken ? 'success' : 'warning';
        const statusIcon = med.is_taken ? 'check-circle' : 'clock-o';
        const statusText = med.is_taken ? 'Taken' : 'Pending';
        
        calendarHTML += `
          <div class="alert alert-${statusClass}" style="margin-bottom: 10px;">
            <div class="row">
              <div class="col-md-8">
                <h5><strong>${med.medication_name}</strong> - ${med.medication_dosage}</h5>
                <p><i class="fa fa-clock-o"></i> ${formatTimeForDisplay(med.medication_time)}</p>
                ${med.medication_notes ? `<p><small><i class="fa fa-sticky-note"></i> ${med.medication_notes}</small></p>` : ''}
              </div>
              <div class="col-md-4 text-right">
                <span class="label label-${statusClass}">
                  <i class="fa fa-${statusIcon}"></i> ${statusText}
                </span>
                <br><br>
                <div class="btn-group-vertical" role="group">
                  ${!med.is_taken ? `
                    <button class="btn btn-sm btn-success" onclick="takeMedication(${med.medication_id}, ${med.user_id})">
                      <i class="fa fa-check"></i> Take
                    </button>
                  ` : `
                    <button class="btn btn-sm btn-warning" onclick="markAsMissed(${med.medication_id}, ${med.user_id})">
                      <i class="fa fa-undo"></i> Mark Missed
                    </button>
                  `}
                  <button class="btn btn-sm btn-info" onclick="editMedication(${med.medication_id})">
                    <i class="fa fa-edit"></i> Edit
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteMedication(${med.medication_id}, ${med.user_id})">
                    <i class="fa fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      calendarHTML += '<p class="text-muted">No medications scheduled for this day.</p>';
    }
    
    calendarHTML += `
          </div>
        </div>
      </div>
    `;
  });
  
  calendarHTML += '</div>';
  calendar.innerHTML = calendarHTML;
}

function groupMedicationsByDay(medications) {
  const medicationsByDay = {};
  
  medications.forEach(med => {
    const medDate = new Date(med.medication_date);
    const dayOfWeek = medDate.getDay();
    
    if (!medicationsByDay[dayOfWeek]) {
      medicationsByDay[dayOfWeek] = [];
    }
    
    medicationsByDay[dayOfWeek].push(med);
  });
  
  // Sort medications by time within each day
  Object.keys(medicationsByDay).forEach(day => {
    medicationsByDay[day].sort((a, b) => {
      return a.medication_time.localeCompare(b.medication_time);
    });
  });
  
  return medicationsByDay;
}

function updateWeeklySummary(medications) {
  const total = medications.length;
  const taken = medications.filter(med => med.is_taken).length;
  const remaining = total - taken;
  const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
  
  document.getElementById('weekly-total').textContent = total;
  document.getElementById('weekly-taken').textContent = taken;
  document.getElementById('weekly-remaining').textContent = remaining;
  
  const progressBar = document.getElementById('weekly-progress');
  if (progressBar) {
    progressBar.style.width = percentage + '%';
    progressBar.textContent = percentage + '%';
    
    // Update progress bar color based on completion
    progressBar.className = `progress-bar ${percentage === 100 ? 'progress-bar-success' : 'progress-bar-warning'}`;
  }
}

function formatTimeForDisplay(timeString) {
  if (!timeString) return 'Not specified';
  
  // Handle both HH:MM and HH:MM:SS formats
  const timeParts = timeString.split(':');
  if (timeParts.length >= 2) {
    const hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  }
  return timeString;
}

async function takeMedication(medicationId, userId) {
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/${userId}/${medicationId}/is-taken`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to mark medication as taken: ${errorText}`);
    }
    
    const result = await response.json();
    showAlert('Medication marked as taken successfully!', 'success');
    
    // Reload medications to update display
    loadWeeklyMedications(userId);
    
    // Show low quantity warning if applicable
    if (result.isLowQuantity) {
      showAlert(result.message, 'warning');
    }
  } catch (error) {
    console.error('Error taking medication:', error);
    showAlert(error.message, 'danger');
  }
}

async function markAsMissed(medicationId, userId) {
  if (!confirm('Mark this medication as missed?')) return;
  
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/${userId}/${medicationId}/missed`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to mark medication as missed: ${errorText}`);
    }
    
    const result = await response.json();
    showAlert('Medication marked as missed', 'warning');
    
    // Reload medications
    loadWeeklyMedications(userId);
  } catch (error) {
    console.error('Error marking medication as missed:', error);
    showAlert(error.message, 'danger');
  }
}

async function deleteMedication(medicationId, userId) {
  if (!confirm('Are you sure you want to delete this medication?')) return;
  
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/${userId}/${medicationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete medication');
    
    showAlert('Medication deleted successfully', 'success');
    loadWeeklyMedications(userId);
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

function editMedication(medicationId) {
  window.location.href = `/medications/edit/${medicationId}`;
}

function navigateWeek(direction) {
  // Use the hardcoded TEST_USER_ID instead of token
  const TEST_USER_ID = 8; // Make sure this matches the ID at the top
  
  // Calculate new week dates
  if (direction === 'prev') {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    currentWeekEnd.setDate(currentWeekEnd.getDate() - 7);
  } else if (direction === 'next') {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
  }
  
  // Update display
  const options = { month: 'short', day: 'numeric' };
  const weekText = `${currentWeekStart.toLocaleDateString('en-US', options)} - ${currentWeekEnd.toLocaleDateString('en-US', options)}`;
  const currentWeekElement = document.getElementById('current-week');
  if (currentWeekElement) {
    currentWeekElement.textContent = weekText;
  }
  
  // Load medications for new week
  const startDate = currentWeekStart.toISOString().split('T')[0];
  const endDate = currentWeekEnd.toISOString().split('T')[0];
  loadWeeklyMedications(TEST_USER_ID, startDate, endDate);
}

async function searchMedications(userId, query) {
  if (query.length < 2) {
    loadWeeklyMedications(userId);
    return;
  }
  
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/user/${userId}/search?name=${encodeURIComponent(query)}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Search failed');
    
    const medications = await response.json();
    displayWeeklyMedications(medications);
    updateWeeklySummary(medications);
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

function setupEventListeners(userId) {
  // Week navigation buttons
  const prevWeekBtn = document.getElementById('prev-week');
  const nextWeekBtn = document.getElementById('next-week');
  
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => navigateWeek('prev'));
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => navigateWeek('next'));
  }
  
  // Search functionality
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value.trim();
      if (query.length === 0) {
        loadWeeklyMedications(userId);
        const searchResults = document.getElementById('search-results');
        if (searchResults) searchResults.style.display = 'none';
      } else if (query.length >= 2) {
        searchMedications(userId, query);
        const searchResults = document.getElementById('search-results');
        if (searchResults) searchResults.style.display = 'block';
      }
    });
  }
  
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      const query = searchInput ? searchInput.value.trim() : '';
      if (query) {
        searchMedications(userId, query);
      }
    });
  }
  
  // Logout button - just reload for testing
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }
  
  // Add medication form
  const medicationForm = document.getElementById('medication-form');
  if (medicationForm) {
    medicationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      await createMedication(userId);
    });
  }
  
  // Time selectors for form
  setupTimeSelectors();
}

function setupTimeSelectors() {
  const hourSelect = document.getElementById('time-hour');
  const minuteSelect = document.getElementById('time-minute');
  const ampmSelect = document.getElementById('time-ampm');
  const hiddenTimeField = document.getElementById('time');
  
  if (hourSelect && minuteSelect && ampmSelect && hiddenTimeField) {
    function updateHiddenTime() {
      const hour = hourSelect.value;
      const minute = minuteSelect.value;
      const ampm = ampmSelect.value;
      
      if (hour && minute && ampm) {
        let hour24 = parseInt(hour);
        if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (ampm === 'AM' && hour24 === 12) hour24 = 0;
        
        const timeString = `${hour24.toString().padStart(2, '0')}:${minute}`;
        hiddenTimeField.value = timeString;
      }
    }
    
    hourSelect.addEventListener('change', updateHiddenTime);
    minuteSelect.addEventListener('change', updateHiddenTime);
    ampmSelect.addEventListener('change', updateHiddenTime);
  }
}

async function createMedication(userId) {
  const formData = {
    user_id: userId,
    medication_name: document.getElementById('name').value,
    medication_dosage: document.getElementById('dosage').value,
    medication_date: document.getElementById('medication-date').value,
    medication_time: document.getElementById('time').value,
    medication_quantity: parseInt(document.getElementById('quantity').value) || 0,
    prescription_startdate: document.getElementById('prescription-start').value || null,
    prescription_enddate: document.getElementById('prescription-end').value || null,
    medication_notes: document.getElementById('notes').value,
    medication_reminders: document.getElementById('reminders').checked,
    is_taken: false
  };
  
  try {
    // Remove authorization header for testing
    const response = await fetch('/medications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    showAlert('Medication created successfully!', 'success');
    
    // Close modal if it exists
    const modal = document.getElementById('addMedModal');
    if (modal && typeof $('#addMedModal').modal === 'function') {
      $('#addMedModal').modal('hide');
    }
    
    loadWeeklyMedications(userId);
    
    // Reset form
    const form = document.getElementById('medication-form');
    if (form) {
      form.reset();
    }
    
  } catch (error) {
    console.error('Error creating medication:', error);
    showAlert(error.message, 'danger');
  }
}

// Make functions available globally
window.takeMedication = takeMedication;
window.markAsMissed = markAsMissed;
window.deleteMedication = deleteMedication;
window.editMedication = editMedication;
window.navigateWeek = navigateWeek;
window.searchMedications = searchMedications;