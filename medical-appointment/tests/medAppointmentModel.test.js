const medAppointment = require('../models/medAppointmentModel');
const sql = require('mssql');

jest.mock("mssql");

// Test suite for getAppointmentsByUser
describe("medAppointment.getAppointmentsByUser", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve all appointments for a user", async () => {
        const mockAppointments = [
            { 
                appointment_id: 1, 
                user_id: 1, 
                date: "2025-07-11", 
                time: "10:00" 
            },
            { 
                appointment_id: 2, 
                user_id: 1, 
                date: "2025-07-12", 
                time: "11:00" 
            }
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockAppointments }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

        const appointments = await medAppointment.getAllAppointmentsByUser(1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(appointments).toHaveLength(2);
        expect(appointments[0].appointment_id).toBe(1);
        expect(appointments[0].user_id).toBe(1);
        expect(appointments[0].date).toBe("2025-07-11");
        expect(appointments[0].time).toBe("10:00");
        expect(appointments[1].appointment_id).toBe(2);
        expect(appointments[1].user_id).toBe(1);
        expect(appointments[1].date).toBe("2025-07-12");
        expect(appointments[1].time).toBe("11:00");
    });

    it("should handle error when retrieving appointments", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(medAppointment.getAllAppointmentsByUser(1)).rejects.toThrow(errorMessage);
    });
});

// Test suite for getAppointmentsByDate
describe("medAppointment.getAppointmentsByDate", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve appointments by date for a user", async () => {
        const mockAppointments = [
            { 
                appointment_id: 1, 
                user_id: 1, 
                date: "2025-07-11", 
                time: "10:00" 
            }
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockAppointments }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const appointments = await medAppointment.getAppointmentsByDate(1, "2025-07-11");

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(appointments).toHaveLength(1);
        expect(appointments[0].appointment_id).toBe(1);
        expect(appointments[0].user_id).toBe(1);
        expect(appointments[0].date).toBe("2025-07-11");
        expect(appointments[0].time).toBe("10:00");
    });

    it("should handle error when retrieving appointments by date", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(medAppointment.getAppointmentsByDate(1, "2025-07-11")).rejects.toThrow(errorMessage);
    });
});

// Test suite for getAppointmentsByMonthYear
describe("medAppointment.getAppointmentsByMonthYear", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve appointments by month and year for a user", async () => {
        const mockAppointments = [
            { 
                appointment_id: 1, 
                user_id: 1, 
                date: "2025-07-11", 
                time: "10:00" 
            }
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockAppointments }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const appointments = await medAppointment.getAppointmentsByMonthYear(1, "07", "2025");

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(appointments).toHaveLength(1);
        expect(appointments[0].appointment_id).toBe(1);
        expect(appointments[0].user_id).toBe(1);
        expect(appointments[0].date).toBe("2025-07-11");
        expect(appointments[0].time).toBe("10:00");
    });

    it("should handle error when retrieving appointments by month and year", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(medAppointment.getAppointmentsByMonthYear(1, "07", "2025")).rejects.toThrow(errorMessage);
    });
});

// Test suite for getAppointmentById
describe("medAppointment.getAppointmentById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve an appointment by ID", async () => {
        const mockAppointment = {
            appointment_id: 1, 
            user_id: 1, 
            date: "2025-07-11", 
            time: "10:00" 
        };

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [mockAppointment] }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const appointment = await medAppointment.getAppointmentById(1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(appointment.appointment_id).toBe(1);
        expect(appointment.user_id).toBe(1);
        expect(appointment.date).toBe("2025-07-11");
        expect(appointment.time).toBe("10:00");
    });

    it("should return null when appointment is not found", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [] }), 
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const appointment = await medAppointment.getAppointmentById(999); // Non-existent ID

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockRequest.input).toHaveBeenCalledWith("appointment_id", 999);
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(appointment).toBeNull(); 
    });

    it("should handle error when retrieving an appointment by ID", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(medAppointment.getAppointmentById(1)).rejects.toThrow(errorMessage);
    });
});

