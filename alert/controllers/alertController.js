const alertModel = require("../models/alertModel.js");

// Get all alerts
async function getAllAlerts(req, res) {
    try {
        const alerts = await alertModel.getAllAlerts();
        res.json(alerts);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving alerts" });
    }
}


// Get alert by ID
async function getAlertById(req, res) {
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
        return res.status(400).json({ error: "Invalid alert ID" });
    }

  
    try {
        const alert = await alertModel.getAlertById(alertId);
        if (!alert) {
            return res.status(404).json({ error: "Alert not found" });
        }
        res.json(alert);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving alert" });
    }

    
   
}
// Create a new alert
async function createAlert(req, res) {
    const { Title, Category, Message, Severity } = req.body;
    console.log("Creating alert:", { Title, Category, Message, Severity });
    if (!Title || !Category || !Message || !Severity) {
        return res.status(400).json({ error: "Title, category, message, and severity are required" });
    }

    try {
        const success = await alertModel.createAlert({ Title, Category, Message, Severity });
        if (!success) {
            return res.status(500).json({ error: "Error creating alert" });
        }
        res.status(201).json({ message: "Alert created successfully" });
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error creating alert" });
    }
}

// Update an existing alert
async function updateAlert(req, res) {
    const alertId = parseInt(req.params.id);
    console.log("Updating alert with ID:", alertId);
    if (isNaN(alertId)) {
        return res.status(400).json({ error: "Invalid alert ID" });
    }

    const { Title, Category, Message, Severity } = req.body;
    if (!Title || !Category || !Message || !Severity) {
        return res.status(400).json({ error: "Title, category, message, and severity are required" });
    }

    try {
        const success = await alertModel.updateAlert(alertId, { Title, Category, Message, Severity });
        if (!success) {
            return res.status(404).json({ error: "Alert not found" });
        }
        res.json({ message: "Alert updated successfully" });
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error updating alert" });
    }
}
   

// Delete an alert
async function deleteAlert(req, res) {
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
        return res.status(400).json({ error: "Invalid alert ID" });
    } 

    try {
        const alert = await alertModel.deleteReadStatusByid(alertId);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error deleting read status" });
    }

    try {
        const success = await alertModel.deleteAlert(alertId);
        if (!success) {
            return res.status(404).json({ error: "Alert not found" });
        }
        res.json({ message: "Alert deleted successfully" });
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error deleting alert" });
    }
}

async function updateAlertStatus(req, res) {
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
        return res.status(400).json({ error: "Invalid alert ID" });
    }
    const { user_id, ReadStatus } = req.body;
    if (typeof ReadStatus !== 'boolean') {
        return res.status(400).json({ error: "ReadStatus must be a boolean value" });
    }
    try {
        const success = await alertModel.updateAlertStatus(alertId, user_id, ReadStatus);
        if (!success) {
            return res.status(404).json({ error: "Alert not found or status update failed" });
        }
        res.json({ message: "Alert status updated successfully" });
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error updating alert status" });
    }
}
async function getUnreadAlerts(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) { 
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const alerts = await alertModel.getUnreadAlerts(userId);
        res.json(alerts);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving unread alerts" });
    }
}
async function searchAlerts(req, res) {
    const { title, category } = req.query;
    console.log("Search parameters:", { title, category });
    if (!title && !category) {
        return res.status(400).json({ error: "At least one search parameter (title or category) is required" });
    }

    try {
        const alerts = await alertModel.searchAlerts(title, category);
        res.json(alerts);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error searching alerts" });
    }
}



module.exports = {
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert,
    updateAlertStatus,
    getUnreadAlerts,
    searchAlerts,
};

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