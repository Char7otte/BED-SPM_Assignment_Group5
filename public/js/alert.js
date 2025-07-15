const apiurl = "http://localhost:3000"; // Replace with your API URL
const token = localStorage.getItem("jwtToken");

// function getAuthHeaders() {
//     return token ? { "Authorization": `Bearer ${token}` } : {};
// }

const tempTokenA = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6IlUiLCJ1c2VybmFtZSI6InVzZXIyIiwiaWF0IjoxNzUyNTAxNDAyLCJleHAiOjE3NTI1MDUwMDJ9.qsWefU3PEbJiRX5_v_v230TIqCJ0vHxAuFrL-nvJ4b0';
const tempTokenU = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6IlUiLCJ1c2VybmFtZSI6InVzZXIyIiwiaWF0IjoxNzUyNTAxNDAyLCJleHAiOjE3NTI1MDUwMDJ9.qsWefU3PEbJiRX5_v_v230TIqCJ0vHxAuFrL-nvJ4b0';


function decodeJwtPayload(token) {
    const jwt = token.split(" ")[1]; // remove 'Bearer'
    const payloadBase64 = jwt.split(".")[1]; // get payload
    const payloadJson = atob(payloadBase64); // decode base64
    return JSON.parse(payloadJson); // parse to JSON
}

document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('alert.html')) {
    fetchAlerts();
  } else if (window.location.pathname.includes('alertdetail.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const alertId = urlParams.get('id');
    if (alertId) {
      fetchAlert(alertId);
    } else {
      document.getElementById("alertDetails").innerHTML = "<p>No alert ID provided.</p>";
    }
  } else if (window.location.pathname.includes('alertadmin.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const alertId = urlParams.get('id');
    if (!alertId) {
        createAlertP();
    } else {
        fetchAlertDetail();
    }
  }
});

async function fetchAlerts() {
    try {
        const response = await fetch(`${apiurl}/alerts`);
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

       const alerts = await response.json();
        displayAlerts(alerts);
    }
    catch (error) {
        console.error("Error fetching alerts:", error);
        document.getElementById("alertsList").innerHTML = `<p style="color: red;">Failed to load alerts: ${error.message}</p>`;
    }
}

async function fetchAlertUnreadStatus(alertId) {
    try {
        const response = await fetch(`${apiurl}/alerts/unreadstatus/${alertId}`);
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
        const unreadStat = await response.json();
        const unreadStatus = [unreadStat].find(alert => alert.AlertID === alertId);
        return unreadStatus;
    } catch (error) {
        console.error("Error fetching alert read status:", error);
        throw error;
    }
}

displayAlerts = (alerts) => {
    const alertsList = document.getElementById("alerts");
    alertsList.innerHTML = ""; // Clear previous content
    if (alerts.length === 0) {
        alertsList.innerHTML = "<p>No alerts found.</p>";
        return;
    }

    // Get user role from token
    let userRole = "U";
    try {
        const payload = decodeJwtPayload(token || tempTokenA);
        userRole = payload.role || "U";
    } catch (e) {
        // fallback to U
    }

    alerts.forEach(alert => {
        const alertElement = document.createElement("div");
        alertElement.classList.add("alert-item");
        // Set color based on severity
        let severityColor;
        switch (alert.Severity?.toLowerCase()) {
            case "high":
                severityColor = "#ffcccc"; // light red
                break;
            case "medium":
                severityColor = "#fff8b0"; // light yellow
                break;
            case "low":
                severityColor = "#d4f7d4"; // light green
                break;
            default:
                severityColor = "#f0f0f0"; // default grey
        }

        alertElement.style.backgroundColor = severityColor;
        // Check unread status for user (async)
        let isUnread = false;
        fetchAlertUnreadStatus(alert.AlertID)
        .then(unreadStatus => {
            isUnread = unreadStatus && unreadStatus.ReadStatus === 0;
            
            alertElement.innerHTML = `  
            <h3>${alert.Title}</h3>
            <p>Category: ${alert.Category}</p>
            <p>Message: ${alert.Message}</p>
            <p>Date: ${new Date(alert.Date).toLocaleDateString()}</p>
            <p>Severity: ${alert.Severity}</p>
            <button onclick="viewAlertDetails(${alert.AlertID})">View Details</button>
            ${
                userRole === "A"
                ? `<button onclick="editAlert(${alert.AlertID})">Edit</button>
                   <button class="delete-btn" data-id="${alert.AlertID}">Delete</button>`
                : isUnread
                ? `<button onclick="markAlertAsRead(${alert.AlertID})">Mark as Read</button>`
                : `<button disabled style="opacity:0.5;">Already Read</button>`
            }
            `;
        });
        alertsList.appendChild(alertElement);
    });

    // Add event listeners for delete buttons after they are added to the DOM (admin only)
    // Add "Add Alert" button for admin
    if (userRole === "A") {
        // Add button at the top of the alerts list
        const addBtn = document.createElement("button");
        addBtn.textContent = "Add Alert";
        addBtn.style.height = "100px";
        addBtn.style.width = "100%";
        addBtn.style.fontSize = "1.5em";
        addBtn.style.marginBottom = "20px";
        addBtn.onclick = function () {
            window.location.href = "/alertadmin.html";
        };
        alertsList.prepend(addBtn);

        // Add event listeners for edit and delete buttons
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async () => {
                const alertId = button.getAttribute("data-id");
                if (confirm("Are you sure you want to delete this alert?")) {
                    await deleteAlert(alertId);
                }
            });
        });
        document.querySelectorAll("button[onclick^='editAlert']").forEach(button => {
            button.addEventListener("click", function () {
                const alertId = button.getAttribute("onclick").match(/\d+/)[0];
                editAlert(alertId);
            });
        });
    }
    }


