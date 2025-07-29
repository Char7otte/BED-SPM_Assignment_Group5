
const apiurl = "http://localhost:3000";
console.log("alert.js loaded");

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
        window.location.href = "/login";
    }
}



document.addEventListener("DOMContentLoaded", function () {
  const path = window.location.pathname;
   
  if (path.includes("/alertdetail")) {
    const alertId = new URLSearchParams(window.location.search).get("id");
    fetchAlertDetails(alertId);
  } else if (path.includes("/alertadmin")) {
    const alertId = new URLSearchParams(window.location.search).get("id");
    if (alertId) {
      fetchAlertDetailadmin(alertId);
    } else {
      // If no alertId is provided, fetch all alerts
      createAlert();
    }
    fetchAlertDetailadmin(alertId);
  } else if (path.includes("/alert")) {
    fetchAlerts();
    const user = decodeJwtPayload(localStorage.getItem("token"));
    if (user && user.role === "A") {
        // Create floating add button
        const addBtn = document.createElement("button");
        addBtn.innerHTML = "+";
        addBtn.title = "Add Alert";
        addBtn.style.position = "fixed";
        addBtn.style.bottom = "30px";
        addBtn.style.right = "30px";
        addBtn.style.width = "60px";
        addBtn.style.height = "60px";
        addBtn.style.borderRadius = "50%";
        addBtn.style.backgroundColor = "#007bff";
        addBtn.style.color = "#fff";
        addBtn.style.fontSize = "2rem";
        addBtn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
        addBtn.style.zIndex = "9999";
        addBtn.style.border = "none";
        addBtn.style.cursor = "pointer";
        addBtn.onclick = function () {
            window.location.href = "/alertadmin";
        };
        document.body.appendChild(addBtn);
    }
  }
});




async function fetchAlerts() {
    try {
        const response = await fetch(`${apiurl}/alerts`);
        if (!response.ok) {
            const token = localStorage.getItem("jwtToken");
            const response = await fetch(`${apiurl}/alerts`, {
                headers: {
                    "Authorization": token
                }
            });
            
            const errorBody = response.headers
                .get("content-type")
                ?.includes("application/json")
                ? await response.json()
                : { message: response.statusText };    throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorBody.message}`
      );
        } 

       const alerts = await response.json();
        await displayAlerts(alerts);
    }
    catch (error) {
        console.error("Error fetching alerts:", error);
        document.getElementById("alert-box").innerHTML = `<p style="color: red;">Failed to load alerts: ${error.message}</p>`;
    }
}
async function fetchUnreadAlerts(userId) {
    try {
        const response = await fetch(`${apiurl}/alerts/readstatus/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const unreadAlerts = await response.json();
        return unreadAlerts; // ✅ fixed
    } catch (error) {
        console.error("Error fetching unread alerts:", error);
        return [];
    }
}


