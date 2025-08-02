const TEST_USER_ID = 8; // Global constant for consistent user ID
document.addEventListener('DOMContentLoaded', function() {
  // Skip authentication for testing - use hardcoded user ID
  
  try {
    // Initialize current date display
    updateCurrentDate();
    
    // Load daily medications
    loadDailyMedications(TEST_USER_ID);
    
    // Setup event listeners
    setupEventListeners(TEST_USER_ID);
    
    // Initialize notification system
    if (window.medicationNotificationSystem) {
      window.medicationNotificationSystem.setUserId(TEST_USER_ID);
    }
    
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
  
  const TEST_USER_ID = 8;
  
  // Use DateUtils for time formatting
  const formattedTime = window.DateUtils ? 
    DateUtils.formatTime(med.medication_time) : 
    formatTimeForDisplay(med.medication_time);
  
  // Calculate relative time for next dose
  const relativeTime = window.DateUtils ? 
    DateUtils.getRelativeTime(med.medication_date, med.medication_time) : '';
  
  return `
    <div class="medication-card ${statusClass}" data-medication-id="${med.medication_id}">
      <div class="med-info">
        <h4>${med.medication_name}</h4>
        <p class="dosage">${med.medication_dosage}</p>
        <p class="time">${formattedTime}</p>
        ${relativeTime ? `<p class="relative-time" style="font-size: 0.8em; color: #666;">${relativeTime}</p>` : ''}
        ${med.medication_notes ? `<p class="notes">${med.medication_notes}</p>` : ''}
      </div>
      <div class="med-actions">
        <span class="status ${statusClass}">
          <i class="fa fa-${statusIcon}"></i> ${statusText}
        </span>
        <div class="action-buttons">
          ${!med.is_taken ? `
            <button class="btn btn-success btn-sm" onclick="takeMedication(${med.medication_id}, ${TEST_USER_ID})">
              <i class="fa fa-check"></i> Take
            </button>
          ` : `
            <button class="btn btn-warning btn-sm" onclick="markAsMissed(${med.medication_id}, ${TEST_USER_ID})">
              <i class="fa fa-undo"></i> Mark Not Taken
            </button>
          `}
          <button class="btn btn-info btn-sm" onclick="editMedication(${med.medication_id})">
            <i class="fa fa-edit"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteMedication(${med.medication_id})">
            <i class="fa fa-trash"></i> Delete
          </button>
        </div>
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
    await loadDailyMedications(userId);
    await loadLowQuantityMedications(userId);

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
    
    // Use the markMedicationAsMissed endpoint
    const response = await fetch(`/medications/${userId}/${medicationId}/missed`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
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
  
  const TEST_USER_ID = 8; // Use consistent test user ID
  
  const reminderHTML = reminders.map(reminder => `
    <div class="alert alert-warning reminder-alert">
      <strong>Reminder:</strong> It's time to take ${reminder.medication_name} (${reminder.medication_dosage})
      <button class="btn btn-sm btn-success" onclick="takeMedication(${reminder.medication_id}, ${TEST_USER_ID})">
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
    // Validate inputs
    if (!medicationId || medicationId === 'undefined') {
        showAlert('Invalid medication ID', 'error');
        return;
    }

    const userId = TEST_USER_ID;
    
    if (!userId || userId === 'undefined') {
        showAlert('User ID not found', 'error');
        return;
    }

    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this medication?')) {
        return;
    }

    try {
        const response = await fetch(`/medications/${userId}/${medicationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete medication');
        }

        // Refresh the daily view after successful deletion
        await loadDailyMedications(userId);
        showAlert('Medication deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting medication:', error);
        showAlert(`Error deleting medication: ${error.message}`, 'error');
    }
}

function editMedication(medicationId) {
  window.location.href = `/medications/edit/${medicationId}`;
}

// Make functions available globally
window.takeMedication = takeMedication;
window.markAsMissed = markAsMissed;
window.editMedication = editMedication;
window.deleteMedication = deleteMedication;
window.editMedication = editMedication;