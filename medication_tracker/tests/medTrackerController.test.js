const medTrackerController = require('../controllers/medTrackerController');
const medTrackerModel = require('../models/medTrackerModel');

jest.mock('../models/medTrackerModel');

describe('medTrackerController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            params: {},
            query: {},
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
    });

    // Test for getMedicationById
    describe('getMedicationById', () => {
        it('should return medication when found', async () => {
            const mockMedication = { medication_id: 1, name: 'Aspirin' };
            medTrackerModel.getMedicationById.mockResolvedValue(mockMedication);
            
            req.params.medicationId = '1';
            req.params.userId = '1';

            await medTrackerController.getMedicationById(req, res);

            expect(res.json).toHaveBeenCalledWith(mockMedication);
        });

        it('should return 400 for invalid medication ID', async () => {
            req.params.medicationId = 'invalid';
            req.params.userId = '1';

            await medTrackerController.getMedicationById(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid medication ID' });
        });

        it('should return 404 when medication not found', async () => {
            medTrackerModel.getMedicationById.mockResolvedValue(null);
            
            req.params.medicationId = '1';
            req.params.userId = '1';

            await medTrackerController.getMedicationById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Medication not found' });
        });
    });

    // Test for getAllMedicationByUser
    describe('getAllMedicationByUser', () => {
        it('should return all medications for user', async () => {
            const mockMedications = [{ id: 1 }, { id: 2 }];
            medTrackerModel.getAllMedicationByUser.mockResolvedValue(mockMedications);
            
            req.params.userId = '1';

            await medTrackerController.getAllMedicationByUser(req, res);

            expect(res.json).toHaveBeenCalledWith(mockMedications);
        });

        it('should return empty array when no medications found', async () => {
            medTrackerModel.getAllMedicationByUser.mockResolvedValue([]);
            
            req.params.userId = '1';

            await medTrackerController.getAllMedicationByUser(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return 400 for invalid user ID', async () => {
            req.params.userId = 'invalid';

            await medTrackerController.getAllMedicationByUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // Test for getDailyMedicationByUser
    describe('getDailyMedicationByUser', () => {
        it('should return daily medications', async () => {
            const mockResult = {
                date: '2025-07-11',
                medications: [{ id: 1 }]
            };
            medTrackerModel.getDailyMedicationByUser.mockResolvedValue(mockResult);
            
            req.params.userId = '1';

            await medTrackerController.getDailyMedicationByUser(req, res);

            expect(res.json).toHaveBeenCalledWith(mockResult.medications);
        });

        it('should return empty array when no daily medications', async () => {
            medTrackerModel.getDailyMedicationByUser.mockResolvedValue({ 
                date: '2025-07-11', 
                medications: [] 
            });
            
            req.params.userId = '1';

            await medTrackerController.getDailyMedicationByUser(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    // Test for createMedication
    describe('createMedication', () => {
        it('should create new medication', async () => {
            const mockMedication = { id: 1, name: 'Aspirin' };
            medTrackerModel.createMedication.mockResolvedValue(mockMedication);
            
            req.body = { name: 'Aspirin' };

            await medTrackerController.createMedication(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockMedication);
        });

        it('should handle model errors', async () => {
            medTrackerModel.createMedication.mockRejectedValue(new Error('DB error'));
            
            req.body = { name: 'Aspirin' };

            await medTrackerController.createMedication(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // Test for updateMedication
    describe('updateMedication', () => {
        it('should update medication', async () => {
            const mockMedication = { id: 1, name: 'Aspirin Updated' };
            medTrackerModel.updateMedication.mockResolvedValue(mockMedication);
            
            req.params.medicationId = '1';
            req.params.userId = '1';
            req.body = { name: 'Aspirin Updated' };

            await medTrackerController.updateMedication(req, res);

            expect(res.json).toHaveBeenCalledWith(mockMedication);
        });

        it('should return 404 when medication not found', async () => {
            medTrackerModel.updateMedication.mockResolvedValue(null);
            
            req.params.medicationId = '1';
            req.params.userId = '1';
            req.body = { name: 'Aspirin Updated' };

            await medTrackerController.updateMedication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // Test for deleteMedication
    describe('deleteMedication', () => {
        it('should delete medication', async () => {
            medTrackerModel.deleteMedication.mockResolvedValue({ medicationId: 1, userId: 1 });
            
            req.params.medicationId = '1';
            req.params.userId = '1';

            await medTrackerController.deleteMedication(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it('should return 404 when medication not found', async () => {
            medTrackerModel.deleteMedication.mockResolvedValue(null);
            
            req.params.medicationId = '1';
            req.params.userId = '1';

            await medTrackerController.deleteMedication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // Test for tickOffMedication
    describe('tickOffMedication', () => {
        it('should tick off medication', async () => {
            const mockResult = { 
                medicationId: 1, 
                userId: 1, 
                isTaken: true,
                newQuantity: 9
            };
            medTrackerModel.tickOffMedication.mockResolvedValue(mockResult);
            
            req.params.medicationId = '1';
            req.params.userId = '1';

            await medTrackerController.tickOffMedication(req, res);

            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it('should return 404 when medication not found', async () => {
            medTrackerModel.tickOffMedication.mockResolvedValue(null);
            
            req.params.medicationId = '1';
            req.params.userId = '1';

            await medTrackerController.tickOffMedication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // Test for searchMedicationByName
    describe('searchMedicationByName', () => {
        it('should search medications by name', async () => {
            const mockMedications = [{ id: 1, name: 'Aspirin' }];
            medTrackerModel.searchMedicationByName.mockResolvedValue(mockMedications);
            
            req.params.userId = '1';
            req.query.name = 'Asp';

            await medTrackerController.searchMedicationByName(req, res);

            expect(res.json).toHaveBeenCalledWith(mockMedications);
        });

        it('should return 400 when name query is missing', async () => {
            req.params.userId = '1';

            await medTrackerController.searchMedicationByName(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // Test for refillMedication
    describe('refillMedication', () => {
        it('should refill medication', async () => {
            const mockResult = {
                medicationId: 1,
                newQuantity: 15,
                message: 'Medication refilled successfully'
            };
            medTrackerModel.refillMedication.mockResolvedValue(mockResult);
            
            req.params.id = '1';
            req.params.userId = '1';
            req.body = {
                refillQuantity: 10,
                refillDate: '2025-07-11'
            };

            await medTrackerController.refillMedication(req, res);

            expect(res.json).toHaveBeenCalledWith({
                message: "Medication refilled successfully",
                medicationId: mockResult.medicationId,
                medicationName: expect.anything(),
                previousQuantity: expect.anything(),
                refillQuantity: 10,
                newQuantity: 15,
                refillDate: '2025-07-11',
                updatedAt: expect.any(String)
            });
        });
    });

    // Test for getExpiredMedications
    describe('getExpiredMedications', () => {
        it('should return expired medications', async () => {
            const mockMedications = [{ id: 1, name: 'Expired Med' }];
            medTrackerModel.getExpiredMedications.mockResolvedValue(mockMedications);
            
            req.params.userId = '1';

            await medTrackerController.getExpiredMedications(req, res);

            expect(res.json).toHaveBeenCalledWith(mockMedications);
        });

        it('should return empty array when no expired medications', async () => {
            medTrackerModel.getExpiredMedications.mockResolvedValue(null);
            
            req.params.userId = '1';

            await medTrackerController.getExpiredMedications(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    // Test for getUpcomingReminders
    describe('getUpcomingReminders', () => {
        it('should return upcoming reminders', async () => {
            const mockReminders = [{ id: 1, name: 'Reminder 1' }];
            medTrackerModel.getUpcomingReminders.mockResolvedValue(mockReminders);
            
            req.params.userId = '1';

            await medTrackerController.getUpcomingReminders(req, res);

            expect(res.json).toHaveBeenCalledWith(mockReminders);
        });

        it('should return empty array when no reminders', async () => {
            medTrackerModel.getUpcomingReminders.mockResolvedValue(null);
            
            req.params.userId = '1';

            await medTrackerController.getUpcomingReminders(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });
});