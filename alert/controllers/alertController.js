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
module.exports = {
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert
};