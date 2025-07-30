const feedbackController = require('../controllers/feedbackController');
const feedbackModel = require('../models/feedbackModel');

jest.mock('../models/feedbackModel');

// Test for getAllFeedbacksByUser
describe("feedbackController.getAllFeedbacksByUser", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return all feedbacks for a user and return a JSON response", async () => {
        const mockFeedbacks = [
            { id: 1, userId: 1, creation_date: '2025-07-01'},
            { id: 2, userId: 1, creation_date: '2025-07-02'},
        ];

        feedbackModel.getAllFeedbacksByUser.mockResolvedValue(mockFeedbacks);

        const req = { user: { id: 1 } };
        const res = { json: jest.fn() };

        await feedbackController.getAllFeedbacksByUser(req, res);

        expect(feedbackModel.getAllFeedbacksByUser).toHaveBeenCalledTimes(1);
        expect(feedbackModel.getAllFeedbacksByUser).toHaveBeenCalledWith(1);
        expect(res.json).toHaveBeenCalledWith(mockFeedbacks);
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        feedbackModel.getAllFeedbacksByUser.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.getAllFeedbacksByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving feedbacks" });
    });
});

// Test for getAllFeedbacks
describe("feedbackController.getAllFeedbacks", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return all feedbacks and return a JSON response", async () => {
        const mockFeedbacks = [
            { id: 1, userId: 1, creation_date: '2025-07-01'},
            { id: 2, userId: 2, creation_date: '2025-07-02'},
        ];

        feedbackModel.getAllFeedbacks.mockResolvedValue(mockFeedbacks);  

        const req = {};
        const res = { json: jest.fn() };

        await feedbackController.getAllFeedbacks(req, res);

        expect(feedbackModel.getAllFeedbacks).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith(mockFeedbacks);
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        feedbackModel.getAllFeedbacks.mockRejectedValue(new Error(errorMessage));

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.getAllFeedbacks(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving feedbacks" });
    });
});

// Test for createFeedback
describe("feedbackController.createFeedback", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create new feedback and return a 201 status with the created feedback", async () => {
        const mockNewFeedback = { id: 1, userId: 1, title: "Feedbacks not showing", creation_date: '2025-07-01' };
        feedbackModel.createFeedback.mockResolvedValue(mockNewFeedback);   

        const req = { user: { id: 1 }, body: { title: "Feedbacks not showing" } };
        const res = { 
            status: jest.fn().mockReturnThis(), 
            json: jest.fn() 
        };

        await feedbackController.createFeedback(req, res);

        expect(feedbackModel.createFeedback).toHaveBeenCalledTimes(1);
        expect(feedbackModel.createFeedback).toHaveBeenCalledWith(1, req.body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockNewFeedback);
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        feedbackModel.createFeedback.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, body: { content: "Great service!" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.createFeedback(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error creating feedback" });
    });
});

// Test for updateFeedback
describe("feedbackController.updateFeedback", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update feedback by ID and return a 200 status with the updated feedback", async () => {
        const mockUpdatedFeedback = { id: 1, userId: 1, title: "Updated feedback", creation_date: '2025-07-01' };
        feedbackModel.updateFeedback.mockResolvedValue(mockUpdatedFeedback);

        const req = { user: { id: 1 }, params: { feedback_id: 1 }, body: { title: "Updated feedback" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.updateFeedback(req, res);

        expect(feedbackModel.updateFeedback).toHaveBeenCalledTimes(1);
        expect(feedbackModel.updateFeedback).toHaveBeenCalledWith(1, 1, req.body);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockUpdatedFeedback);
    }); 

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        feedbackModel.updateFeedback.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, params: { feedback_id: 1 }, body: { title: "Updated feedback" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.updateFeedback(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error updating feedback" });
    });
});

// Test for editFeedbackStatus
describe("feedbackController.editFeedbackStatus", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update feedback status by ID and return a 200 status with the updated feedback", async () => {
        const mockUpdatedFeedback = { id: 1, userId: 1, title: "Feedbacks not showing", status: "Resolved", creation_date: '2025-07-01' };
        feedbackModel.editFeedbackStatus.mockResolvedValue(mockUpdatedFeedback);

        const req = { user: { id: 1 }, params: { feedback_id: 1 }, body: { status: "Resolved" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.editFeedbackStatus(req, res);

        expect(feedbackModel.editFeedbackStatus).toHaveBeenCalledTimes(1);
        expect(feedbackModel.editFeedbackStatus).toHaveBeenCalledWith(1, "Resolved");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockUpdatedFeedback);
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        feedbackModel.editFeedbackStatus.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, params: { feedback_id: 1 }, body: { status: "Resolved" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.editFeedbackStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error updating feedback" });
    });
});

