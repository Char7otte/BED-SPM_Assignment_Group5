document.addEventListener('DOMContentLoaded', function() {
  // Skip authentication for testing - use hardcoded user ID
  const TEST_USER_ID = 8; // Change this to match a user ID in your database
  
  try {
    // Initialize current date display
    updateCurrentDate();
    
    // Load daily medications
    loadDailyMedications(TEST_USER_ID);
    
    // Setup event listeners
    setupEventListeners(TEST_USER_ID);
    
    // Check for reminders every minute
    setInterval(() => checkReminders(TEST_USER_ID), 60000);
    
  } catch (error) {
    console.error('Initialization error:', error);
    showAlert('Failed to initialize application. Please refresh the page.', 'danger');
  }
});

function logout() {
  // For testing, just redirect to a placeholder or reload page
  window.location.reload();
}

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
}

async function loadDailyMedications(userId) {
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/user/${userId}/daily`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        displayDailyMedications([]);
        return;
      }
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const medications = await response.json();
    displayDailyMedications(medications);
    
  } catch (error) {
    console.error('Error loading daily medications:', error);
    showAlert(error.message, 'danger');
  }
}

function displayDailyMedications(medications) {
  const timeContainers = {
    morning: document.getElementById('morning-meds-container'),
    afternoon: document.getElementById('afternoon-meds-container'),
    evening: document.getElementById('evening-meds-container'),
    night: document.getElementById('night-meds-container')
  };
  
  // Clear all containers
  Object.values(timeContainers).forEach(container => {
    if (container) container.innerHTML = '';
  });
  
  if (!medications || medications.length === 0) {
    Object.values(timeContainers).forEach(container => {
      if (container) {
        container.innerHTML = '<p class="no-medications">No medications scheduled</p>';
      }
    });
    return;
  }
  
  // Group medications by time of day
  const groupedMeds = groupMedicationsByTimeOfDay(medications);
  
  Object.entries(groupedMeds).forEach(([timeOfDay, meds]) => {
    const container = timeContainers[timeOfDay];
    if (container && meds.length > 0) {
      container.innerHTML = meds.map(med => createMedicationCard(med)).join('');
    } else if (container) {
      container.innerHTML = '<p class="no-medications">No medications scheduled</p>';
    }
  });
}

function groupMedicationsByTimeOfDay(medications) {
  const grouped = {
    morning: [],
    afternoon: [],
    evening: [],
    night: []
  };
  
  medications.forEach(med => {
    const time = med.medication_time;
    const hour = parseInt(time.split(':')[0]);
    
    if (hour >= 6 && hour < 12) {
      grouped.morning.push(med);
    } else if (hour >= 12 && hour < 17) {
      grouped.afternoon.push(med);
    } else if (hour >= 17 && hour < 21) {
      grouped.evening.push(med);
    } else {
      grouped.night.push(med);
    }
  });
  
  return grouped;
}

function createMedicationCard(med) {
  const statusClass = med.is_taken ? 'taken' : 'pending';
  const statusIcon = med.is_taken ? 'check-circle' : 'clock';
  const statusText = med.is_taken ? 'Taken' : 'Pending';
  
  return `
    <div class="medication-card ${statusClass}">
      <div class="med-info">
        <h4>${med.medication_name}</h4>
        <p class="dosage">${med.medication_dosage}</p>
        <p class="time">${formatTimeForDisplay(med.medication_time)}</p>
        ${med.medication_notes ? `<p class="notes">${med.medication_notes}</p>` : ''}
      </div>
      <div class="med-actions">
        <span class="status ${statusClass}">
          <i class="fa fa-${statusIcon}"></i> ${statusText}
        </span>
        <div class="action-buttons">
          ${!med.is_taken ? `
            <button class="btn btn-success btn-sm" onclick="takeMedication(${med.medication_id}, ${med.user_id || 1})">
              <i class="fa fa-check"></i> Take
            </button>
          ` : `
            <button class="btn btn-warning btn-sm" onclick="markAsMissed(${med.medication_id}, ${med.user_id || 1})">
              <i class="fa fa-undo"></i> Mark Missed
            </button>
          `}
          <button class="btn btn-info btn-sm" onclick="editMedication(${med.medication_id})">
            <i class="fa fa-edit"></i> Edit
          </button>
        </div>
      </div>
    </div>
  `;
}

function formatTimeForDisplay(timeString) {
  if (!timeString) return 'Not specified';
  
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
    loadDailyMedications(userId);
    
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
    
    showAlert('Medication marked as missed', 'warning');
    loadDailyMedications(userId);
  } catch (error) {
    console.error('Error marking medication as missed:', error);
    showAlert(error.message, 'danger');
  }
}

async function markAllAsTaken(userId) {
  if (!confirm('Mark all pending medications as taken?')) return;
  
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/user/${userId}/tick-all`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
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
    // Remove authorization header for testing
    const response = await fetch(`/medications/user/${userId}/reminders`, {
      headers: {
        'Content-Type': 'application/json'
      }
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
  
  const reminderHTML = reminders.map(reminder => `
    <div class="alert alert-warning reminder-alert">
      <strong>Reminder:</strong> It's time to take ${reminder.medication_name} (${reminder.medication_dosage})
      <button class="btn btn-sm btn-success" onclick="takeMedication(${reminder.medication_id}, 1)">
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

// Make functions available globally
window.takeMedication = takeMedication;
window.markAsMissed = markAsMissed;
window.editMedication = editMedication;