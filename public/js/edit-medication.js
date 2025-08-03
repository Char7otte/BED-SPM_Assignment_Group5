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

let medicationId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuth()) {
        return; // Stop execution if not authenticated
    }
    
    // Get current user ID from token
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        showError('Unable to get user information. Please log in again.');
        logout();
        return;
    }
    
    try {
        // Get medication ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlPath = window.location.pathname;
        
        // Try different URL patterns
        let pathMatch = urlPath.match(/\/medications\/edit\/(\d+)/);
        if (!pathMatch) {
            pathMatch = urlPath.match(/\/medications\/(\d+)\/edit/);
        }
        if (!pathMatch) {
            pathMatch = urlPath.match(/\/edit_medication.*[?&]id=(\d+)/);
        }
        
        if (pathMatch) {
            medicationId = parseInt(pathMatch[1]);
        }
        
        // Fallback to URL parameter
        if (!medicationId) {
            medicationId = parseInt(urlParams.get('id'));
        }
        
        console.log('Extracted medication ID:', medicationId);
        
        if (!medicationId) {
            if (window.showError) {
                showError('No medication ID provided');
            } else {
                console.error('No medication ID provided');
            }
            return;
        }
        
        // Load medication data
        loadMedicationData(currentUserId);
        
        // Setup event listeners
        setupEventListeners(currentUserId);
        
        // Add readable date/time formatting
        setupDateTimeFormatting();
        
    } catch (error) {
        console.error('Initialization error:', error);
        if (window.showError) {
            showError('Failed to initialize edit form. Please refresh the page.');
        }
    }
});

async function loadMedicationData(userId) {
    try {
        if (window.showLoading) {
            showLoading('Loading medication data...');
        } else {
            console.log('Loading medication data...');
        }
        
        const response = await fetch(`/medications/user/${userId}/${medicationId}`, {
            headers: getAuthHeaders()
        });
        
        console.log(`Fetching medication from: /medications/user/${userId}/${medicationId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Medication not found. This medication may have been deleted or the ID is incorrect.');
            }
            const errorText = await response.text();
            throw new Error(`Failed to load medication: ${errorText}`);
        }
        
        const medication = await response.json();
        populateForm(medication);
        
        if (window.showAlert) {
            showAlert('Medication loaded successfully', 'success');
        } else {
            console.log('Medication loaded successfully');
        }
        
        document.getElementById('edit-form-container').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading medication:', error);
        if (window.showError) {
            showError(`Error loading medication: ${error.message}`);
        } else {
            console.error(`Error loading medication: ${error.message}`);
        }
    }
}

function populateForm(medication) {
    try {
        // Basic medication info
        document.getElementById('medication_name').value = medication.medication_name || '';
        document.getElementById('medication_dosage').value = medication.medication_dosage || '';
        document.getElementById('medication_quantity').value = medication.medication_quantity || 0;
        document.getElementById('medication_notes').value = medication.medication_notes || '';
        
        // Dates and time
        if (medication.medication_date) {
            const date = new Date(medication.medication_date);
            document.getElementById('medication_date').value = date.toISOString().split('T')[0];
        }
        
        document.getElementById('medication_time').value = medication.medication_time || '';
        
        if (medication.prescription_startdate) {
            const startDate = new Date(medication.prescription_startdate);
            document.getElementById('prescription_startdate').value = startDate.toISOString().split('T')[0];
        }
        
        if (medication.prescription_enddate) {
            const endDate = new Date(medication.prescription_enddate);
            document.getElementById('prescription_enddate').value = endDate.toISOString().split('T')[0];
        }
        
        // Boolean fields
        document.getElementById('medication_reminders').checked = medication.medication_reminders || false;
        document.getElementById('is_taken').value = medication.is_taken ? 'true' : 'false';
        
        // After populating all fields, update readable dates
        setTimeout(updateReadableDates, 100);
        
    } catch (error) {
        console.error('Error populating form:', error);
        showError('Error loading medication data into form');
    }
}

function setupEventListeners(userId) {
    // Form submission
    const form = document.getElementById('edit-medication-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            handleFormSubmit(e, userId);
        });
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                window.location.href = '/medications';
            }
        });
    }
    
    // Delete button
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            handleDelete(userId);
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Form validation
    setupFormValidation();
}

async function handleFormSubmit(event, userId) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    try {
        const formData = collectFormData();
        
        const response = await fetch(`/medications/${userId}/${medicationId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update medication');
        }
        
        const updatedMedication = await response.json();
        showAlert('Medication updated successfully!', 'success');
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '/medications';
        }, 1500);
        
    } catch (error) {
        console.error('Error updating medication:', error);
        showAlert(`Error updating medication: ${error.message}`, 'danger');
    }
}

