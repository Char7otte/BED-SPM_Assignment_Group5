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
  // Skip authentication for testing with TEST_USER_ID
  const TEST_USER_ID = 8;
  if (TEST_USER_ID === 8) {
    console.log('Test mode - skipping authentication');
    return true;
  }

  const token = localStorage.getItem('token');
  console.log("Token from localStorage:", token);

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

document.addEventListener('DOMContentLoaded', function () {
  // Check authentication first
  if (!checkAuth()) {
    return; // Stop execution if not authenticated
  }

  // Skip authentication for testing - use hardcoded user ID
  const TEST_USER_ID = 8; // Change this to match a user ID in your database

  try {
    // Setup event listeners
    setupEventListeners(TEST_USER_ID);

    // Set default values
    setDefaultValues();

    // Setup form validation
    setupFormValidation();

  } catch (error) {
    console.error('Initialization error:', error);
    showAlert('Failed to initialize application. Please refresh the page.', 'danger');
  }
});

function logout() {
  // For testing, just redirect to medications list
  window.location.href = '/medications';
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

function setDefaultValues() {
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('medication_date').value = today;

  // Set current time as default
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('medication_time').value = `${hours}:${minutes}`;
}

function setupFormValidation() {
  const form = document.getElementById('create-medication-form');
  const inputs = form.querySelectorAll('input[required], textarea[required]');

  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', clearFieldError);
  });

  // Validate prescription dates
  const startDate = document.getElementById('prescription_startdate');
  const endDate = document.getElementById('prescription_enddate');

  startDate.addEventListener('change', validateDateRange);
  endDate.addEventListener('change', validateDateRange);
}

function validateField(event) {
  const field = event.target;
  const value = field.value.trim();

  clearFieldError(event);

  if (field.hasAttribute('required') && !value) {
    showFieldError(field, `${getFieldLabel(field)} is required`);
    return false;
  }

  // Specific validations
  switch (field.id) {
    case 'medication_name':
      if (value.length < 1) {
        showFieldError(field, 'Medication name must be at least 1 character');
        return false;
      }
      break;

    case 'medication_dosage':
      if (value.length < 1) {
        showFieldError(field, 'Dosage is required');
        return false;
      }
      break;

    case 'medication_quantity':
      const quantity = parseInt(value);
      if (isNaN(quantity) || quantity < 0) {
        showFieldError(field, 'Quantity must be a positive number');
        return false;
      }
      break;
  }

  return true;
}

function validateDateRange() {
  const startDate = document.getElementById('prescription_startdate');
  const endDate = document.getElementById('prescription_enddate');

  if (startDate.value && endDate.value) {
    if (new Date(endDate.value) < new Date(startDate.value)) {
      showFieldError(endDate, 'End date must be after start date');
      return false;
    }
  }

  clearFieldError({ target: endDate });
  return true;
}

function showFieldError(field, message) {
  const formGroup = field.closest('.form-group');
  formGroup.classList.add('has-error');

  // Remove existing error message
  const existingError = formGroup.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  // Add new error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearFieldError(event) {
  const field = event.target;
  const formGroup = field.closest('.form-group');
  formGroup.classList.remove('has-error');

  const errorMessage = formGroup.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
}

function getFieldLabel(field) {
  const label = field.closest('.form-group').querySelector('label');
  return label ? label.textContent.trim() : field.id;
}

function validateForm() {
  const form = document.getElementById('create-medication-form');
  const requiredFields = form.querySelectorAll('input[required], textarea[required]');
  let isValid = true;

  // Clear previous alerts
  const alertContainer = document.getElementById('alert-container');
  if (alertContainer) {
    alertContainer.innerHTML = '';
  }

  // Validate each required field
  requiredFields.forEach(field => {
    if (!validateField({ target: field })) {
      isValid = false;
    }
  });

  // Validate date range
  if (!validateDateRange()) {
    isValid = false;
  }

  return isValid;
}

async function createMedication(userId) {
  if (!validateForm()) {
    showAlert('Please correct the errors in the form', 'danger');
    return;
  }

  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  try {
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    submitBtn.classList.add('loading');

    const formData = {
      user_id: userId,
      medication_name: document.getElementById('medication_name').value.trim(),
      medication_dosage: document.getElementById('medication_dosage').value.trim(),
      medication_date: document.getElementById('medication_date').value,
      medication_time: document.getElementById('medication_time').value,
      medication_quantity: parseInt(document.getElementById('medication_quantity').value) || 0,
      prescription_startdate: document.getElementById('prescription_startdate').value || null,
      prescription_enddate: document.getElementById('prescription_enddate').value || null,
      medication_notes: document.getElementById('medication_notes').value.trim(),
      medication_reminders: document.getElementById('medication_reminders').checked,
      is_taken: false
    };

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

    const result = await response.json();
    showAlert('Medication created successfully!', 'success');

    // Reset form after successful creation
    setTimeout(() => {
      document.getElementById('create-medication-form').reset();
      setDefaultValues();

      // Optionally redirect to medications list
      setTimeout(() => {
        window.location.href = '/medications';
      }, 1500);
    }, 1000);

  } catch (error) {
    console.error('Error creating medication:', error);
    showAlert(error.message, 'danger');
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    submitBtn.classList.remove('loading');
  }
}

function setupEventListeners(userId) {
  // Form submission
  const form = document.getElementById('create-medication-form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await createMedication(userId);
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      logout();
    });
  }

  // Auto-set prescription start date when medication date changes
  const medicationDate = document.getElementById('medication_date');
  const prescriptionStart = document.getElementById('prescription_startdate');

  if (medicationDate && prescriptionStart) {
    medicationDate.addEventListener('change', function () {
      if (!prescriptionStart.value) {
        prescriptionStart.value = this.value;
      }
    });
  }

  // Update quantity display
  const quantityInput = document.getElementById('medication_quantity');
  if (quantityInput) {
    quantityInput.addEventListener('input', function () {
      const value = parseInt(this.value) || 0;
      if (value < 5 && value > 0) {
        showAlert('Warning: Low quantity medication (less than 5)', 'warning');
      }
    });
  }
}

// Make functions available globally
window.createMedication = createMedication;
window.logout = logout;
