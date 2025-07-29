const feedbackModel = require('../models/feedbackModel');
const sql = require('mssql');

jest.mock("mssql");

// Test getAllFeedbacksByUser
describe("feedbackModel.getAllFeedbacksByUser", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve all feedbacks for a user", async () => {
        const mockFeedbacks = [
            { 
                feedback_id: 1, 
                user_id: 1, 
                title: "Calendar cannot load", 
                creation_date: "2025-07-11" 
            },
            { 
                feedback_id: 2, 
                user_id: 1, 
                title: "Cannot delete appointment", 
                creation_date: "2025-07-12" 
            }
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockFeedbacks }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

        const feedbacks = await feedbackModel.getAllFeedbacksByUser(1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(feedbacks).toHaveLength(2);
        expect(feedbacks[0].feedback_id).toBe(1);
        expect(feedbacks[0].user_id).toBe(1);
        expect(feedbacks[0].title).toBe("Calendar cannot load");
        expect(feedbacks[0].creation_date).toBe("2025-07-11");
        expect(feedbacks[1].feedback_id).toBe(2);
        expect(feedbacks[1].user_id).toBe(1);
        expect(feedbacks[1].title).toBe("Cannot delete appointment");
        expect(feedbacks[1].creation_date).toBe("2025-07-12");
    });

    it("should handle error when retrieving feedbacks", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.getAllFeedbacksByUser(1)).rejects.toThrow(errorMessage);
    });
});

// Test getAllFeedbacks
describe("feedbackModel.getAllFeedbacks", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve all feedbacks", async () => {
        const mockFeedbacks = [
            { 
                feedback_id: 1, 
                user_id: 1, 
                title: "Calendar cannot load", 
                creation_date: "2025-07-11" 
            },
            { 
                feedback_id: 2, 
                user_id: 2, 
                title: "Cannot delete appointment", 
                creation_date: "2025-07-12" 
            }
        ];

        const mockRequest = {
            query: jest.fn().mockResolvedValue({ recordset: mockFeedbacks }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

        const feedbacks = await feedbackModel.getAllFeedbacks();

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(feedbacks).toHaveLength(2);
        expect(feedbacks[0].feedback_id).toBe(1);
        expect(feedbacks[0].user_id).toBe(1);
        expect(feedbacks[0].title).toBe("Calendar cannot load");
        expect(feedbacks[0].creation_date).toBe("2025-07-11");
        expect(feedbacks[1].feedback_id).toBe(2);
        expect(feedbacks[1].user_id).toBe(2);
        expect(feedbacks[1].title).toBe("Cannot delete appointment");
        expect(feedbacks[1].creation_date).toBe("2025-07-12");
    });

    it("should handle error when retrieving all feedbacks", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.getAllFeedbacks()).rejects.toThrow(errorMessage);
    });
});

// Test getFeedbackById
describe("feedbackModel.getFeedbackById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve feedback by ID", async () => {
        const mockFeedback = { 
            feedback_id: 1, 
            user_id: 1, 
            title: "Calendar cannot load", 
            creation_date: "2025-07-11" 
        };

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [mockFeedback] }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

        const feedback = await feedbackModel.getFeedbackById(1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(feedback.feedback_id).toBe(1);
        expect(feedback.user_id).toBe(1);
        expect(feedback.title).toBe("Calendar cannot load");
        expect(feedback.creation_date).toBe("2025-07-11");
    });

    it("should handle error when retrieving feedback by ID", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.getFeedbackById(1)).rejects.toThrow(errorMessage);
    });
});