async function displayAlerts(alerts) {
    const alertsList = document.getElementById("alert-box");
    const user = decodeJwtPayload(localStorage.getItem("token"));
    alertsList.innerHTML = "";
    const readAlertIds = [];
    const isUnread = 1;
    
    const readAlerts = await fetchUnreadAlerts(user.id); // Use user's ID from token
    readAlerts.forEach(alert => {
        console.log(alert);
        if (alert.ReadStatus == 0) {
             console.log("Unread alert found:", alert.AlertID);
        }else {
            readAlertIds.push(alert.AlertID);
        }
    });

   

    alerts.forEach(alert => {
        
        const alertItem = document.createElement("div");
        alertItem.classList.add("alert-item");
        console.log("Alert item:", alert);
        let severityIcon = "";
        if (alert.status === "Deleted") severityIcon = '&#x1F5D1; &#10060;'; 
        else if (alert.Severity === "High") severityIcon = "&#x1F6A8;";
        else if (alert.Severity === "Medium") severityIcon = "&#x1F7E1;";
        else if (alert.Severity === "Low") severityIcon = "&#x1F7E2;"
         // Use caution sign for critical
        if (alert.status === "Deleted" && user.role === "U") {
            return; // Skip rendering this alert
        }


     

        alertItem.innerHTML = `
            <div class="card position-relative">
                <div class="card-header">
                    ${severityIcon} ${alert.Title}
                </div>
                <div class="card-body">
                    <div class="card-title">${''}</div>
                    <p class="card-text">${alert.Message}</p>
                    <a href="alertdetail?id=${alert.AlertID}" class="btn btn-primary bottom1-btn">View Details</a>
                    ${
                        user.role === "A"
                        ? `
                            <a href="alertadmin?id=${alert.AlertID}" class="btn btn-primary bottom1-btn">Edit</a>
                            ${
                                alert.status !== "Deleted"
                                ? `<a href="#" class="btn btn-danger bottom1-btn" onclick="handleDelete(${alert.AlertID})">Delete</a>`
                                : `<a href="#" class="btn btn-primary bottom1-btn disabled">Deleted</a>`
                            }
                        `
                        : ""
                    }
                </div>
                ${
                    user.role === "U"
                    ? `<div style="position: absolute; top: 10px; right: 10px;">
                        <button class="btn btn-danger btn-sm top1-btn acknowledge-btn" onclick="handleAcknowledge(${alert.AlertID})" data-alertid="${alert.AlertID}" 
                            ${readAlertIds.includes(alert.AlertID) ? "disabled" : ""}>
                            ${readAlertIds.includes(alert.AlertID) ? "Acknowledged" : "Acknowledge"}
                        </button>
                        <button class="btn btn-danger btn-sm top1-btn">Add to Notes</button> 
                    </div>`
                    : ""
                }
            </div>`;

        if (user.role === "U" && readAlertIds.includes(alert.AlertID)) {
            const ackBtn = alertItem.querySelector('.acknowledge-btn');
            ackBtn.addEventListener('click', async function () {
                try {
                    const token = localStorage.getItem("jwtToken");
                    console.log("Acknowledging alert with ID:", alert.AlertID);
                    const res = await fetch(`${apiurl}/alerts/updatestatus?id=${alert.AlertID}`, {
                        method: "POST",
                        headers: {
                            "Authorization": token,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId: user.id })
                    });
                    if (res.ok) {
                        ackBtn.disabled = true;
                        ackBtn.textContent = "Acknowledged";
                    }
                } catch (err) {
                    alert("Failed to acknowledge alert.");
                }
            });
        }    alertsList.appendChild(alertItem);
    });
}


