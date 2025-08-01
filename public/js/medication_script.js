const TEST_USER_ID = 8; // Change this to match a user ID in your database
document.addEventListener('DOMContentLoaded', function() { 
  try {
    // Load medications
    if (window.location.pathname === '/medications') {
      loadAllMedications(TEST_USER_ID);
      loadLowQuantityMedications(TEST_USER_ID);
      loadExpiredMedications(TEST_USER_ID);
      
      // Setup search
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          searchMedications(TEST_USER_ID, this.value);
        });
      }
      
      // Setup filter
      const statusFilter = document.getElementById('status-filter');
      if (statusFilter) {
        statusFilter.addEventListener('change', function() {
          filterMedications(TEST_USER_ID, this.value);
        });
      }
    }
    
    // Logout button
    document.getElementById('logout')?.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
    
    // Create medication form
    const createForm = document.getElementById('create-medication-form');
    if (createForm) {
      createForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createMedication(TEST_USER_ID);
      });
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showAlert('Failed to initialize application. Please refresh the page.', 'danger');
  }
});

// Commented out for testing
// function checkAuth() {
//   const token = localStorage.getItem('token');
//   if (!token && window.location.pathname !== '/loginauth.html') {
//     window.location.href = '/loginauth.html';
//   }
// }

function logout() {
  // For testing, just reload the page
  window.location.reload();
}

function showAlert(message, type = 'success') {
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

async function loadAllMedications(userId) {
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/user/${userId}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        displayMedications([]);
        return;
      }
      throw new Error('Failed to load medications');
    }
    
    const medications = await response.json();
    displayMedications(medications);
  } catch (error) {
    console.error('Error loading medications:', error);
    showAlert(error.message, 'danger');
  }
}

async function loadLowQuantityMedications(userId) {
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/user/${userId}/low-quantity`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        displayLowQuantityMedications([]);
        return;
      }
      throw new Error('Failed to load low quantity medications');
    }
    
    const medications = await response.json();
    displayLowQuantityMedications(medications);
  } catch (error) {
    console.error('Error loading low quantity medications:', error);
    showAlert(error.message, 'danger');
  }
}

async function loadExpiredMedications(userId) {
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/user/${userId}/expired`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        displayExpiredMedications([]);
        return;
      }
      throw new Error('Failed to load expired medications');
    }
    
    const medications = await response.json();
    displayExpiredMedications(medications);
  } catch (error) {
    console.error('Error loading expired medications:', error);
    showAlert(error.message, 'danger');
  }
}

function displayMedications(medications) {
  const container = document.getElementById('medications-container');
  container.innerHTML = '';
  
  if (!medications || medications.length === 0) {
    container.innerHTML = '<p>No medications found.</p>';
    return;
  }
  
  medications.forEach(med => {
    const medItem = createMedicationElement(med);
    container.appendChild(medItem);
  });
}

function displayLowQuantityMedications(medications) {
  const container = document.getElementById('low-quantity-container');
  container.innerHTML = '';
  
  if (!medications || medications.length === 0) {
    container.innerHTML = '<p>No low quantity medications.</p>';
    return;
  }
  
  const TEST_USER_ID = 8; // Use consistent test user ID
  
  medications.forEach(med => {
    const medItem = document.createElement('div');
    medItem.className = 'medication-item low-quantity';
    medItem.innerHTML = `
      <div class="medication-info">
        <div class="medication-name">${med.medication_name}</div>
        <div class="medication-details">
          <span>Quantity: ${med.medication_quantity}</span>
        </div>
      </div>
      <div class="medication-actions">
        <button class="btn btn-primary" onclick="refillMedication(${med.medication_id}, ${TEST_USER_ID})">Refill</button>
      </div>
    `;
    container.appendChild(medItem);
  });
}

function displayExpiredMedications(medications) {
  const container = document.getElementById('expired-container');
  container.innerHTML = '';
  
  if (!medications || medications.length === 0) {
    container.innerHTML = '<p>No expired medications.</p>';
    return;
  }
  
  const TEST_USER_ID = 8; // Use consistent test user ID
  
  medications.forEach(med => {
    const medItem = document.createElement('div');
    medItem.className = 'medication-item expired';
    medItem.innerHTML = `
      <div class="medication-info">
        <div class="medication-name">${med.medication_name}</div>
        <div class="medication-details">
          <span>Expired: ${new Date(med.prescription_enddate).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="medication-actions">
        <button class="btn btn-outline" onclick="deleteMedication(${med.medication_id})">Delete</button>
      </div>
    `;
    container.appendChild(medItem);
  });
}

