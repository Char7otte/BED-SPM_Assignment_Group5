function decodeJwtPayload(token) {
    const jwt = token.split(" ")[1]; // remove 'Bearer'
    const payloadBase64 = jwt.split(".")[1]; // get payload
    const payloadJson = atob(payloadBase64); // decode base64
    return JSON.parse(payloadJson); // parse to JSON
}

function isTokenExpired(token) {
    const decoded = decodeJwtPayload(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp < Date.now() / 1000;
}

const token = localStorage.getItem('token');
console.log("Token from localStorage:", token);
if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    window.location.href = '/login'; // Redirect to login
}
// Check for token in cookies if not found in localStorage
if (!localStorage.getItem('token')) {
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
    if (match) {
        localStorage.setItem('token', decodeURIComponent(match[1]));
    } else {
        window.location.href = "/login.html";
    }
}
if (token) {
    const decoded = decodeJwtPayload(token);
    console.log(decoded);
    if (decoded.role === "A") {
        window.location.href = "/adminindex"; // Redirect admin
    }
}

function toggleOtherInput(selectElement) {
    const otherDiv = document.getElementById('other-feature-div');
    otherDiv.style.display = selectElement.value === 'Other' ? 'block' : 'none';
}

// Get references to the form and message elements:
const feedbackForm = document.getElementById("feedback-form");
const messageDiv = document.getElementById("message");
const apiBaseUrl = "http://localhost:3000";

// Check if user is in edit mode based on URL parameters
function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const feedbackId = urlParams.get('id');
    
    if (feedbackId) {
        loadFeedbackForEdit(feedbackId);
        // Update form title and button if elements exist
        const formTitle = document.getElementById('form-title');
        const submitBtn = document.getElementById('submit-btn');
        const feedbackIdInput = document.getElementById('feedback-id');
        
        if (formTitle) formTitle.textContent = 'Edit Feedback';
        if (submitBtn) submitBtn.textContent = 'Update';
        if (feedbackIdInput) feedbackIdInput.value = feedbackId;
    }
}

