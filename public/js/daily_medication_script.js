function getCurrentUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        const decoded = decodeJwtPayload(token);
        return decoded ? decoded.id : null;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
}

function decodeJwtPayload(token) {
    try {
        const jwt = token.split(" ")[1] || token;
        const payloadBase64 = jwt.split(".")[1];
        const payloadJson = atob(payloadBase64);
        return JSON.parse(payloadJson);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}

function isTokenExpired(token) {
    const decoded = decodeJwtPayload(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp < Date.now() / 1000;
}

function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        
        // Check for token in cookies if not found in localStorage
        const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
        if (match) {
            const cookieToken = decodeURIComponent(match[1]);
            if (!isTokenExpired(cookieToken)) {
                localStorage.setItem('token', cookieToken);
                return true;
            }
        }
        
        window.location.href = '/login';
        return false;
    }
    
    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function logout() {
    localStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication first
  if (!checkAuth()) {
    return; // Stop execution if not authenticated
  }
  
  // Get current user ID from token
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    showAlert('Unable to get user information. Please log in again.', 'danger');
    logout();
    return;
  }
  
  try {
    // Initialize current date display
    updateCurrentDate();
    
    // Load daily medications
    loadDailyMedications(currentUserId);
    
    // Setup event listeners
    setupEventListeners(currentUserId);
    
    // Initialize notification system
    if (window.medicationNotificationSystem) {
      window.medicationNotificationSystem.setUserId(currentUserId);
    }
    
  } catch (error) {
    console.error('Initialization error:', error);
    showAlert('Failed to initialize application. Please refresh the page.', 'danger');
  }
});

function showAlert(message, type = 'success') {
  let alertContainer = document.getElementById('alert-container');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alert-container';
    document.body.insertBefore(alertContainer, document.body.firstChild);
  }
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
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

function updateCurrentDate() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
  
  // Add readable relative date using DateUtils
  const readableElement = document.getElementById('current-date-readable');
  if (readableElement && window.DateUtils) {
    const todayString = now.toISOString().split('T')[0];
    const relativeTime = DateUtils.getRelativeTime(todayString);
    readableElement.textContent = `Today is ${DateUtils.formatDate(todayString)} (${relativeTime === 'now' ? 'Today' : relativeTime})`;
  }
}

async function loadDailyMedications(userId) {
  try {
    // Show loading state
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
      loadingMessage.style.display = 'block';
      loadingMessage.innerHTML = '<div class="alert alert-info"><i class="fa fa-spinner fa-spin"></i> Loading medications...</div>';
    }
    
    const response = await fetch(`/medications/user/${userId}/daily`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        showAlert('Session expired. Please log in again.', 'danger');
        logout();
        return;
      }
      if (response.status === 404) {
        // No medications found - display empty state
        displayDailyMedications([]);
        if (loadingMessage) {
          loadingMessage.style.display = 'none';
        }
        return;
      }
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Validate that data is an array
    let medications = [];
    if (Array.isArray(data)) {
      medications = data;
    } else if (data && Array.isArray(data.medications)) {
      medications = data.medications;
    } else if (data && typeof data === 'object') {
      console.warn('Unexpected response format:', data);
      // Try to extract medications from common response patterns
      if (data.data && Array.isArray(data.data)) {
        medications = data.data;
      } else if (data.results && Array.isArray(data.results)) {
        medications = data.results;
      } else {
        throw new Error('Invalid response format: medications data is not an array');
      }
    } else {
      throw new Error('Invalid response format: expected array or object with medications');
    }
    
    console.log('Loaded medications:', medications); // Debug log
    
    displayDailyMedications(medications);
    
    // Check for reminders
    checkReminders(userId);
    
    // Hide loading message
    if (loadingMessage) {
      loadingMessage.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error loading daily medications:', error);
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
    showAlert(`Error loading medications: ${error.message}`, 'danger');
  }
}

function displayDailyMedications(medications) {
  const loadingMessage = document.getElementById('loading-message');
  const noMedsMessage = document.getElementById('no-medications-message');
  const errorMessage = document.getElementById('error-message');
  
  // Hide all status messages
  if (loadingMessage) loadingMessage.style.display = 'none';
  if (noMedsMessage) noMedsMessage.style.display = 'none';
  if (errorMessage) errorMessage.style.display = 'none';
  
  // Validate medications is an array
  if (!Array.isArray(medications)) {
    console.error('displayDailyMedications: medications is not an array', medications);
    showAlert('Error: Invalid medication data format', 'danger');
    return;
  }
  
  if (medications.length === 0) {
    // Show no medications message
    const noMedsDiv = document.createElement('div');
    noMedsDiv.className = 'no-medications';
    noMedsDiv.innerHTML = `
      <div class="alert alert-info">
        <h4><i class="fa fa-info-circle"></i> No medications scheduled for today</h4>
        <p>You don't have any medications scheduled for today.</p>
        <a href="/medications/create" class="btn btn-primary">Add Medication</a>
      </div>
    `;
    
    // Clear existing content
    const containers = ['morning-medications', 'afternoon-medications', 'evening-medications', 'night-medications'];
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = '';
    });
    
    // Add to morning section
    const morningContainer = document.getElementById('morning-medications');
    if (morningContainer) {
      morningContainer.appendChild(noMedsDiv);
    }
    
    return;
  }
  
  // Get current user ID for actions
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    showAlert('User authentication error', 'danger');
    return;
  }
  
  // Group medications by time of day
  const groupedMeds = groupMedicationsByTimeOfDay(medications);
  
  // Display medications in their respective time periods
  displayTimeGroupMedications('morning-medications', groupedMeds.morning, 'Morning', currentUserId);
  displayTimeGroupMedications('afternoon-medications', groupedMeds.afternoon, 'Afternoon', currentUserId);
  displayTimeGroupMedications('evening-medications', groupedMeds.evening, 'Evening', currentUserId);
  displayTimeGroupMedications('night-medications', groupedMeds.night, 'Night', currentUserId);
}

