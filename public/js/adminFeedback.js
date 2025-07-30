const feedbackDiv = document.getElementById("feedback");
const messageDiv = document.getElementById("message");
const apiBaseUrl = "http://localhost:3000";

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
    if (decoded.role !== "A") {
        window.location.href = "/dashboard"; // Redirect non-admin
    }
}

// Global variable to store all feedback data for filtering
let allFeedbackData = [];

// Function to filter feedback based on search criteria
function filterFeedback() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredData = allFeedbackData.filter(feedback => {
        // Search in title only
        const matchesSearch = !searchTerm || 
            feedback.title.toLowerCase().includes(searchTerm);
        
        // Filter by status (using normalized status)
        const normalizedStatus = getNormalizedStatus(feedback.status);
        const matchesStatus = !statusFilter || normalizedStatus === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    // Update search results count
    const searchResults = document.getElementById('searchResults');
    if (searchTerm || statusFilter) {
        searchResults.textContent = `Showing ${filteredData.length} of ${allFeedbackData.length} feedback items`;
    } else {
        searchResults.textContent = '';
    }
    
    // Display filtered results
    displayFeedbackItems(filteredData);
}

// Function to get normalized status (only Pending or Reviewed)
function getNormalizedStatus(status) {
    // Convert status to proper case and ensure only valid statuses
    if (!status) return 'Pending';
    
    const normalizedStatus = status.trim();
    if (normalizedStatus === 'Reviewed' || normalizedStatus === 'reviewed') {
        return 'Reviewed';
    }
    
    // Default to Pending for any other status
    return 'Pending';
}

// Function to get status badge class
function getStatusBadgeClass(status) {
    const normalizedStatus = getNormalizedStatus(status);
    return normalizedStatus === 'Reviewed' ? 'success' : 'warning';
}

// Function to display feedback items
function displayFeedbackItems(feedbackList) {
    // Clear previous content
    feedbackDiv.innerHTML = "";

    if (!feedbackList || feedbackList.length === 0) {
        const noFeedbackDiv = document.createElement("div");
        const hasFilters = document.getElementById('searchInput').value || 
                          document.getElementById('statusFilter').value;
        
        if (hasFilters) {
            noFeedbackDiv.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> 
                    No feedback found matching your search criteria. Try adjusting your filters.
                </div>
            `;
        } else {
            noFeedbackDiv.innerHTML = "<p>No feedback found.</p>";
        }
        feedbackDiv.appendChild(noFeedbackDiv);
    } else {
        // Create a container for all feedback items
        const feedbackContainer = document.createElement("div");
        feedbackContainer.classList.add("feedback-container");

        feedbackList.forEach(feedback => {
            const feedbackElement = document.createElement("div");
            feedbackElement.classList.add("feedback-item", "card", "mb-3", "p-3");
            feedbackElement.setAttribute("data-feedback-id", feedback.id);

            let formattedDate = feedback.DateOfCreation;
            if (formattedDate) {
                try {
                    let date;
                    
                    // Handle different date formats
                    if (typeof formattedDate === 'string') {
                        date = new Date(formattedDate);
                    } else if (typeof formattedDate === 'number') {
                        if (formattedDate.toString().length === 10) {
                            date = new Date(formattedDate * 1000);
                        } else {
                            date = new Date(formattedDate);
                        }
                    } else {
                        date = new Date(formattedDate);
                    }
                    
                    if (!isNaN(date.getTime())) {
                        formattedDate = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    } else {
                        formattedDate = 'Invalid date';
                    }
                } catch (dateError) {
                    console.error('Date parsing error:', dateError);
                    formattedDate = 'Date error';
                }
            }
            
            // Highlight search terms in title
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            let highlightedTitle = feedback.title;
            
            if (searchTerm) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                highlightedTitle = feedback.title.replace(regex, '<mark>$1</mark>');
            }
            
            // Create the feedback item HTML
            feedbackElement.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${highlightedTitle}</h5>
                    <p class="card-text">
                        <strong>Feature:</strong> ${feedback.feature}<br>
                        <strong>Description:</strong> ${feedback.description}<br>
                        <strong>Status:</strong> 
                        <select class="form-control d-inline-block" style="width: auto; display: inline-block;" 
                                onchange="updateFeedbackStatus(${feedback.id}, this.value)">
                            <option value="Pending" ${getNormalizedStatus(feedback.status) === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Reviewed" ${getNormalizedStatus(feedback.status) === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
                        </select><br>
                        <strong>Created at:</strong> ${formattedDate}
                    </p>
                    <div class="btn-group" role="group">
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${feedback.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            feedbackContainer.appendChild(feedbackElement);
        });

        feedbackDiv.appendChild(feedbackContainer);

        // Add event listeners for delete buttons after they are added to the DOM
        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", handleDeleteClick);
        });
    }
}

// Function to update feedback status
async function updateFeedbackStatus(feedbackId, newStatus) {
    try {
        const response = await fetch(`${apiBaseUrl}/feedback/admin/${feedbackId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const errorBody = response.headers
                .get("content-type")
                ?.includes("application/json")
                ? await response.json()
                : { message: response.statusText };
            throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorBody.message}`
            );
        }

        // Update the local data
        const feedbackIndex = allFeedbackData.findIndex(f => f.id === feedbackId);
        if (feedbackIndex !== -1) {
            allFeedbackData[feedbackIndex].status = newStatus;
        }

        // Show success message
        messageDiv.textContent = `Feedback status updated to ${newStatus} successfully.`;
        messageDiv.style.color = "green";

        // Hide the success message after 3 seconds
        setTimeout(() => {
            messageDiv.textContent = "";
        }, 3000);

        // Re-apply current filters to refresh the display
        filterFeedback();

    } catch (error) {
        console.error("Error updating feedback status:", error);
        messageDiv.textContent = `Failed to update status: ${error.message}`;
        messageDiv.style.color = "red";
        
        // Reset the dropdown to previous value
        fetchAllFeedback();
    }
}

// Function to fetch all feedback from the API and display them
async function fetchAllFeedback() {
    try {
        feedbackDiv.innerHTML = "Loading all feedback..."; // Show loading state
        messageDiv.textContent = ""; // Clear any previous messages

        // Make a GET request to your API endpoint for all feedback
        const response = await fetch(`${apiBaseUrl}/feedback/admin`);

        if (!response.ok) {
            const errorBody = response.headers
                .get("content-type")
                ?.includes("application/json")
                ? await response.json()
                : { message: response.statusText };
            throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorBody.message}`
            );
        }

        // Parse the JSON response
        const feedbackList = await response.json();
        console.log("Fetched All Feedback:", feedbackList);

        // Store data globally for filtering
        allFeedbackData = feedbackList;

        // Display all feedback initially
        displayFeedbackItems(feedbackList);
    }
    catch (error) {
        console.error("Error fetching all feedback:", error);
        feedbackDiv.innerHTML = `<p style="color: red;">Failed to load feedback: ${error.message}</p>`;
    }
}