// Test createFeedback
describe("feedbackModel.createFeedback", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create new feedback", async () => {
        const mockNewFeedbackId = 1;
        const mockFeedback = { 
            feedback_id: 1, 
            user_id: 1, 
            title: "Calendar cannot load", 
            creation_date: "2025-07-11" 
        };

        // Mock the INSERT operation that returns the new feedback ID
        const mockInsertRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ 
                recordset: [{ feedback_id: mockNewFeedbackId }] 
            }),
        };
        const mockInsertConnection = {
            request: jest.fn().mockReturnValue(mockInsertRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        // Mock for SELECT operation (getFeedbackById)
        const mockSelectRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [mockFeedback] }),
        };
        const mockSelectConnection = {
            request: jest.fn().mockReturnValue(mockSelectRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        // sql.connect returns different connections for each call
        sql.connect
            .mockResolvedValueOnce(mockInsertConnection)  // First call - createFeedback
            .mockResolvedValueOnce(mockSelectConnection); // Second call - getFeedbackById

        const feedback = await feedbackModel.createFeedback(1, { title: "Calendar cannot load" });

        // Verify both connections were used and closed
        expect(sql.connect).toHaveBeenCalledTimes(2);
        expect(mockInsertConnection.close).toHaveBeenCalledTimes(1);
        expect(mockSelectConnection.close).toHaveBeenCalledTimes(1);

        // Verify the returned feedback data
        expect(feedback.feedback_id).toBe(1);
        expect(feedback.user_id).toBe(1);
        expect(feedback.title).toBe("Calendar cannot load");
        expect(feedback.creation_date).toBe("2025-07-11");
    });

    it("should handle error when creating feedback", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.createFeedback(1, { title: "Calendar cannot load" })).rejects.toThrow(errorMessage);
    });
});

// Test updateFeedback
describe("feedbackModel.updateFeedback", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update feedback by ID", async () => {
        const mockFeedback = { 
            feedback_id: 1, 
            user_id: 1, 
            title: "Calendar cannot load - Updated", 
            creation_date: "2025-07-11" 
        };

        // Mock the UPDATE operation
        const mockUpdateRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
        };
        const mockUpdateConnection = {
            request: jest.fn().mockReturnValue(mockUpdateRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        // Mock for SELECT operation (getFeedbackById)
        const mockSelectRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [mockFeedback] }),
        };
        const mockSelectConnection = {
            request: jest.fn().mockReturnValue(mockSelectRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        // sql.connect returns different connections for each call
        sql.connect
            .mockResolvedValueOnce(mockUpdateConnection)  // First call - updateFeedback
            .mockResolvedValueOnce(mockSelectConnection); // Second call - getFeedbackById

        const feedback = await feedbackModel.updateFeedback(1, 1, { title: "Calendar cannot load - Updated" });

        // Verify both connections were used and closed
        expect(sql.connect).toHaveBeenCalledTimes(2);
        expect(mockUpdateConnection.close).toHaveBeenCalledTimes(1);
        expect(mockSelectConnection.close).toHaveBeenCalledTimes(1);

        // Verify the returned feedback data
        expect(feedback.feedback_id).toBe(1);
        expect(feedback.user_id).toBe(1);
        expect(feedback.title).toBe("Calendar cannot load - Updated");
        expect(feedback.creation_date).toBe("2025-07-11");
    });

    it("should handle error when updating feedback", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.updateFeedback(1, 1, { title: "Calendar cannot load - Updated" })).rejects.toThrow(errorMessage);
    });
});

// Test editFeedbackStatus
describe("feedbackModel.editFeedbackStatus", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update feedback status by ID", async () => {
        const mockFeedback = { 
            feedback_id: 1, 
            user_id: 1, 
            title: "Calendar cannot load", 
            creation_date: "2025-07-11", 
            status: "Resolved" 
        };

        // Mock the UPDATE operation
        const mockUpdateRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
        };
        const mockUpdateConnection = {
            request: jest.fn().mockReturnValue(mockUpdateRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        // Mock for SELECT operation (getFeedbackById)
        const mockSelectRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [mockFeedback] }),
        };
        const mockSelectConnection = {
            request: jest.fn().mockReturnValue(mockSelectRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        // sql.connect returns different connections for each call
        sql.connect
            .mockResolvedValueOnce(mockUpdateConnection)  // First call - editFeedbackStatus
            .mockResolvedValueOnce(mockSelectConnection); // Second call - getFeedbackById

        const feedback = await feedbackModel.editFeedbackStatus(1, "Resolved");

        // Verify both connections were used and closed
        expect(sql.connect).toHaveBeenCalledTimes(2);
        expect(mockUpdateConnection.close).toHaveBeenCalledTimes(1);
        expect(mockSelectConnection.close).toHaveBeenCalledTimes(1);

        // Verify the returned feedback data
        expect(feedback.feedback_id).toBe(1);
        expect(feedback.user_id).toBe(1);
        expect(feedback.title).toBe("Calendar cannot load");
        expect(feedback.creation_date).toBe("2025-07-11");
        expect(feedback.status).toBe("Resolved");
    });

    it("should handle error when updating feedback status", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.editFeedbackStatus(1, "Resolved")).rejects.toThrow(errorMessage);
    });
});