function createMedicationElement(med) {
  const TEST_USER_ID = 8; // Use consistent test user ID
  
  const medItem = document.createElement('div');
  medItem.className = `medication-item ${med.is_taken ? 'taken' : ''}`;
  medItem.innerHTML = `
    <div class="medication-info">
      <div class="medication-name">${med.medication_name}</div>
      <div class="medication-details">
        <span>Dosage: ${med.medication_dosage}</span>
        <span>Time: ${med.medication_time}</span>
        <span>Quantity: ${med.medication_quantity}</span>
        <span>${med.is_taken ? 'Taken' : 'Not Taken'}</span>
      </div>
    </div>
    <div class="medication-actions">
      ${!med.is_taken ? `<button class="btn btn-primary" onclick="tickOffMedication(${med.medication_id}, ${TEST_USER_ID})">Mark Taken</button>` : ''}
      <button class="btn btn-outline" onclick="editMedication(${med.medication_id})">Edit</button>
      <button class="btn btn-outline" onclick="deleteMedication(${med.medication_id})">Delete</button>
    </div>
  `;
  return medItem;
}

async function searchMedications(userId, query) {
  if (query.length < 2) {
    loadAllMedications(userId);
    return;
  }
  
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/user/${userId}/search?name=${encodeURIComponent(query)}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        displayMedications([]);
        return;
      }
      throw new Error('Search failed');
    }
    
    const medications = await response.json();
    displayMedications(medications);
  } catch (error) {
    console.error('Error searching medications:', error);
    showAlert(error.message, 'danger');
  }
}

async function filterMedications(userId, status) {
  try {
    let url = `/medications/user/${userId}`;
    if (status === 'taken') {
      url += '?is_taken=true';
    } else if (status === 'not-taken') {
      url += '?is_taken=false';
    }
    
    // Remove authorization header for testing
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        displayMedications([]);
        return;
      }
      throw new Error('Filter failed');
    }
    
    const medications = await response.json();
    displayMedications(medications);
  } catch (error) {
    console.error('Error filtering medications:', error);
    showAlert(error.message, 'danger');
  }
}

async function createMedication(userId) {
  const formData = {
    user_id: userId,
    medication_name: document.getElementById('medication_name').value,
    medication_dosage: document.getElementById('medication_dosage').value,
    medication_date: document.getElementById('medication_date').value,
    medication_time: document.getElementById('medication_time').value,
    medication_quantity: parseInt(document.getElementById('medication_quantity').value) || 0,
    prescription_startdate: document.getElementById('prescription_startdate').value || null,
    prescription_enddate: document.getElementById('prescription_enddate').value || null,
    medication_notes: document.getElementById('medication_notes').value,
    medication_reminders: document.getElementById('medication_reminders').checked,
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
      throw new Error(errorData.error || 'Failed to create medication');
    }
    
    const newMedication = await response.json();
    showAlert('Medication created successfully!');
    setTimeout(() => {
      window.location.href = '/medications';
    }, 1500);
  } catch (error) {
    console.error('Error creating medication:', error);
    showAlert(error.message, 'danger');
  }
}

async function tickOffMedication(medicationId, userId) {
  try {
    // Remove authorization header for testing
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
    
    if (!response.ok) throw new Error('Failed to mark medication as taken');
    
    const result = await response.json();
    showAlert(result.message || 'Medication marked as taken');

    await loadAllMedications(userId);
    await loadLowQuantityMedications(userId);

  } catch (error) {
    console.error('Error marking medication as taken:', error);
    showAlert(error.message, 'danger');
  }
}

async function refillMedication(medicationId, userId) {
  const refillQuantity = prompt('Enter refill quantity:');
  if (!refillQuantity || isNaN(refillQuantity)) return;
  
  const refillDate = new Date().toISOString().split('T')[0];
  
  try {
    // Remove authorization header for testing
    const response = await fetch(`/medications/${userId}/${medicationId}/refill`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refillQuantity: parseInt(refillQuantity),
        refillDate: refillDate
      })
    });
    
    if (!response.ok) throw new Error('Failed to refill medication');
    
    const result = await response.json();
    showAlert(result.message || 'Medication refilled successfully');
    loadAllMedications(userId);
    loadLowQuantityMedications(userId);
  } catch (error) {
    console.error('Error refilling medication:', error);
    showAlert(error.message, 'danger');
  }
}

async function deleteMedication(medicationId) {
    // Validate inputs
    if (!medicationId || medicationId === 'undefined') {
        showAlert('Invalid medication ID', 'error');
        return;
    }
    
    const userId = window.currentUserId || 8; // Fallback to test user ID
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

        // Refresh the medications list after successful deletion
        await loadAllMedications(userId);
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
window.tickOffMedication = tickOffMedication;
window.refillMedication = refillMedication;
window.deleteMedication = deleteMedication;
window.editMedication = editMedication;