function groupMedicationsByTimeOfDay(medications) {
  // Validate input
  if (!Array.isArray(medications)) {
    console.error('groupMedicationsByTimeOfDay: medications is not an array', medications);
    return {
      morning: [],
      afternoon: [],
      evening: [],
      night: []
    };
  }
  
  const grouped = {
    morning: [],    // 6:00 AM - 11:59 AM
    afternoon: [],  // 12:00 PM - 5:59 PM
    evening: [],    // 6:00 PM - 9:59 PM
    night: []       // 10:00 PM - 5:59 AM
  };
  
  medications.forEach(med => {
    try {
      const timeStr = med.medication_time || '12:00';
      const timeParts = timeStr.split(':');
      const hour = parseInt(timeParts[0]) || 12;
      
      if (hour >= 6 && hour < 12) {
        grouped.morning.push(med);
      } else if (hour >= 12 && hour < 18) {
        grouped.afternoon.push(med);
      } else if (hour >= 18 && hour < 22) {
        grouped.evening.push(med);
      } else {
        grouped.night.push(med);
      }
    } catch (error) {
      console.error('Error processing medication time:', med, error);
      // Default to morning if there's an error
      grouped.morning.push(med);
    }
  });
  
  // Sort each group by time
  Object.keys(grouped).forEach(timeOfDay => {
    grouped[timeOfDay].sort((a, b) => {
      const timeA = a.medication_time || '12:00';
      const timeB = b.medication_time || '12:00';
      return timeA.localeCompare(timeB);
    });
  });
  
  return grouped;
}

function displayTimeGroupMedications(containerId, medications, timeLabel, userId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container ${containerId} not found`);
    return;
  }
  
  // Validate medications is an array
  if (!Array.isArray(medications)) {
    console.error(`displayTimeGroupMedications: medications for ${timeLabel} is not an array`, medications);
    container.innerHTML = `<div class="alert alert-warning">Error loading ${timeLabel.toLowerCase()} medications</div>`;
    return;
  }
  
  if (medications.length === 0) {
    container.innerHTML = `
      <div class="time-period-header">
        <h3><i class="fa fa-clock-o"></i> ${timeLabel}</h3>
        <span class="badge">0</span>
      </div>
      <div class="no-medications-time">
        <p class="text-muted">No medications scheduled for ${timeLabel.toLowerCase()}</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="time-period-header">
      <h3><i class="fa fa-clock-o"></i> ${timeLabel}</h3>
      <span class="badge">${medications.length}</span>
    </div>
    <div class="medications-list">
  `;
  
  medications.forEach(med => {
    try {
      html += createMedicationCard(med, userId);
    } catch (error) {
      console.error('Error creating medication card:', med, error);
      html += `<div class="alert alert-warning">Error displaying medication: ${med.medication_name || 'Unknown'}</div>`;
    }
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function createMedicationCard(med, userId) {
  // Validate medication object
  if (!med || typeof med !== 'object') {
    console.error('Invalid medication object:', med);
    return '<div class="alert alert-warning">Invalid medication data</div>';
  }
  
  const medicationId = med.medication_id || med.id;
  const medicationName = med.medication_name || 'Unknown Medication';
  const medicationDosage = med.medication_dosage || 'No dosage specified';
  const medicationTime = med.medication_time || '00:00';
  const medicationNotes = med.medication_notes || '';
  const isTaken = med.is_taken || false;
  const quantity = med.medication_quantity || 0;
  
  // Validate required fields
  if (!medicationId || !userId) {
    console.error('Missing required fields:', { medicationId, userId, med });
    return '<div class="alert alert-warning">Missing medication information</div>';
  }
  
  const statusClass = isTaken ? 'taken' : 'pending';
  const statusIcon = isTaken ? 'check-circle' : 'clock-o';
  const statusText = isTaken ? 'Taken' : 'Pending';
  const lowQuantityClass = quantity < 5 ? 'low-quantity' : '';
  
  return `
    <div class="medication-item ${statusClass} ${lowQuantityClass}" data-medication-id="${medicationId}">
      <div class="medication-info">
        <div class="medication-name">${medicationName}</div>
        <div class="medication-details">
          <div><i class="fa fa-pills"></i> ${medicationDosage}</div>
          <div><i class="fa fa-clock-o"></i> ${formatTimeForDisplay(medicationTime)}</div>
          ${medicationNotes ? `<div><i class="fa fa-sticky-note"></i> ${medicationNotes}</div>` : ''}
          <div><i class="fa fa-archive"></i> Quantity: ${quantity}</div>
        </div>
      </div>
      <div class="medication-status">
        <span class="status-badge ${statusClass}">
          <i class="fa fa-${statusIcon}"></i> ${statusText}
        </span>
      </div>
      <div class="medication-actions">
        ${!isTaken ? `
          <button class="btn btn-success btn-sm" onclick="takeMedication(${medicationId}, ${userId})">
            <i class="fa fa-check"></i> Take
          </button>
        ` : `
          <button class="btn btn-warning btn-sm" onclick="markAsMissed(${medicationId}, ${userId})">
            <i class="fa fa-undo"></i> Undo
          </button>
        `}
        <button class="btn btn-info btn-sm" onclick="editMedication(${medicationId})">
          <i class="fa fa-edit"></i> Edit
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteMedication(${medicationId})">
          <i class="fa fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `;
}