async function deleteAlert(alertId) {
    try {
        const response = await fetch(`${apiurl}/alerts/${alertId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || tempTokenA
            }
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

        alert("Alert deleted successfully");
        fetchAlerts(); // Refresh the list
    } catch (error) {
        console.error("Error deleting alert:", error);
        alert(`Failed to delete alert: ${error.message}`);
    }
}
async function viewAlertDetails(alertId) {
    window.location.href = `/alertdetail.html?id=${alertId}`;
}

async function fetchAlert(alertId) {
    try {
        const response = await fetch(`${apiurl}/alerts/${alertId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || tempTokenA
            }
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

        const alert = await response.json();
        displayAlertDetails(alert);
    } catch (error) {
        console.error("Error fetching alert:", error);
        alert(`Failed to fetch alert: ${error.message}`);
    }
}

function displayAlertDetails(alert) {
    const alertDetails = document.getElementById("alertDetails");
    alertDetails.innerHTML = `
        <h3>${alert.Title}</h3>
        <p>Category: ${alert.Category}</p>
        <p>Message: ${alert.Message}</p>
        <p>Date: ${new Date(alert.Date).toLocaleDateString()}</p>
        <p>Severity: ${alert.Severity}</p>
    `;
} 

function editAlert(alertId) {
    console.log("Editing alert with ID:", alertId);
    window.location.href = `/alertadmin.html?id=${alertId}`;
}

async function fetchAlertDetail() {
    console.log("fetechdeaidlddd")
    const urlParams = new URLSearchParams(window.location.search);
    const alertId = urlParams.get('id');
    if (alertId) {
        try {
            const response = await fetch(`${apiurl}/alerts/${alertId}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token || tempTokenA
                }
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

            const alert = await response.json();
            displayAlertDetailsInplaceholder(alert);
        } catch (error) {
            console.error("Error fetching alert details:", error);
            document.getElementById("alertDetails").innerHTML = `<p style="color: red;">Failed to load alert details: ${error.message}</p>`;
        }
    } else {
        document.getElementById("alertDetails").innerHTML = "<p>No alert ID provided.</p>";
    }
}

async function displayAlertDetailsInplaceholder(alert) {
    const alertDetails = document.getElementById("alertDetails");

    const urlParams = new URLSearchParams(window.location.search);
    const alertId = urlParams.get('id');

    alertDetails.innerHTML = `
        <form id="alertForm">
            <label for="admin-title">Title:</label>
            <input type="text" id="admin-title" name="title" placeholder="Edit alert title" value="${alert.Title}">

            <label for="admin-category">Category:</label>
            <input type="text" id="admin-category" name="category" placeholder="Edit category" value="${alert.Category}">

            <label for="admin-message">Message:</label>
            <textarea id="admin-message" name="message" placeholder="Edit alert message">${alert.Message}</textarea>

            <label for="admin-severity">Severity:</label>
            <select id="admin-severity" name="severity">
                <option value="">Select severity</option>
                <option value="Low" ${alert.Severity === "Low" ? "selected" : ""}>Low</option>
                <option value="Medium" ${alert.Severity === "Medium" ? "selected" : ""}>Medium</option>
                <option value="High" ${alert.Severity === "High" ? "selected" : ""}>High</option>
            </select>
            <input type="hidden" id="id" name="id" value="${alert.AlertID}">
            <button type="submit">Save Changes</button>
        </form>
    `;

    // Attach submit handler to store data in body (AJAX PUT)
    document.getElementById("alertDetails").addEventListener("submit", function (e) {
        console.log("Submitting form to update alert");
        e.preventDefault();
        updateAlert(alertId);
    });
    // updateAlert(alertId);
    // Show the alert ID in the form (for reference)
    // Attach submit handler to prevent refresh and update
    // document.getElementById("alertForm").addEventListener("submit", function (e) {
    //     e.preventDefault(); //  Prevent default form refresh
    //      // Call your PUT function
    // });
}

async function updateAlert(alertId) {
    console.log("Updating alert with ID:", alertId);

    const title = document.getElementById("admin-title").value;
    const category = document.getElementById("admin-category").value;
    const message = document.getElementById("admin-message").value;
    const severity = document.getElementById("admin-severity").value;

    if (!title || !category || !message || !severity) {
        alert("All fields are required.");
        return;
    }

    const alertData = {
        Title: title,
        Category: category,
        Message: message,
        Severity: severity
    };

    try {
        const response = await fetch(`${apiurl}/alerts/${alertId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || tempTokenA
            },
            body: JSON.stringify(alertData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update alert");
        }

        alert("Alert updated successfully");
    } catch (error) {
        console.error("Error updating alert:", error);
        alert("Error updating alert: " + error.message);
    }
}


function createAlertP() {
    const alertDetails = document.getElementById("alertDetails");
    alertDetails.innerHTML = `
        <form id="alertForm">
            <label for="admin-title">Title:</label>
            <input type="text" id="admin-title" name="title" placeholder="Enter alert title">

            <label for="admin-category">Category:</label>
            <input type="text" id="admin-category" name="category" placeholder="Enter category">

            <label for="admin-message">Message:</label>
            <textarea id="admin-message" name="message" placeholder="Enter alert message"></textarea>

            <label for="admin-severity">Severity:</label>
            <select id="admin-severity" name="severity">
                <option value="">Select severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </select>

            <button type="submit">Create Alert</button>
        </form>
    `;

    document.getElementById("alertDetails").addEventListener("submit", function (e) {
        e.preventDefault();

        createAlert();
    });
}

async function createAlert() {
    const title = document.getElementById("admin-title").value;
    const category = document.getElementById("admin-category").value;
    const message = document.getElementById("admin-message").value;
    const severity = document.getElementById("admin-severity").value;
    if (!title || !category || !message || !severity) {
        alert("All fields are required.");
        return;
    }

    const alertData = {
        Title: title,
        Category: category,
        Message: message,
        Severity: severity
    };

    try {
        const response = await fetch(`${apiurl}/alerts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || tempTokenA
            },
            body: JSON.stringify(alertData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create alert");
        }

        alert("Alert created successfully");
    } catch (error) {
        console.error("Error creating alert:", error);
        alert("Error creating alert: " + error.message);
    }
    // Optionally, redirect to the alert list or clear the form
    window.location.href = "/alert.html"; // Redirect to alert list
}

/* <section>
        <h2>Admin Input/Changes</h2>
        <form action="/admin/update-alert" method="post">
            <label for="admin-title">Title:</label>
            <input type="text" id="admin-title" name="title" placeholder="Edit alert title">

            <label for="admin-category">Category:</label>
            <input type="text" id="admin-category" name="category" placeholder="Edit category">

            <label for="admin-message">Message:</label>
            <textarea id="admin-message" name="message" placeholder="Edit alert message"></textarea>

            <label for="admin-severity">Severity:</label>
            <select id="admin-severity" name="severity">
                <option value="">Select severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </select>

            <button type="submit">Save Changes</button>
        </form>
    </section> */









// -- Alert table
// CREATE TABLE Alert (
//     AlertID INT PRIMARY KEY IDENTITY(1,1),
//     Title VARCHAR(255) NOT NULL,
//   Category VARCHAR(50),
//     Message VARCHAR(500),
//     Date DATETIME NOT NULL DEFAULT GETDATE(),
//     Severity VARCHAR(50)
// );

// -- ReadStatus table
// CREATE TABLE ReadStatus (
//     user_id INT NOT NULL,
//     AlertID INT NOT NULL,
//     ReadStatus BIT NOT NULL,  -- 1 = Read, 0 = Unread
//     PRIMARY KEY (user_id, AlertID),
//     FOREIGN KEY (user_id) REFERENCES Users(user_id),
//     FOREIGN KEY (AlertID) REFERENCES Alert(AlertID)
// );