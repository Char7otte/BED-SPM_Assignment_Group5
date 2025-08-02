const express = require('express');
const router = express.Router();
const medTrackerController = require('../controller/medTrackerController');
const { 
    validateMedicationCreate, 
    validateMedicationUpdate, 
    validateRefillRequest, 
    validateMedicationIdParam,
    validateDateRangeQuery,
    validateSearchQuery
} = require('../middleware/medTrackerValidation');

// Medication routes
router.get('/medications/user/:userId', medTrackerController.getAllMedicationByUser);
router.get('/medications/user/:userId/daily', medTrackerController.getDailyMedicationByUser);
router.get('/medications/user/:userId/weekly', medTrackerController.getWeeklyMedicationByUser);
router.get('/medications/user/:userId/search', validateSearchQuery, medTrackerController.searchMedicationByName);
router.get('/medications/user/:userId/upcoming-reminders', medTrackerController.getUpcomingReminders);

router.get('/medications/:userId/:medicationId', validateMedicationIdParam, medTrackerController.getMedicationById);
router.post('/medications', validateMedicationCreate, medTrackerController.createMedication);
router.put('/medications/:userId/:medicationId', validateMedicationUpdate, medTrackerController.updateMedication);
router.delete('/medications/:userId/:medicationId', medTrackerController.deleteMedication);

// Tick off medication (mark as taken)
router.put('/medications/:userId/:medicationId/is-taken', medTrackerController.tickOffMedication);

// Mark medication as missed
router.put('/medications/:userId/:medicationId/missed', medTrackerController.markMedicationAsMissed);

// Refill medication
router.put('/medications/:userId/:id/refill', validateRefillRequest, medTrackerController.refillMedication);

// Get low quantity medications
router.get('/medications/user/:userId/low-quantity', medTrackerController.getLowQuantityMedication);

// Get expired medications
router.get('/medications/user/:userId/expired', medTrackerController.getExpiredMedications);

// Tick off all medications for the user
router.put('/medications/user/:userId/tick-all', medTrackerController.tickAllMedications);

module.exports = router;