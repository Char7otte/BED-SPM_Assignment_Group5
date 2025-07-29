const medAppointmentController = require('../controllers/medAppointmentController');
const medAppointment = require("../models/medAppointmentModel");

jest.mock("../models/medAppointmentModel");

// Test for getAllAppointmentsByUser
describe("medAppointmentController.getAllAppointmentsByUser", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it("should fetch all appointments and return a JSON response", async () => {
        const mockAppointments = [
            { id: 1, userID: 1, date: "2025-07-11", time: "10:00" },
            { id: 2, userID: 1, date: "2025-07-12", time: "11:00" }
        ];

        medAppointment.getAllAppointmentsByUser.mockResolvedValue(mockAppointments);

        const req = { user: { id: 1 } };
        const res = { json: jest.fn() };

        await medAppointmentController.getAllAppointmentsByUser(req, res);

        expect(medAppointment.getAllAppointmentsByUser).toHaveBeenCalledTimes(1);
        expect(medAppointment.getAllAppointmentsByUser).toHaveBeenCalledWith(1); // Assuming userID is 1
        expect(res.json).toHaveBeenCalledWith(mockAppointments);
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        medAppointment.getAllAppointmentsByUser.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.getAllAppointmentsByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving appointments" });
    });
})

// Test for getAppointmentsByDate
describe("medAppointmentController.getAppointmentsByDate", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch appointments by date and return a JSON response", async () => {
        const mockAppointments = [
            { id: 1, userID: 1, date: "2025-07-11", time: "10:00" },
            { id: 2, userID: 1, date: "2025-07-11", time: "11:30" }
        ];

        medAppointment.getAppointmentsByDate.mockResolvedValue(mockAppointments);

        const req = { user: { id: 1 }, params: { date: "2025-07-11" } };
        const res = { json: jest.fn() };

        await medAppointmentController.getAppointmentsByDate(req, res);

        expect(medAppointment.getAppointmentsByDate).toHaveBeenCalledTimes(1);
        expect(medAppointment.getAppointmentsByDate).toHaveBeenCalledWith("2025-07-11", 1);
        expect(res.json).toHaveBeenCalledWith(mockAppointments);
    });

    it("should return 400 for invalid date", async () => {
        const req = { user: { id: 1 }, params: { date: "" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.getAppointmentsByDate(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid appointment date" });
    });

    it("should return 404 if no appointments found", async () => {
        medAppointment.getAppointmentsByDate.mockResolvedValue([]);

        const req = { user: { id: 1 }, params: { date: "2025-07-11" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.getAppointmentsByDate(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "No appointments found" });
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        medAppointment.getAppointmentsByDate.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, params: { date: "2025-07-11" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.getAppointmentsByDate(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving appointment" });
    });
});

// Test for getAppointmentsByMonthYear
describe("medAppointmentController.getAppointmentsByMonthYear", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch appointments by month and year and return a JSON response", async () => {
        const mockAppointments = [
            { id: 1, userID: 1, date: "2025-07-11", time: "10:00" },
            { id: 2, userID: 1, date: "2025-07-12", time: "11:00" }
        ];

        medAppointment.getAppointmentsByMonthYear.mockResolvedValue(mockAppointments);

        const req = { user: { id: 1 }, params: { month: "07", year: "2025" } };
        const res = { json: jest.fn() };

        await medAppointmentController.getAppointmentsByMonthYear(req, res);

        expect(medAppointment.getAppointmentsByMonthYear).toHaveBeenCalledTimes(1);
        expect(medAppointment.getAppointmentsByMonthYear).toHaveBeenCalledWith("07", "2025", 1);
        expect(res.json).toHaveBeenCalledWith(mockAppointments);
    });

    it("should return 400 for invalid month or year", async () => {
        const req = { user: { id: 1 }, params: { month: "", year: "" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.getAppointmentsByMonthYear(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid month or year" });
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        medAppointment.getAppointmentsByMonthYear.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, params: { month: "07", year: "2025" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.getAppointmentsByMonthYear(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving appointments for the month and year" });
    });
});

// Test for createAppointment
describe("medAppointmentController.createAppointment", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a new appointment and return a JSON response", async () => {
        const mockAppointment = { id: 1, userID: 1, date: "2025-07-11", time: "10:00" };

        medAppointment.createAppointment.mockResolvedValue(mockAppointment);

        const req = { user: { id: 1 }, body: { date: "2025-07-11", time: "10:00" } };
        const res = { 
            status: jest.fn().mockReturnThis(),
            json: jest.fn() 
        };

        await medAppointmentController.createAppointment(req, res);

        expect(medAppointment.createAppointment).toHaveBeenCalledTimes(1);
        expect(medAppointment.createAppointment).toHaveBeenCalledWith(1, { date: "2025-07-11", time: "10:00" });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockAppointment);
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        medAppointment.createAppointment.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, body: { date: "2025-07-11", time: "10:00" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.createAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error creating appointment" });
    });
});

// Test for updateAppointment
describe("medAppointmentController.updateAppointment", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it("should update the appointment and return a JSON response", async() => {
        const mockAppointment = { id: 1, user_id: 1, date: "2025-07-11", time: "10:30"}

        medAppointment.updateAppointment.mockResolvedValue(mockAppointment);

        const req = { user: { id: 1 }, params: { appointment_id: 1 }, body: { date: "2025-07-11", time: "10:30" } };
        const res = {
            status : jest.fn().mockReturnThis(),
            json : jest.fn()
        };

        await medAppointmentController.updateAppointment(req, res);

        expect(medAppointment.updateAppointment).toHaveBeenCalledTimes(1);
        expect(medAppointment.updateAppointment).toHaveBeenCalledWith(1, 1, { date: "2025-07-11", time: "10:30"});
        expect(res.json).toHaveBeenCalledWith(mockAppointment)
    });

    it("should return 400 for invalid appointment id", async() => {
        const req = { user: { id: 1 }, params: { appointment_id: "invalid" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.updateAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid appointment ID" });
    });

    it("should return 404 if no appointment found", async() => {
        medAppointment.updateAppointment.mockResolvedValue(null);
        const req = { user: { id: 1 }, params: { appointment_id: 999 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.updateAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Appointment not found" });
    });

    it("should handle errors and return a 500 status", async() => {
        const errorMessage = "Database error";
        medAppointment.updateAppointment.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, params: { appointment_id: 1 }, body: { date: "2025-07-11", time: "10:30" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        await medAppointmentController.updateAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error updating appointment" });
    });
});

// Test for deleteAppointment
describe("medAppointmentController.deleteAppointment", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it("should delete the appointment", async() => {
        medAppointment.deleteAppointment.mockResolvedValue(true);

        const req = { user: { id: 1 }, params: { appointment_id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            end: jest.fn()
        };

        await medAppointmentController.deleteAppointment(req, res);

        expect(medAppointment.deleteAppointment).toHaveBeenCalledTimes(1);
        expect(medAppointment.deleteAppointment).toHaveBeenCalledWith(1, 1);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalledTimes(1);
    })

    it("should return 400 for invalid appointment id", async() => {
        const req = { user: { id: 1 }, params: { appointment_id: "invalid" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.deleteAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid appointment ID" });
    });

    it("should return 404 if appointment not found", async() => {
        medAppointment.deleteAppointment.mockResolvedValue(false);

        const req = { user: { id: 1 }, params: { appointment_id: 999 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.deleteAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Appointment not found" });
    });

    it("should handle errors and return a 500 status", async() => {
        const errorMessage = "Database error";
        medAppointment.deleteAppointment.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, params: { appointment_id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.deleteAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error deleting appointment" });
    });
});

// Test for searchAppointments
describe("medAppointmentController.searchAppointments", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should search appointments by term and return a JSON response", async () => {
        const mockAppointments = [
            { id: 1, userID: 1, date: "2025-07-11", time: "10:00" },
            { id: 2, userID: 1, date: "2025-07-12", time: "11:00" }
        ];

        medAppointment.searchAppointments.mockResolvedValue(mockAppointments);

        const req = { user: { id: 1 }, query: { searchTerm: "2025-07" } };
        const res = { json: jest.fn() };

        await medAppointmentController.searchAppointments(req, res);

        expect(medAppointment.searchAppointments).toHaveBeenCalledTimes(1);
        expect(medAppointment.searchAppointments).toHaveBeenCalledWith("2025-07", 1);
        expect(res.json).toHaveBeenCalledWith(mockAppointments);
    });

    it("should return 400 for missing search term", async () => {
        const req = { user: { id: 1 }, query: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.searchAppointments(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Search term is required" });
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        medAppointment.searchAppointments.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, query: { searchTerm: "2025-07" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await medAppointmentController.searchAppointments(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error searching appointments" });
    });
});

