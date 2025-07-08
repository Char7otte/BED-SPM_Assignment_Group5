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