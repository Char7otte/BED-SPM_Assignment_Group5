const medTrackerModel = require('../model/medTrackerModel');

async function getMedicationById(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid medication ID" });
        }

        const medication = await medTrackerModel.getMedicationById(id);

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
        const date = req.query.date;

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        if (!date) {
            return res.status(400).json({ error: "Date query parameter is required" });
        }
        const dailyMedications = await medTrackerModel.getDailyMedicationByUser(userId, date);

        if (!dailyMedications || dailyMedications.length === 0) {
            return res.status(404).json({ error: "No daily medications found for this user on the specified date" });
        }

        res.json(dailyMedications);
    }
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving daily medications" });
    }
}