// Test suite for createAppointment
describe("medAppointment.createAppointment", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a new appointment for a user", async () => {
        const mockNewAppointmentId = 1;
        const mockAppointment = { 
            id: 1, 
            date: "2025-07-11", 
            title: "Doctor Visit",
            doctor: "Dr. Smith",
            startTime: "10:00:00",
            endTime: "11:00:00",
            location: "Clinic A",
            status: "Scheduled",
            notes: "Regular checkup"
        };

        // Mock the INSERT operation that returns the new appointment ID
        const mockInsertRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ 
                recordset: [{ appointment_id: mockNewAppointmentId }] 
            }),
        };
        const mockInsertConnection = {
            request: jest.fn().mockReturnValue(mockInsertRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        // Mock for SELECT operation (getAppointmentById)
        const mockSelectRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [mockAppointment] }),
        };
        const mockSelectConnection = {
            request: jest.fn().mockReturnValue(mockSelectRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        // sql.connect returns different connections for each call
        sql.connect
            .mockResolvedValueOnce(mockInsertConnection)  // First call - createAppointment
            .mockResolvedValueOnce(mockSelectConnection); // Second call - getAppointmentById

        const appointmentData = {
            date: "2025-07-11",
            title: "Doctor Visit",
            doctor: "Dr. Smith",
            start_time: "10:00:00",
            end_time: "11:00:00",
            location: "Clinic A",
            notes: "Regular checkup"
        };

        const appointment = await medAppointment.createAppointment(1, appointmentData);

        // Verify both connections were used and closed
        expect(sql.connect).toHaveBeenCalledTimes(2);
        expect(mockInsertConnection.close).toHaveBeenCalledTimes(1);
        expect(mockSelectConnection.close).toHaveBeenCalledTimes(1);

        // Verify the returned appointment data
        expect(appointment.id).toBe(1);
        expect(appointment.date).toBe("2025-07-11");
        expect(appointment.title).toBe("Doctor Visit");
    });

    it("should handle error when creating an appointment", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(medAppointment.createAppointment(1, { date: "2025-07-11", title: "Test" })).rejects.toThrow(errorMessage);
    });

    it("should set default status to 'Scheduled' when not provided", async () => {
        const mockInsertRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [{ appointment_id: 1 }] }),
        };
        const mockInsertConnection = {
            request: jest.fn().mockReturnValue(mockInsertRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        const mockSelectRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [{ id: 1, status: "Scheduled" }] }),
        };
        const mockSelectConnection = {
            request: jest.fn().mockReturnValue(mockSelectRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect
            .mockResolvedValueOnce(mockInsertConnection)
            .mockResolvedValueOnce(mockSelectConnection);

        await medAppointment.createAppointment(1, { date: "2025-07-11", title: "Test" });

        expect(mockInsertRequest.input).toHaveBeenCalledWith("status", "Scheduled");
    });
});

// Test suite for updateAppointment
describe("medAppointment.updateAppointment", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update an appointment successfully", async () => {
        const mockUpdatedAppointment = {
            id: 1,
            date: "2025-07-12",
            title: "Updated Visit",
            doctor: "Dr. Johnson",
            startTime: "14:00:00",
            endTime: "15:00:00",
            location: "Clinic B",
            status: "Confirmed",
            notes: "Updated notes"
        };

        const mockUpdateRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
        };
        const mockUpdateConnection = {
            request: jest.fn().mockReturnValue(mockUpdateRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        const mockSelectRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [mockUpdatedAppointment] }),
        };
        const mockSelectConnection = {
            request: jest.fn().mockReturnValue(mockSelectRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect
            .mockResolvedValueOnce(mockUpdateConnection)
            .mockResolvedValueOnce(mockSelectConnection);

        const appointmentData = {
            date: "2025-07-12",
            title: "Updated Visit",
            doctor: "Dr. Johnson",
            start_time: "14:00:00",
            end_time: "15:00:00",
            location: "Clinic B",
            status: "Confirmed",
            notes: "Updated notes"
        };

        const result = await medAppointment.updateAppointment(1, 1, appointmentData);

        expect(sql.connect).toHaveBeenCalledTimes(2);
        expect(mockUpdateConnection.close).toHaveBeenCalledTimes(1);
        expect(mockSelectConnection.close).toHaveBeenCalledTimes(1);
        expect(result.title).toBe("Updated Visit");
    });

    it("should return null when appointment not found for update", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [0] }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const result = await medAppointment.updateAppointment(999, 1, { date: "2025-07-11" });

        expect(result).toBeNull();
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    it("should handle error when updating an appointment", async () => {
        const errorMessage = "Update Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(medAppointment.updateAppointment(1, 1, { date: "2025-07-11" })).rejects.toThrow(errorMessage);
    });
});

// Test suite for deleteAppointment
describe("medAppointment.deleteAppointment", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete an appointment successfully", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const result = await medAppointment.deleteAppointment(1, 1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
    });

    it("should return null when appointment not found for deletion", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [0] }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const result = await medAppointment.deleteAppointment(999, 1);

        expect(result).toBeNull();
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    it("should handle error when deleting an appointment", async () => {
        const errorMessage = "Delete Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(medAppointment.deleteAppointment(1, 1)).rejects.toThrow(errorMessage);
    });
});

// Test suite for searchAppointments
describe("medAppointment.searchAppointments", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should search appointments by term", async () => {
        const mockAppointments = [
            {
                id: 1,
                date: "2025-07-11",
                title: "Doctor Visit",
                doctor: "Dr. Smith",
                startTime: "10:00:00",
                endTime: "11:00:00",
                location: "Clinic A",
                status: "Scheduled",
                notes: "Regular checkup"
            }
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockAppointments }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const results = await medAppointment.searchAppointments("Dr. Smith", 1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(results).toHaveLength(1);
        expect(results[0].doctor).toBe("Dr. Smith");
    });

    it("should return empty array when no appointments match search", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [] }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection);

        const results = await medAppointment.searchAppointments("nonexistent", 1);

        expect(results).toHaveLength(0);
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    it("should handle error when searching appointments", async () => {
        const errorMessage = "Search Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(medAppointment.searchAppointments("test", 1)).rejects.toThrow(errorMessage);
    });
});