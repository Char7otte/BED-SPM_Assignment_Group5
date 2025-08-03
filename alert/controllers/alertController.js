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
    const userId = parseInt(req.body.userId);
    const alertId = parseInt(req.params.id);
    
    
    if (isNaN(userId) || isNaN(alertId)) {
        return res.status(400).json({ error: "Invalid user ID or alert ID" });
    }

    try {
        const success = await alertModel.updateAlertStatus(userId, alertId);
        if (!success) {
            return res.status(404).json({ error: "Alert not found or already acknowledged" });
        }
        res.json({ message: "Alert status updated successfully" });
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error updating alert status" });
    }
}
async function getreadAlerts(req, res) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) { 
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const alerts = await alertModel.getreadAlerts(userId);
        res.json(alerts);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving unread alerts" });
    }
}
async function searchAlerts(req, res) {
    const { title, category } = req.query;
    
    if (!title && !category) {
        return res.status(400).json({ error: "At least one search parameter (title or category) is required" });
    }

    try {
        const alerts = await alertModel.searchAlerts(title, category);
        
        return res.status(200).json(alerts);
    } catch (error) {
        console.error("Controller error:", error);
        return res.status(500).json({ error: "Error searching alerts" });
    }
}

async function checkHasNotiesAdded(req, res) {
    

    try {
        const alertTitle = req.params.id;
        const userId = req.body.userId;

        
        if (!alertTitle) {
            return res.status(400).json({ error: "Alert title is required" });
        }
        const hasNoties = await alertModel.checkifAlertAddedToNotes(alertTitle, userId);
        if (hasNoties) {
            
            return res.status(200).json({ hasNoties: true });
        }
        else {
            
            return res.status(200).json({ hasNoties: false });
        }
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error checking notes" });
    }
}





module.exports = {
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert,
    updateAlertStatus,
    getreadAlerts,
    searchAlerts,
    checkHasNotiesAdded,
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