function collectFormData() {
    return {
        medication_name: document.getElementById('medication_name').value.trim(),
        medication_dosage: document.getElementById('medication_dosage').value.trim(),
        medication_date: document.getElementById('medication_date').value,
        medication_time: document.getElementById('medication_time').value,
        medication_quantity: parseInt(document.getElementById('medication_quantity').value) || 0,
        medication_notes: document.getElementById('medication_notes').value.trim(),
        medication_reminders: document.getElementById('medication_reminders').checked,
        prescription_startdate: document.getElementById('prescription_startdate').value || null,
        prescription_enddate: document.getElementById('prescription_enddate').value || null,
        is_taken: document.getElementById('is_taken').value === 'true'
    };
}

async function handleDelete(userId) {
    if (!confirm('Are you sure you want to delete this medication? This action cannot be undone.')) {
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
        
        showAlert('Medication deleted successfully!', 'success');
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '/medications';
        }, 1500);
        
    } catch (error) {
        console.error('Error deleting medication:', error);
        showAlert(`Error deleting medication: ${error.message}`, 'danger');
    }
}

function validateForm() {
    let isValid = true;
    const requiredFields = [
        'medication_name',
        'medication_dosage', 
        'medication_date',
        'medication_time'
    ];
    
    // Clear previous validation
    document.querySelectorAll('.form-control').forEach(field => {
        field.classList.remove('is-valid', 'is-invalid');
    });
    
    // Validate required fields
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.add('is-valid');
        }
    });
    
    // Validate dates
    const startDate = document.getElementById('prescription_startdate').value;
    const endDate = document.getElementById('prescription_enddate').value;
    
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        document.getElementById('prescription_enddate').classList.add('is-invalid');
        showAlert('Prescription end date must be after start date', 'warning');
        isValid = false;
    }
    
    // Validate quantity
    const quantity = parseInt(document.getElementById('medication_quantity').value);
    if (quantity < 0) {
        document.getElementById('medication_quantity').classList.add('is-invalid');
        showAlert('Quantity cannot be negative', 'warning');
        isValid = false;
    }
    
    if (!isValid) {
        showAlert('Please fill in all required fields correctly', 'warning');
    }
    
    return isValid;
}

function setupFormValidation() {
    // Real-time validation
    const requiredFields = ['medication_name', 'medication_dosage', 'medication_date', 'medication_time'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                if (this.value.trim()) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                }
            });
        }
    });
}

function setupDateTimeFormatting() {
  const medicationDate = document.getElementById('medication_date');
  const medicationTime = document.getElementById('medication_time');
  const prescriptionStartDate = document.getElementById('prescription_startdate');
  const prescriptionEndDate = document.getElementById('prescription_enddate');
  
  // Update readable formats when dates change
  medicationDate.addEventListener('change', updateReadableDates);
  medicationTime.addEventListener('change', updateReadableDates);
  prescriptionStartDate.addEventListener('change', updateReadableDates);
  prescriptionEndDate.addEventListener('change', updateReadableDates);
}

function updateReadableDates() {
  const medicationDate = document.getElementById('medication_date').value;
  const medicationTime = document.getElementById('medication_time').value;
  const prescriptionStartDate = document.getElementById('prescription_startdate').value;
  const prescriptionEndDate = document.getElementById('prescription_enddate').value;
  
  // Update readable date
  if (medicationDate) {
    document.getElementById('readable-date').textContent = DateUtils.formatDate(medicationDate);
  }
  
  // Update readable time
  if (medicationTime) {
    document.getElementById('readable-time').textContent = DateUtils.formatTime(medicationTime);
  }
  
  // Update prescription dates
  if (prescriptionStartDate) {
    document.getElementById('readable-start-date').textContent = DateUtils.formatDate(prescriptionStartDate);
  }
  
  if (prescriptionEndDate) {
    document.getElementById('readable-end-date').textContent = DateUtils.formatDate(prescriptionEndDate);
  }
  
  // Update next dose info
  if (medicationDate && medicationTime) {
    const relativeTime = DateUtils.getRelativeTime(medicationDate, medicationTime);
    const nextDoseInfo = document.getElementById('next-dose-info');
    if (nextDoseInfo) {
      nextDoseInfo.textContent = `Next dose: ${DateUtils.formatDateTime(medicationDate, medicationTime)} (${relativeTime})`;
      document.getElementById('medication-summary').style.display = 'block';
    }
  }
}

function showAlert(message, type = 'success') {
  let alertContainer = document.getElementById('alert-container');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alert-container';
    document.body.insertBefore(alertContainer, document.querySelector('main'));
  }
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} fade-in-up`;
  alert.style.marginBottom = '1rem';
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

function showError(message) {
  showAlert(message, 'danger');
}

function showLoading(message) {
  showAlert(message, 'info');
}