// Load existing feedback data for editing
async function loadFeedbackForEdit(feedbackId) {
    try {
        // Try to get data from localStorage first (fallback method)
        const storedData = localStorage.getItem('editFeedbackData');
        if (storedData) {
            const feedback = JSON.parse(storedData);
            if (feedback.id == feedbackId) {
                populateForm(feedback);
                localStorage.removeItem('editFeedbackData');
                return;
            }
        }

        // If no stored data, try to fetch from API
        const response = await fetch(`${apiBaseUrl}/feedback/${feedbackId}`);
        
        if (response.ok) {
            const feedback = await response.json();
            populateForm(feedback);
        } else {
            throw new Error(`Failed to load feedback: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
        messageDiv.textContent = 'Error loading feedback data. Please try again or create new feedback.';
        messageDiv.style.color = 'red';
        
        // Redirect back to all feedback page after 3 seconds
        setTimeout(() => {
            window.location.href = '/feedbacks';
        }, 3000);
    }
}

function populateForm(feedback) {
    try {
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
        const featureSelect = document.getElementById('feature');
        const otherFeatureInput = document.getElementById('other-feature');

        // Null checks
        if (titleInput) titleInput.value = feedback.title || '';
        if (descriptionInput) descriptionInput.value = feedback.description || '';
        
        // Handle feature selection 
        if (featureSelect && feedback.feature) {
            const predefinedFeatures = ['Chat', 'Medication Tracker', 'Medical Appointments Calendar', 'Note Taker', 'Alert', 'Weather', 'Feedback', 'Trivia Quiz', 'News'];

            // Check if the feature matches any predefined options
            if (predefinedFeatures.includes(feedback.feature)) {
                featureSelect.value = feedback.feature;
                console.log(`Matched predefined feature: ${feedback.feature}`);
            } else {
                // If it's a custom feature, select "Other" and populate the text input
                featureSelect.value = 'Other';
                if (otherFeatureInput) {
                    otherFeatureInput.value = feedback.feature;
                    toggleOtherInput(featureSelect);
                }
                console.log(`Using custom feature: ${feedback.feature}`);
            }
        }

        console.log('Form populated successfully with feedback data:', feedback);
    } catch (error) {
        console.error('Error populating form:', error);
        messageDiv.textContent = 'Error displaying feedback data';
        messageDiv.style.color = 'red';
    }
}

// Function to create new feedback
async function createFeedback(feedbackData) {
    const response = await fetch(`${apiBaseUrl}/feedback`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
    });
    return response;
}

// Function to update existing feedback
async function updateFeedback(feedbackId, feedbackData) {
    const response = await fetch(`${apiBaseUrl}/feedback/${feedbackId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
    });
    return response;
}

// Main form submission handler
feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default browser form submission

    messageDiv.textContent = ""; // Clear previous messages

    const feedbackIdInput = document.getElementById("feedback-id");
    const titleInput = document.getElementById("title");
    const featureSelect = document.getElementById("feature");
    const otherFeatureInput = document.getElementById("other-feature");
    const descriptionInput = document.getElementById("description");

    const feedbackId = feedbackIdInput ? feedbackIdInput.value : '';

    // Determine the final feature value
    let finalFeature = featureSelect ? featureSelect.value : '';
    if (featureSelect && featureSelect.value === 'Other' && otherFeatureInput && otherFeatureInput.value.trim()) {
        finalFeature = otherFeatureInput.value.trim();
    }

    const feedbackData = {
        title: titleInput ? titleInput.value.trim() : '',
        feature: finalFeature,
        description: descriptionInput ? descriptionInput.value.trim() : '',
    };

    // Basic validation
    if (!feedbackData.title) {
        messageDiv.textContent = "Please enter a title";
        messageDiv.style.color = "red";
        return;
    }

    if (!feedbackData.description) {
        messageDiv.textContent = "Please enter a description";
        messageDiv.style.color = "red";
        return;
    }

    if (descriptionInput && descriptionInput.value.length > 500) {
        messageDiv.textContent = `Description cannot exceed 500 characters. Current: ${descriptionInput.value.length}`;
        messageDiv.style.color = "red";
        return;
    }

    try {
        let response;
        let isUpdate = feedbackId && feedbackId.trim() !== '';
        
        // Show loading state
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = isUpdate ? 'Updating...' : 'Submitting...';
            submitBtn.disabled = true;
        }

        // Determine if this is an update or create operation
        if (isUpdate) {
            response = await updateFeedback(feedbackId, feedbackData);
        } else {
            response = await createFeedback(feedbackData);
        }

        // Check for API response status
        const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json")
            ? await response.json()
            : { message: response.statusText };

        if (response.status === 200 || response.status === 201) {
            const action = isUpdate ? 'updated' : 'created';
            messageDiv.textContent = `Feedback ${action} successfully! ID: ${responseBody.id || feedbackId}`;
            messageDiv.style.color = "green";
            
            if (!isUpdate) {
                feedbackForm.reset(); // Only reset form for new feedback
                // Hide the other feature input if it was shown
                const otherDiv = document.getElementById('other-feature-div');
                if (otherDiv) {
                    otherDiv.style.display = 'none';
                }
            }
            
            console.log(`${isUpdate ? 'Updated' : 'Created'} Feedback:`, responseBody);
            
            // Redirect to feedback list after successful operation
            setTimeout(() => {
                window.location.href = '/feedbacks';
            }, 1000);
            
        } else if (response.status === 400) {
            // Handle validation errors from the API
            messageDiv.textContent = `Validation Error: ${responseBody.message}`;
            messageDiv.style.color = "red";
            console.error("Validation Error:", responseBody);
        } else {
            // Handle other potential API errors
            throw new Error(
                `API error! status: ${response.status}, message: ${responseBody.message}`
            );
        }
    } catch (error) {
        console.error("Error submitting feedback:", error);
        messageDiv.textContent = `Failed to submit feedback: ${error.message}`;
        messageDiv.style.color = "red";
    } finally {
        // Reset button state
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Submit';
            submitBtn.disabled = false;
        }
    }
});

// Add event listener for real-time validation
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is in edit mode
    checkEditMode();
    
    const titleInput = document.getElementById("title");
    const descriptionInput = document.getElementById("description");

    // Real-time validation for title
    if (titleInput) {
        titleInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#ced4da';
            }
        });
    }

    // Real-time validation for description
    if (descriptionInput) {
        descriptionInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#ced4da';
            }
        });
    }

    const messageDiv = document.getElementById("message");

    // Create and insert a character counter element for real-time counting
    let charCounter = document.createElement('div');
    charCounter.id = 'description-char-counter';
    charCounter.style.fontSize = '0.9em';
    charCounter.style.color = '#666';
    if (descriptionInput && descriptionInput.parentNode) {
        descriptionInput.parentNode.insertBefore(charCounter, descriptionInput.nextSibling);
    }

    function updateCharCounter() {
        const len = descriptionInput.value.length;
        charCounter.textContent = `${len}/500 characters`;
        if (len > 500) {
            charCounter.style.color = 'red';
            messageDiv.textContent = `Description cannot exceed 500 characters. Current: ${len}`;
            messageDiv.style.color = 'red';
        } else {
            charCounter.style.color = '#666';
            messageDiv.textContent = '';
        }
    }

    if (descriptionInput) {
        descriptionInput.addEventListener('input', updateCharCounter);
        updateCharCounter();
    }
});