async function fetchAlertDetails(alertId) {
    try {
        const response = await fetch(`${apiurl}/alerts/${alertId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const alert = await response.json();
        console.log(alert);
        displayAlertDetails(alert);
    } catch (error) {
        console.error("Error fetching alert details:", error);
        document.getElementById("alertDetail").innerHTML = `<p style="color: red;">Failed to load alert details: ${error.message}</p>`;
    }
}

async function displayAlertDetails(alert) {
    let readAlertIds = [];
    const alertDate = new Date(alert.Date);
    const dateDisplay = isNaN(alertDate.getTime())
  ? "Invalid date"
  : alertDate.toLocaleDateString();
    const user = decodeJwtPayload(localStorage.getItem("token"));

     const readAlerts = await fetchUnreadAlerts(user.id); // Use user's ID from token
     console.log("Read alerts:", readAlerts);
    readAlerts.forEach(alert => {
        console.log(alert);
        if (alert.ReadStatus == 0) {
             console.log("Unread alert found:", alert.AlertID);
        }else {
            readAlertIds.push(alert.AlertID);
        }
    });

    const subcon = document.getElementById("subcon");
    subcon.innerHTML = `
        <div class="mb-3"></div>
        <button type="button" class="btn btn-primary me-2" id="addToNotesBtn">Add to Notes</button>
        <button 
    type="button" 
    class="btn btn-success" 
    id="acknowledgeBtn"
    onclick="handleAcknowledge(${alert.AlertID})"
    ${user.role === "U" ? "" : "disabled"}
    ${readAlertIds.includes(alert.AlertID) ? "disabled" : ""}>
    ${readAlertIds.includes(alert.AlertID) ? "Acknowledged" : "Acknowledge"}
  </button>
        
    `;

    const alertDetail = document.getElementById("alertDetail");
    alertDetail.innerHTML = `
        <div class="card-body">
            <h2 id="alertTitle" class="card-title">${alert.Title}</h2>
            <p class="mb-1"><strong>Date:</strong> <span id="alertDate">${dateDisplay}</span></p>


            <p class="mb-1"><strong>Category:</strong> <span id="alertCategory">${alert.Category}</span></p>
            <p class="mb-1"><strong>Severity:</strong> <span id="alertSeverity">${alert.Severity}</span></p>
        </div>
    `;
    const messsage = document.getElementById("alertDetails");
    messsage.innerHTML = `
        <div class="card-body">
            <div class="alert alert-info" role="alert">
                ${alert.Message}
            </div>
        </div>
    `;
}

async function fetchAlertDetailadmin(alertId) {
    try {
        const response = await fetch(`${apiurl}/alerts/${alertId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const alert = await response.json();
        displayAlertDetailadmin(alert);
    } catch (error) {
        console.error("Error fetching alert details:", error);
        document.getElementById("alertDetail").innerHTML = `<p style="color: red;">Failed to load alert details: ${error.message}</p>`;
    }
}

async function displayAlertDetailadmin(alert) {
    const alertDate = new Date(alert.Date);
    const dateDisplay = isNaN(alertDate.getTime())
        ? "Invalid date"
        : alertDate.toLocaleDateString();

    const alertDetail = document.getElementById("alertDetails");
    alertDetail.innerHTML = `
        <form id="admin-alert-form" class="p-4 border rounded bg-light">
            <div class="mb-3">
                <label for="admin-title" class="form-label">Title</label>
                <input type="text" class="form-control" id="admin-title" name="title" placeholder="Edit title" value="${alert.Title}">
            </div>
            <div class="mb-3">
                <label for="admin-category" class="form-label">Category</label>
                <input type="text" class="form-control" id="admin-category" name="category" placeholder="Edit category" value="${alert.Category}">
            </div>
            <div class="mb-3">
                <label for="admin-message" class="form-label">Message</label>
                <textarea class="form-control" id="admin-message" name="message" rows="3" placeholder="Edit alert message">${alert.Message}</textarea>
            </div>
            
            <div class="mb-3">
                <label for="admin-severity" class="form-label">Severity</label>
                <select class="form-select" id="admin-severity" name="severity">
                    <option value="">Select severity</option>
                    <option value="Low" ${alert.Severity === "Low" ? "selected" : ""}>Low</option>
                    <option value="Medium" ${alert.Severity === "Medium" ? "selected" : ""}>Medium</option>
                    <option value="High" ${alert.Severity === "High" ? "selected" : ""}>High</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary bottom1-btn" onclick="handleSubmit(event, ${alert.AlertID})">Save Changes</button>
        </form>
    `;
}
    async function handleSubmit(event, alertId) {
        event.preventDefault();
        const title = document.getElementById("admin-title").value;
        const category = document.getElementById("admin-category").value;
        const message = document.getElementById("admin-message").value;
        const severity = document.getElementById("admin-severity").value;
        const updatedAlert = {
            Title: title,
            Category: category,
            Message: message,
            Severity: severity
        };
        const token = localStorage.getItem("jwtToken");
        const response = await fetch(`${apiurl}/alerts/${alertId}`, {
            method: "PUT",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedAlert)
        });
        const result = await response.json();
        if (response.ok) {
            // Update successful
            alert("Alert updated successfully");
        } else {
            // Update failed
            alert(`Failed to update alert: ${result.message}`);
        }
    }

    function createAlert() {
        const alertDetail = document.getElementById("alertDetails");
    alertDetail.innerHTML = `
        <form id="admin-alert-form" class="p-4 border rounded bg-light">
            <div class="mb-3">
                <label for="admin-title" class="form-label">Title</label>
                <input type="text" class="form-control" id="admin-title" name="title" placeholder="Edit title" value="title">
            </div>
            <div class="mb-3">
                <label for="admin-category" class="form-label">Category</label>
                <input type="text" class="form-control" id="admin-category" name="category" placeholder="Edit category" value="category">
            </div>
            <div class="mb-3">
                <label for="admin-message" class="form-label">Message</label>
                <textarea class="form-control" id="admin-message" name="message" rows="3" placeholder="Edit alert message">message</textarea>
            </div>
            
            <div class="mb-3">
                <label for="admin-severity" class="form-label">Severity</label>
                <select class="form-select" id="admin-severity" name="severity">
                    <option value="">Select severity</option>
                    <option value="Low" ${alert.Severity === "Low" ? "selected" : ""}>Low</option>
                    <option value="Medium" ${alert.Severity === "Medium" ? "selected" : ""}>Medium</option>
                    <option value="High" ${alert.Severity === "High" ? "selected" : ""}>High</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary bottom1-btn" onclick="handleCreate()">Save Changes</button>
        </form>
    `;
    }

    async function handleCreate() {
    const title = document.getElementById("admin-title").value;
    const category = document.getElementById("admin-category").value;
    const message = document.getElementById("admin-message").value;
    const severity = document.getElementById("admin-severity").value;

    const newAlert = {
        Title: title,
        Category: category,
        Message: message,
        Severity: severity
    };

    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${apiurl}/alerts`, {
        method: "POST",
        headers: {
            "Authorization": token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newAlert)
    });
    const result = await response.json();
    if (response.ok) {
        // Creation successful
        alert("Alert created successfully");
    } else {
        // Creation failed
        alert(`Failed to create alert: ${result.message}`);
    }
}

async function handleDelete(alertId) {
    if (confirm("Are you sure you want to delete this alert?")) {
        try {
            const token = localStorage.getItem("jwtToken");
            const response = await fetch(`${apiurl}/alerts/delete/${alertId}`, {
                method: "PUT",
                headers: {
                    "Authorization": token,
                    "Content-Type": "application/json"
                }
            });
            if (response.ok) {
                alert("Alert deleted successfully");
                window.location.href = "/alert"; // Redirect to the alerts page
            } else {
                const errorBody = await response.json();
                throw new Error(`Failed to delete alert: ${errorBody.message}`);
            }
        } catch (error) {
            console.error("Error deleting alert:", error);
            alert(`Error deleting alert: ${error.message}`);
        }
    }
}


async function handleSearch(event) {
    event.preventDefault(); // Prevent form submission
    let alerts = [];
   
    const searchInput = document.getElementById("searchInput").value.trim();
    if (!searchInput) {
        alert("Please enter a search term.");
        return;
    }

    try {
        const response = await fetch(`${apiurl}/alerts/search?title=${searchInput}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        alerts = await response.json();
        const response2 = await fetch(`${apiurl}/alerts/search?category=${searchInput}`);
        if (!response2.ok) {
            throw new Error(`HTTP error! status: ${response2.status}`);
        }
        alerts2 = await response2.json();

        if (alert2.AlertID !== alert.AlertID) {
            alerts.push(alert2);
        }

         

    } catch (error) {
        console.error("Error searching alerts:", error);
        document.getElementById("alert-box").innerHTML = `<p style="color: red;">Failed to search alerts: ${error.message}</p>`;
    }
    
    await displayAlerts(alerts);
    return;
   
        
}

function handleAcknowledge(alertId) {
    const user = decodeJwtPayload(localStorage.getItem("token"));
    if (user.role !== "U") {
        alert("You do not have permission to acknowledge alerts.");
        return;
    }

    fetch(`${apiurl}/alerts/updatestatus/${alertId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": localStorage.getItem("jwtToken")
        },
        body: JSON.stringify({ userId:  user.id }) // Use user's ID from token
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert("Alert acknowledged successfully");
        window.location.reload(); // Reload the page to reflect changes
    })
    .catch(error => {
        console.error("Error acknowledging alert:", error);
        alert(`Failed to acknowledge alert: ${error.message}`);
    });
}


