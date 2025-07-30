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
        
        const result = await medTrackerModel.getDailyMedicationByUser(userId);

        if (result.medications.length === 0) {
            return res.json({ 
                date: result.date, 
                medications: [] 
            });
        }

        res.json(result.medications); // Return just the medications array
    } 
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Failed to get daily medications" });
    }
};

async function getWeeklyMedicationByUser(req, res) {
    try {
        const userId = parseInt(req.params.userId);
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
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

        const medicationData = {
        ...req.body,
        userId: userId
        };

        const updatedMedication = await medTrackerModel.updateMedication(medicationId, medicationData);

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
        const userId = parseInt(req.params.userId);
        const name = req.query.name; // Changed from medicationName to name
        
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        
        if (!name) {
            return res.status(400).json({ error: "Medication name query parameter is required" });
        }

        const medications = await medTrackerModel.searchMedicationByName(userId, name);

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

async function remindMedication(req, res) {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const reminders = await medTrackerModel.remindMedication(userId);
        res.json(reminders);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving medication reminders" });
    }
}

async function tickAllMedications(req, res) {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        console.log("Ticking off all medications.");
        const tickedOffMedications = await medTrackerModel.tickAllMedications(userId);

        if (!tickedMedications || tickedMedications.length === 0) {
            return res.json({ 
                message: "No untaken medications found for this user",
                tickedCount: 0,
                medications: []
            });
        }   
        
        if (!tickedOffMedications) {
            return res.status(404).json({ error: "No medications found for this user" });
        }

        res.json(tickedOffMedications);
    }
    catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error ticking off all medications" });
    }
}

async function getLowQuantityMedication(req, res) {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const lowQuantityMedications = await medTrackerModel.getLowQuantityMedication(userId);

        if (!lowQuantityMedications || lowQuantityMedications.length === 0) {
            return res.status(404).json({ error: "No low quantity medications found for this user" });
        }

        res.json(lowQuantityMedications);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving low quantity medications" });
    }
}
async function decrementMedicationQuantity(req, res) {
    try {
        const medicationId = parseInt(req.params.medicationId);
        const userId = parseInt(req.params.userId);
        
        if (isNaN(medicationId)) {
            return res.status(400).json({ error: "Invalid medication ID" });
        }
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const updatedMedication = await medTrackerModel.decrementMedicationQuantity(medicationId, userId);

        if (!updatedMedication) {
            return res.status(404).json({ error: "Medication not found or quantity already at zero" });
        }

        res.json(updatedMedication);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error decrementing medication quantity" });
    }
}

async function refillMedication(req, res) {
    try {
        const medicationId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);
        const { newQuantity } = req.body;

        if (isNaN(medicationId) || isNaN(userId)) {
            return res.status(400).json({ error: "Invalid medication ID or user ID" });
        }

        if (!newQuantity || isNaN(parseInt(newQuantity))) {
            return res.status(400).json({ error: "Valid quantity is required" });
        }

        const result = await medTrackerModel.refillMedication(medicationId, userId, parseInt(newQuantity));

        if (!result) {
            return res.status(404).json({ error: "Medication not found" });
        }

        res.json(result);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error refilling medication" });
    }
}

async function getExpiredMedications(req, res) {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const expiredMedications = await medTrackerModel.getExpiredMedications(userId);

        if (!expiredMedications) {
            return res.json({ message: "No expired medications found", data: [] });
        }

        res.json({ data: expiredMedications });
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving expired medications" });
    }
}

async function markMedicationAsMissed(req, res) {
    try {
        const medicationId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);

        if (isNaN(medicationId) || isNaN(userId)) {
            return res.status(400).json({ error: "Invalid medication ID or user ID" });
        }

        const result = await medTrackerModel.markMedicationAsMissed(medicationId, userId);

        if (!result) {
            return res.status(404).json({ error: "Medication not found" });
        }

        res.json(result);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error marking medication as missed" });
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
    searchMedicationByName,
    remindMedication,
    tickAllMedications, 
    getLowQuantityMedication,
    decrementMedicationQuantity,
    refillMedication,
    getExpiredMedications,
    markMedicationAsMissed
};