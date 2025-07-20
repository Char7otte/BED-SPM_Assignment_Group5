
const apiurl = "http://localhost:3000";
console.log("alert.js loaded");

function decodeJwtPayload(token) {
    const jwt = token.split(" ")[1]; // remove 'Bearer'
    const payloadBase64 = jwt.split(".")[1]; // get payload
    const payloadJson = atob(payloadBase64); // decode base64
    return JSON.parse(payloadJson); // parse to JSON
}

document.addEventListener("DOMContentLoaded", function () {
  const path = window.location.pathname;

  if (path.includes("/alertdetail")) {
    const alertId = new URLSearchParams(window.location.search).get("id");
    fetchAlertDetails(alertId);
  } else if (path.includes("/alertadmin")) {
    const alertId = new URLSearchParams(window.location.search).get("id");
    fetchAlertDetailadmin(alertId);
  } else if (path.includes("/alert")) {
    fetchAlerts();
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
        const response = await fetch(`${apiurl}/alerts/unreadstatus/${userId}`);
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
    const unreadAlertIds = [];
    const isUnread = 1;
    
    const unreadAlerts = await fetchUnreadAlerts(7); // Use user's ID from token
    unreadAlerts.forEach(alert => {
        unreadAlertIds.push(alert.AlertID);
    });

   

    alerts.forEach(alert => {
        
        const alertItem = document.createElement("div");
        alertItem.classList.add("alert-item");
        
        let severityIcon = "";
        if (alert.Severity === "High") severityIcon = "&#x1F6A8;";
        else if (alert.Severity === "Medium") severityIcon = "&#x1F7E1;";
        else if (alert.Severity === "Low") severityIcon = "&#x1F7E2;";

     

        alertItem.innerHTML = `
            <div class="card position-relative">
                <div class="card-header">
                    ${severityIcon} ${alert.Title}
                </div>
                <div class="card-body">
                    <div class="card-title">${''}</div>
                    <p class="card-text">${alert.Message}</p>
                    <a href="alertdetail?id=${alert.AlertID}" class="btn btn-primary bottom1-btn">View Details</a>
                    ${user.role === "A" ? `
                        <a href="alertadmin?id=${alert.AlertID}" class="btn btn-primary bottom1-btn">Edit</a>
                        <a href="#" class="btn btn-primary bottom1-btn">Delete</a>` : ""
                    }
                </div>
                ${
                    user.role === "A"
                    ? `<div style="position: absolute; top: 10px; right: 10px;">
                        <button class="btn btn-danger btn-sm top1-btn acknowledge-btn" data-alertid="${alert.AlertID}" ${unreadAlertIds.includes(alert.AlertID) ? "" : "disabled"}>
                            ${unreadAlertIds.includes(alert.AlertID) ? "Acknowledge" : "Acknowledged"}
                        </button>
                        <button class="btn btn-danger btn-sm top1-btn">Add to Notes</button>
                    </div>` : ""
                }
            </div>`;

        if (user.role === "A" && unreadAlertIds.includes(alert.AlertID)) {
            const ackBtn = alertItem.querySelector('.acknowledge-btn');
            ackBtn.addEventListener('click', async function () {
                try {
                    const token = localStorage.getItem("jwtToken");
                    const res = await fetch(`${apiurl}/alerts/acknowledge/${alert.AlertID}`, {
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
    let unreadAlertIds = [];
    const alertDate = new Date(alert.Date);
    const dateDisplay = isNaN(alertDate.getTime())
  ? "Invalid date"
  : alertDate.toLocaleDateString();
    const user = decodeJwtPayload(localStorage.getItem("token"));

     const unreadAlerts = await fetchUnreadAlerts(7); // Use user's ID from token
    unreadAlerts.forEach(alert => {
        unreadAlertIds.push(alert.AlertID);
    }); 

    const subcon = document.getElementById("subcon");
    subcon.innerHTML = `
        <div class="mb-3"></div>
        <button type="button" class="btn btn-primary me-2" id="addToNotesBtn">Add to Notes</button>
        <button type="button" class="btn btn-success" id="acknowledgeBtn" ${unreadAlertIds.includes(alert.AlertID) ? "" : "disabled"}>
            ${unreadAlertIds.includes(alert.AlertID) ? "Acknowledge" : "Acknowledged"}
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

    // const messsage = document.getElementById("alertDetail");
    // messsage.innerHTML = `
    //     <div class="card-body">
    //         <div class="alert alert-info" role="alert">
    //             ${alert.Message}
    //         </div>
    //     </div>
    // `;