// Test deleteFeedback
describe("feedbackModel.deleteFeedback", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete feedback by ID", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

        const result = await feedbackModel.deleteFeedback(1, 1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
    });

    it("should handle error when deleting feedback", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.deleteFeedback(1, 1)).rejects.toThrow(errorMessage);
    });
});

// Test deleteFeedbackAdmin
describe("feedbackModel.deleteFeedbackAdmin", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete feedback by ID for admin", async () => {
        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ rowsAffected: [1] }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

        const result = await feedbackModel.deleteFeedbackAdmin(1);

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
    });

    it("should handle error when deleting feedback for admin", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.deleteFeedbackAdmin(1)).rejects.toThrow(errorMessage);
    });
});

// Test searchFeedbacks
describe("feedbackModel.searchFeedbacks", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should search feedbacks by term", async () => {
        const mockFeedbacks = [
            { 
                feedback_id: 1, 
                user_id: 1, 
                title: "Calendar cannot load", 
                creation_date: "2025-07-11" 
            },
            { 
                feedback_id: 2, 
                user_id: 2, 
                title: "Cannot delete appointment", 
                creation_date: "2025-07-12" 
            }
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockFeedbacks }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

        const feedbacks = await feedbackModel.searchFeedbacks("Calendar");

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(feedbacks).toHaveLength(2);
        expect(feedbacks[0].feedback_id).toBe(1);
        expect(feedbacks[0].user_id).toBe(1);
        expect(feedbacks[0].title).toBe("Calendar cannot load");
        expect(feedbacks[0].creation_date).toBe("2025-07-11");
        expect(feedbacks[1].feedback_id).toBe(2);
        expect(feedbacks[1].user_id).toBe(2);
        expect(feedbacks[1].title).toBe("Cannot delete appointment");
        expect(feedbacks[1].creation_date).toBe("2025-07-12");
    });

    it("should handle error when searching feedbacks", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.searchFeedbacks("Calendar")).rejects.toThrow(errorMessage);
    });
});

// Test searchFeedbacksAdmin
describe("feedbackModel.searchFeedbacksAdmin", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should search feedbacks by term for admin", async () => {
        const mockFeedbacks = [
            { 
                feedback_id: 1, 
                user_id: 1, 
                title: "Calendar cannot load", 
                creation_date: "2025-07-11" 
            },
            { 
                feedback_id: 2, 
                user_id: 2, 
                title: "Cannot delete appointment", 
                creation_date: "2025-07-12" 
            }
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: mockFeedbacks }),
        };
        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };

        sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

        const feedbacks = await feedbackModel.searchFeedbacksAdmin("Calendar");

        expect(sql.connect).toHaveBeenCalledWith(expect.any(Object));
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(feedbacks).toHaveLength(2);
        expect(feedbacks[0].feedback_id).toBe(1);
        expect(feedbacks[0].user_id).toBe(1);
        expect(feedbacks[0].title).toBe("Calendar cannot load");
        expect(feedbacks[0].creation_date).toBe("2025-07-11");
        expect(feedbacks[1].feedback_id).toBe(2);
        expect(feedbacks[1].user_id).toBe(2);
        expect(feedbacks[1].title).toBe("Cannot delete appointment");
        expect(feedbacks[1].creation_date).toBe("2025-07-12");
    });

    it("should handle error when searching feedbacks for admin", async () => {
        const errorMessage = "Database Error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(feedbackModel.searchFeedbacksAdmin("Calendar")).rejects.toThrow(errorMessage);
    });
});