// Test for deleteFeedback
describe("feedbackController.deleteFeedback", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete feedback by ID and return a 204 status", async () => {
        feedbackModel.deleteFeedback.mockResolvedValue(true);

        const req = { user: { id: 1 }, params: { feedback_id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            end: jest.fn()
        };

        await feedbackController.deleteFeedback(req, res);

        expect(feedbackModel.deleteFeedback).toHaveBeenCalledTimes(1);
        expect(feedbackModel.deleteFeedback).toHaveBeenCalledWith(1, 1);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        feedbackModel.deleteFeedback.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, params: { feedback_id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.deleteFeedback(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error deleting feedback" });
    });
});

// Test for deleteFeedbackAdmin
describe("feedbackController.deleteFeedbackAdmin", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete feedback by ID for admin and return a 204 status", async () => {
        feedbackModel.deleteFeedbackAdmin.mockResolvedValue(true);

        const req = { params: { feedback_id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            end: jest.fn()
        };

        await feedbackController.deleteFeedbackAdmin(req, res);

        expect(feedbackModel.deleteFeedbackAdmin).toHaveBeenCalledTimes(1);
        expect(feedbackModel.deleteFeedbackAdmin).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        feedbackModel.deleteFeedbackAdmin.mockRejectedValue(new Error(errorMessage));

        const req = { params: { feedback_id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.deleteFeedbackAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error deleting feedback" });
    });
});

// Test for searchFeedbacks
describe("feedbackController.searchFeedbacks", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return feedbacks matching search term for a user and return a JSON response", async () => {
        const mockFeedbacks = [
            { id: 1, userId: 1, title: "Feedbacks not showing", creation_date: '2025-07-01'},
            { id: 2, userId: 1, title: "Feedbacks showing correctly", creation_date: '2025-07-02'},
        ];

        feedbackModel.searchFeedbacks.mockResolvedValue(mockFeedbacks);

        const req = { user: { id: 1 }, query: { searchTerm: "showing" } };
        const res = { json: jest.fn() };

        await feedbackController.searchFeedbacks(req, res);

        expect(feedbackModel.searchFeedbacks).toHaveBeenCalledTimes(1);
        expect(feedbackModel.searchFeedbacks).toHaveBeenCalledWith("showing", 1);
        expect(res.json).toHaveBeenCalledWith(mockFeedbacks);
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        feedbackModel.searchFeedbacks.mockRejectedValue(new Error(errorMessage));

        const req = { user: { id: 1 }, query: { searchTerm: "showing" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.searchFeedbacks(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error searching feedbacks" });
    });
});

// Test for searchFeedbacksAdmin
describe("feedbackController.searchFeedbacksAdmin", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return feedbacks matching search term for admin and return a JSON response", async () => {
        const mockFeedbacks = [
            { id: 1, userId: 1, title: "Feedbacks not showing", creation_date: '2025-07-01'},
            { id: 2, userId: 2, title: "Feedbacks showing correctly", creation_date: '2025-07-02'},
        ];

        feedbackModel.searchFeedbacksAdmin.mockResolvedValue(mockFeedbacks);

        const req = { query: { searchTerm: "showing" } };
        const res = { json: jest.fn() };

        await feedbackController.searchFeedbacksAdmin(req, res);

        expect(feedbackModel.searchFeedbacksAdmin).toHaveBeenCalledTimes(1);
        expect(feedbackModel.searchFeedbacksAdmin).toHaveBeenCalledWith("showing");
        expect(res.json).toHaveBeenCalledWith(mockFeedbacks);
    });

    it("should handle errors and return a 500 status", async () => {
        const errorMessage = "Database error";
        feedbackModel.searchFeedbacksAdmin.mockRejectedValue(new Error(errorMessage));

        const req = { query: { searchTerm: "showing" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await feedbackController.searchFeedbacksAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error searching feedbacks" });
    });
});