function formatTimeForDisplay(timeString) {
  if (!timeString) return 'Not specified';
  
  // Use DateUtils if available
  if (window.DateUtils) {
    return DateUtils.formatTime(timeString);
  }
  
  // Fallback logic
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
    if (!medicationId || medicationId === 'undefined') {
        showAlert('Invalid medication ID', 'danger');
        return;
    }
    
    if (!userId || userId === 'undefined') {
        showAlert('Invalid user ID', 'danger');
        return;
    }

    const response = await fetch(`/medications/${userId}/${medicationId}/is-taken`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to mark medication as taken: ${errorText}`);
    }
    
    const result = await response.json();
    showAlert('Medication marked as taken successfully!', 'success');
    
    // Reload medications to update display
    await loadDailyMedications(userId);

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
  if (!confirm('Mark this medication as missed? This will reset it to not taken.')) return;
  
  try {
    console.log(`Marking medication ${medicationId} as missed for user ${userId}`);
    
    const response = await fetch(`/medications/${userId}/${medicationId}/missed`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to mark medication as missed: ${errorText}`);
    }
    
    const result = await response.json();
    showAlert('Medication marked as missed', 'warning');
    await loadDailyMedications(userId);
    
  } catch (error) {
    console.error('Error marking medication as missed:', error);
    showAlert(`Error marking medication as missed: ${error.message}`, 'danger');
  }
}

async function markAllAsTaken(userId) {
  if (!confirm('Mark all pending medications as taken?')) return;
  
  try {
    const response = await fetch(`/medications/${userId}/tick-all`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to mark all medications as taken: ${errorText}`);
    }
    
    const result = await response.json();
    showAlert(result.message || 'All medications marked as taken!', 'success');
    loadDailyMedications(userId);
  } catch (error) {
    console.error('Error marking all medications as taken:', error);
    showAlert(error.message, 'danger');
  }
}

async function checkReminders(userId) {
  try {
    const response = await fetch(`/medications/user/${userId}/reminders`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) return;
    
    const reminders = await response.json();
    if (reminders && reminders.length > 0) {
      displayReminders(reminders);
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

function displayReminders(reminders) {
  const container = document.getElementById('reminders-container');
  if (!container) return;
  
  const currentUserId = getCurrentUserId();
  
  const reminderHTML = reminders.map(reminder => `
    <div class="alert alert-warning reminder-alert">
      <strong>Reminder:</strong> It's time to take ${reminder.medication_name} (${reminder.medication_dosage})
      <button class="btn btn-sm btn-success" onclick="takeMedication(${reminder.medication_id}, ${currentUserId})">
        Take Now
      </button>
    </div>
  `).join('');
  
  container.innerHTML = reminderHTML;
}

function editMedication(medicationId) {
  window.location.href = `/medications/edit/${medicationId}`;
}

function setupEventListeners(userId) {
  // Mark all as taken button
  const tickAllBtn = document.getElementById('tick-all-btn');
  if (tickAllBtn) {
    tickAllBtn.addEventListener('click', () => markAllAsTaken(userId));
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }
}

async function deleteMedication(medicationId) {
    if (!medicationId || medicationId === 'undefined') {
        showAlert('Invalid medication ID', 'error');
        return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
        showAlert('User ID not found', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this medication?')) {
        return;
    }

    try {
        const response = await fetch(`/medications/${userId}/${medicationId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete medication');
        }

        await loadDailyMedications(userId);
        showAlert('Medication deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting medication:', error);
        showAlert(`Error deleting medication: ${error.message}`, 'error');
    }
}

// Make functions available globally
window.takeMedication = takeMedication;
window.markAsMissed = markAsMissed;
window.editMedication = editMedication;
window.deleteMedication = deleteMedication;