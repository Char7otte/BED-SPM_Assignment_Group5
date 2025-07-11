const medTrackerModel = require('../model/medTrackerModel');

async function getMedicationById(req, res) {
    try {
        const medicationId = parseInt(req.params.medicationId);
        const userId = parseInt(req.params.userId);
        if (isNaN(medicationId)) {
            return res.status(400).json({ error: "Invalid medication ID" });
        }
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        
        const medication = await medTrackerModel.getMedicationById(medicationId, userId);

        if (!medication) {
            return res.status(404).json({ error: "Medication not found" });
        }

        res.json(medication); 
    }
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving medication" });
    }
}

async function getAllMedicationByUser(req, res) {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const medications = await medTrackerModel.getAllMedicationByUser(userId);

        if (!medications || medications.length === 0) {
            return res.status(404).json({ error: "No medications found for this user" });
        }

        res.json(medications);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving medications" });
    }
}

async function getDailyMedicationByUser(req, res) {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        
        const dailyMeds = await medTrackerModel.getDailyMedicationByUser(userId);

        if (dailyMeds.medications.length === 0) {
            return res.status(404).json({ 
                message: "No medications scheduled for today",
                suggestion: "Check if you have any active prescriptions"
            });
        }

        res.json(dailyMeds);
    } 
    catch (error) {
        res.status(500).json({ 
            error: "Failed to get daily medications",
            details: error.message 
        });
    }
};

async function getWeeklyMedicationByUser(req, res) {
    try {
        const userId = parseInt(req.params.userId);
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "Start and end date query parameters are required" });
        }

        const weeklyMedications = await medTrackerModel.getWeeklyMedicationByUser(userId, startDate, endDate);

        if (!weeklyMedications || weeklyMedications.length === 0) {
            return res.status(404).json({ error: "No weekly medications found for this user in the specified date range" });
        }

        res.json(weeklyMedications);
    }
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving weekly medications" });
    }
}

async function createMedication(req, res) {
    try {
        const newMedication = await medTrackerModel.createMedication(req.body);
        res.status(201).json(newMedication); 
    }
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error creating medication" });
    }
}

async function updateMedication(req, res) {
    try {
        const medicationId = parseInt(req.params.medicationId);
        const userId = parseInt(req.params.userId);
        
        if (isNaN(medicationId)) {
            return res.status(400).json({ error: "Invalid medication ID" });
        }
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const updatedMedication = await medTrackerModel.updateMedication(medicationId, req.body);

        if (!updatedMedication) {
            return res.status(404).json({ error: "Medication not found" });
        }

        res.json(updatedMedication);
    }
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error updating medication" });
    }
}

async function deleteMedication(req, res) {
    try {
        const medicationId = parseInt(req.params.medicationId);
        const userId = parseInt(req.params.userId);

        if (isNaN(medicationId)) {
            return res.status(400).json({ error: "Invalid medication ID" });
        }
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const deleted = await medTrackerModel.deleteMedication(medicationId, userId);

        if (!deleted) {
            return res.status(404).json({ error: "Medication not found" });
        }

        res.status(204).send();
    }
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error deleting medication" });
    }
}

async function tickOffMedication(req, res) {
    try {
        const medicationId = parseInt(req.params.medicationId);
        const userId = parseInt(req.params.userId);
        
        if (isNaN(medicationId)) {
            return res.status(400).json({ error: "Invalid medication ID" });
        }
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const tickedOffMedication = await medTrackerModel.tickOffMedication(medicationId, userId);

        if (!tickedOffMedication) {
            return res.status(404).json({ error: "Medication not found" });
        }

        res.json(tickedOffMedication);
    }
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error ticking off medication" });
    }
}

async function searchMedicationByName(req, res) {
    try {
        const name = req.query.name;
        
        if (!name) {
            return res.status(400).json({ error: "Medication name query parameter is required" });
        }

        const medications = await medTrackerModel.searchMedicationByName(name);

        if (!medications || medications.length === 0) {
            return res.status(404).json({ error: "No medications found with the specified name" });
        }

        res.json(medications);
    }
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error searching medications" });
    }
}

module.exports = {
    getMedicationById,
    getAllMedicationByUser,
    getDailyMedicationByUser,
    getWeeklyMedicationByUser,
    createMedication,
    updateMedication,
    deleteMedication,
    tickOffMedication,
    searchMedicationByName
};