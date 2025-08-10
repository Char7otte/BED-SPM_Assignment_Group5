const sql = require("mssql");
const medTrackerModel = require("../model/medTrackerModel");

jest.mock("mssql");

describe("medTrackerModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test for getMedicationById
    describe("getMedicationById", () => {
        it("should return medication when found", async () => {
            const mockMedication = {
                medication_id: 1,
                medication_name: "Aspirin",
                user_id: 1,
            };

            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: [mockMedication] }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.getMedicationById(1, 1);
            expect(result).toEqual(mockMedication);
        });

        it("should return null when medication not found", async () => {
            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: [] }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.getMedicationById(999, 1);
            expect(result).toBeNull();
        });

        it("should handle database errors", async () => {
            sql.connect.mockRejectedValue(new Error("Database error"));

            await expect(medTrackerModel.getMedicationById(1, 1)).rejects.toThrow("Database error");
        });
    });

    // Test for getAllMedicationByUser
    describe("getAllMedicationByUser", () => {
        it("should return all medications for a user", async () => {
            const mockMedications = [
                { medication_id: 1, medication_name: "Aspirin", user_id: 1 },
                { medication_id: 2, medication_name: "Ibuprofen", user_id: 1 },
            ];

            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: mockMedications }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.getAllMedicationByUser(1);
            expect(result).toEqual(mockMedications);
        });

        it("should handle database errors", async () => {
            sql.connect.mockRejectedValue(new Error("Database error"));

            await expect(medTrackerModel.getAllMedicationByUser(1)).rejects.toThrow("Database error");
        });
    });

    // Test for getDailyMedicationByUser
    describe("getDailyMedicationByUser", () => {
        it("should return daily medications with current date", async () => {
            const currentDate = new Date().toISOString().split("T")[0];
            const mockMedications = [{ medication_id: 1, medication_name: "Aspirin", medication_date: currentDate }];

            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest
                    .fn()
                    .mockResolvedValueOnce({}) // For the update query
                    .mockResolvedValueOnce({ recordset: mockMedications }), // For the select query
                close: jest.fn(),
            });

            const result = await medTrackerModel.getDailyMedicationByUser(1);
            expect(result.date).toBe(currentDate);
            expect(result.medications).toEqual(mockMedications);
        });

        it("should handle database errors", async () => {
            sql.connect.mockRejectedValue(new Error("Database error"));

            await expect(medTrackerModel.getDailyMedicationByUser(1)).rejects.toThrow("Database error");
        });
    });

    // Test for createMedication
    describe("createMedication", () => {
        it("should create and return new medication", async () => {
            const newMedication = {
                user_id: 1,
                medication_name: "Aspirin",
                medication_date: "2025-07-11",
                medication_time: "10:00",
                medication_dosage: "500mg",
                medication_quantity: 30,
                is_taken: false,
            };

            const mockResult = { ...newMedication, medication_id: 1 };

            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: [mockResult] }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.createMedication(newMedication);
            expect(result).toEqual(mockResult);
        });

        it("should throw error when creation fails", async () => {
            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: [] }),
                close: jest.fn(),
            });

            await expect(medTrackerModel.createMedication({})).rejects.toThrow("Medication creation failed");
        });
    });

    // Test for updateMedication
    describe("updateMedication", () => {
        it("should update medication and return updated data", async () => {
            const updatedData = {
                userId: 1,
                medicationName: "Aspirin Updated",
                medicationDate: "2025-07-11",
                medicationTime: "10:00",
                medicationDosage: "500mg",
                medicationQuantity: 30,
                isTaken: false,
            };

            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.updateMedication(1, updatedData);
            expect(result).toEqual({ medicationId: 1, ...updatedData });
        });

        it("should return null when medication not found", async () => {
            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ rowsAffected: [0] }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.updateMedication(999, {});
            expect(result).toBeNull();
        });
    });

    // Test for deleteMedication
    describe("deleteMedication", () => {
        it("should delete medication and return success", async () => {
            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.deleteMedication(1, 1);
            expect(result).toEqual({ medicationId: 1, userId: 1 });
        });

        it("should return null when medication not found", async () => {
            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ rowsAffected: [0] }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.deleteMedication(999, 1);
            expect(result).toBeNull();
        });
    });

    // Test for tickOffMedication
    describe("tickOffMedication", () => {
        it("should mark medication as taken and decrement quantity", async () => {
            const mockMedication = {
                medication_quantity: 10,
                medication_name: "Aspirin",
            };

            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest
                    .fn()
                    .mockResolvedValueOnce({ recordset: [mockMedication] }) // For the select
                    .mockResolvedValueOnce({ rowsAffected: [1] }), // For the update
                close: jest.fn(),
            });

            const result = await medTrackerModel.tickOffMedication(1, 1);
            expect(result.isTaken).toBe(true);
            expect(result.newQuantity).toBe(9);
        });

        it("should return null when medication not found", async () => {
            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: [] }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.tickOffMedication(999, 1);
            expect(result).toBeNull();
        });
    });

    // Test for getLowQuantityMedication
    describe("getLowQuantityMedication", () => {
        it("should return medications with quantity < 5", async () => {
            const mockMedications = [
                { medication_id: 1, medication_name: "Aspirin", medication_quantity: 3 },
                { medication_id: 2, medication_name: "Ibuprofen", medication_quantity: 2 },
            ];

            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: mockMedications }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.getLowQuantityMedication(1);
            expect(result).toEqual(mockMedications);
        });

        it("should return null when no low quantity medications", async () => {
            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: [] }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.getLowQuantityMedication(1);
            expect(result).toBeNull();
        });
    });

    // Test for refillMedication
    describe("refillMedication", () => {
        it("should refill medication and return updated quantity", async () => {
            const mockMedication = {
                medication_quantity: 5,
                medication_name: "Aspirin",
            };

            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest
                    .fn()
                    .mockResolvedValueOnce({ recordset: [mockMedication] }) // For the select
                    .mockResolvedValueOnce({ rowsAffected: [1] }), // For the update
                close: jest.fn(),
            });

            const refillData = {
                userId: 1,
                refillQuantity: 10,
                refillDate: "2025-07-11",
            };

            const result = await medTrackerModel.refillMedication(1, refillData);
            expect(result.newQuantity).toBe(15);
            expect(result.message).toBe("Medication refilled successfully.");
        });
    });

    // Test for getExpiredMedications
    describe("getExpiredMedications", () => {
        it("should return expired medications", async () => {
            const currentDate = new Date().toISOString().split("T")[0];
            const mockMedications = [{ medication_id: 1, medication_name: "Aspirin", prescription_enddate: "2025-01-01" }];

            sql.connect.mockResolvedValue({
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: mockMedications }),
                close: jest.fn(),
            });

            const result = await medTrackerModel.getExpiredMedications(1);
            expect(result).toEqual(mockMedications);
        });
    });
});