// Function to clear all filters
function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('searchResults').textContent = '';
    displayFeedbackItems(allFeedbackData);
}

// Function to handle delete button clicks
function handleDeleteClick(event) {
    const feedbackId = event.target.closest('.delete-btn').getAttribute("data-id");
    console.log("Attempting to delete feedback with ID:", feedbackId);

    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete feedback with ID ${feedbackId}?`)) {
        return;
    }

    // Show loading state on the delete button
    const deleteButton = event.target.closest('.delete-btn');
    const originalText = deleteButton.innerHTML;
    deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteButton.disabled = true;

    fetch(`${apiBaseUrl}/feedback/admin/${feedbackId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(async (response) => {
        let responseBody = {};
        
        // Try to parse response body if it exists
        try {
            if (response.headers.get("content-type")?.includes("application/json")) {
                responseBody = await response.json();
            }
        } catch (e) {
            // Response might be empty for successful deletes
            responseBody = { message: response.statusText };
        }

        if (response.ok) {
            // Handle success (204 No Content or 200 OK)
            messageDiv.textContent = `Feedback with ID ${feedbackId} deleted successfully.`;
            messageDiv.style.color = "green";
            
            // Remove from global data array
            allFeedbackData = allFeedbackData.filter(feedback => feedback.id != feedbackId);
            
            // Re-apply current filters
            filterFeedback();

            // Hide the success message after 3 seconds
            setTimeout(() => {
                messageDiv.textContent = "";
            }, 3000);

        } else if (response.status === 404) {
            // Handle 404 Not Found
            messageDiv.textContent = `Feedback with ID ${feedbackId} not found.`;
            messageDiv.style.color = "red";
            console.error("Not Found Error:", responseBody);
        
        } else {
            // Handle 500 Internal Server Error or other errors
            throw new Error(
                `API error! status: ${response.status}, message: ${responseBody.message || 'Unknown error'}`
            );
        }
    })
    .catch((error) => {
        console.error("Error deleting feedback:", error);
        messageDiv.textContent = `Failed to delete feedback: ${error.message}`;
        messageDiv.style.color = "red";
    })
    .finally(() => {
        // Reset button state
        deleteButton.innerHTML = originalText;
        deleteButton.disabled = false;
    });
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page loaded, fetching all feedback...");
    fetchAllFeedback();
    
    // Add event listeners for search and filter functionality
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    // Real-time search with debouncing
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterFeedback, 300); // 300ms delay
    });
    
    // Filter on dropdown changes
    statusFilter.addEventListener('change', filterFeedback);
    
    // Clear filters button
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
});