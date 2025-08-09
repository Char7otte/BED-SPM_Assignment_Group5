const chatController = require("../controllers/chatController");
const Chat = require("../models/chatModel");
const { addHours, format } = require("date-and-time");

jest.mock("../models/chatModel.js");
jest.mock("date-and-time");

describe("chatController getAllChats", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Retrieve all chats when logged in user has the role 'U'", async () => {
        const mockChats = [
            {
                chatID: 1,
                title: "Title1",
                created_date_time: new Date("2025-08-09T10:30:00"),
                last_activity_date_time: new Date("2025-08-09T10:30:00"),
            },
            {
                chatID: 2,
                title: "Title2",
                created_date_time: new Date("2025-08-09T10:30:00"),
                last_activity_date_time: new Date("2025-08-09T10:30:00"),
            },
        ];

        Chat.getAllChatsByHelpeeID.mockResolvedValue(mockChats);
        addHours.mockReturnValue(new Date("2025-08-09T02:30:00"));
        format.mockReturnValue("Fri, 9 Aug 2025 02:30 AM");

        const req = {
            user: {
                id: 17,
                role: "U",
            },
        };
        const res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.getAllChats(req, res);

        // Expected chats with formatted dates
        const expectedChats = [
            {
                chatID: 1,
                title: "Title1",
                created_date_time: "Fri, 9 Aug 2025 02:30 AM",
                last_activity_date_time: "Fri, 9 Aug 2025 02:30 AM",
            },
            {
                chatID: 2,
                title: "Title2",
                created_date_time: "Fri, 9 Aug 2025 02:30 AM",
                last_activity_date_time: "Fri, 9 Aug 2025 02:30 AM",
            },
        ];

        expect(Chat.getAllChatsByHelpeeID).toHaveBeenCalledTimes(1);
        expect(Chat.getAllChatsByHelpeeID).toHaveBeenCalledWith(17);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith("chat/allChats", {
            chatData: expectedChats,
            userID: 17,
            userRole: "U",
        });
    });

    test("Retrieve all chats when logged in user has the role 'A'", async () => {
        const mockChats = [
            {
                chatID: 1,
                title: "Title1",
                created_date_time: new Date("2025-08-09T10:30:00"),
                last_activity_date_time: new Date("2025-08-09T10:30:00"),
            },
            {
                chatID: 2,
                title: "Title2",
                created_date_time: new Date("2025-08-09T10:30:00"),
                last_activity_date_time: new Date("2025-08-09T10:30:00"),
            },
        ];

        Chat.getAllChats.mockResolvedValue(mockChats);

        const req = {
            user: {
                id: 17,
                role: "A",
            },
        };
        const res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.getAllChats(req, res);

        // Expected chats with formatted dates
        const expectedChats = [
            {
                chatID: 1,
                title: "Title1",
                created_date_time: "Fri, 9 Aug 2025 02:30 AM",
                last_activity_date_time: "Fri, 9 Aug 2025 02:30 AM",
            },
            {
                chatID: 2,
                title: "Title2",
                created_date_time: "Fri, 9 Aug 2025 02:30 AM",
                last_activity_date_time: "Fri, 9 Aug 2025 02:30 AM",
            },
        ];

        expect(Chat.getAllChats).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith("chat/allChats", {
            chatData: expectedChats,
            userID: 17,
            userRole: "A",
        });
    });

    test("Handle error when retrieving chats", async () => {
        Chat.getAllChats.mockRejectedValue(new Error("Database error"));

        const req = {
            user: {
                id: 17,
                role: "A",
            },
        };
        const res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.getAllChats(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error retrieving chats");
    });
});

describe("chatController getChatByID", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Retrieve chat by ID successfully", async () => {
        const mockChat = { chatID: 1, title: "Chat1", userID: 4 };
        Chat.getChatByID.mockResolvedValue(mockChat);

        const req = { params: { chatID: "1" } };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.getChatByID(req, res);

        expect(Chat.getChatByID).toHaveBeenCalledWith("1");
        expect(res.json).toHaveBeenCalledWith(mockChat);
    });

    test("Return 404 when chat not found", async () => {
        Chat.getChatByID.mockResolvedValue(null);

        const req = { params: { chatID: "999" } };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.getChatByID(req, res);

        expect(Chat.getChatByID).toHaveBeenCalledWith("999");
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith("Chat not found.");
    });

    test("Handle error when retrieving chat by ID", async () => {
        Chat.getChatByID.mockRejectedValue(new Error("Database error"));

        const req = { params: { chatID: "1" } };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.getChatByID(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error retrieving chat");
    });
});

describe("chatController createChat", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Create chat successfully", async () => {
        const mockNewChat = { chat_id: 5, title: "NewChat5", userID: 4 };

        Chat.createChat.mockResolvedValue(mockNewChat);

        const req = {
            params: { userID: "4" },
            body: { question: "NewChat5" },
        };
        const res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.createChat(req, res);

        expect(Chat.createChat).toHaveBeenCalledWith("4", "NewChat5");
        expect(res.redirect).toHaveBeenCalledWith(`/chats/5`);
    });

    test("Return 400 when chatModel.createChat returns null", async () => {
        Chat.createChat.mockResolvedValue(null);

        const req = {
            params: { userID: "4" },
            body: { question: "NewChat5" },
        };
        const res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.createChat(req, res);

        expect(Chat.createChat).toHaveBeenCalledWith("4", "NewChat5");
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("Error creating chat.");
    });
});

describe("chatController deleteChat", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Delete chat successfully", async () => {
        Chat.deleteChat.mockResolvedValue(true);

        const req = { params: { chatID: "1" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            end: jest.fn(),
            send: jest.fn(),
        };

        await chatController.deleteChat(req, res);

        expect(Chat.deleteChat).toHaveBeenCalledWith("1");
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalledTimes(1);
    });

    test("Return 404 when chat ID not found for deletion", async () => {
        Chat.deleteChat.mockResolvedValue(false);

        const req = { params: { chatID: "999" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            end: jest.fn(),
            send: jest.fn(),
        };

        await chatController.deleteChat(req, res);

        expect(Chat.deleteChat).toHaveBeenCalledWith("999");
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith("Chat not found");
    });

    test("Handle error when deleting chat", async () => {
        Chat.deleteChat.mockRejectedValue(new Error("Database error"));

        const req = { params: { chatID: "1" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            end: jest.fn(),
            send: jest.fn(),
        };

        await chatController.deleteChat(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error deleting chat");
    });
});

describe("chatController markChatAsAnswered", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Mark as answered", async () => {
        Chat.markChatAsAnswered.mockResolvedValue(true);

        const req = { params: { chatID: "1" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            redirect: jest.fn(),
        };

        await chatController.markChatAsAnswered(req, res);

        expect(Chat.markChatAsAnswered).toHaveBeenCalledTimes(1);
        expect(Chat.markChatAsAnswered).toHaveBeenCalledWith("1");
        expect(res.redirect).toHaveBeenCalledWith("/chats/1");
    });

    test("Mark as answered", async () => {
        Chat.markChatAsAnswered.mockResolvedValue(false);

        const req = { params: { chatID: "1" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            redirect: jest.fn(),
        };

        await chatController.markChatAsAnswered(req, res);

        expect(Chat.markChatAsAnswered).toHaveBeenCalledTimes(1);
        expect(Chat.markChatAsAnswered).toHaveBeenCalledWith("1");
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error updating chat status");
    });

    test("Handle error when updating chat status", async () => {
        Chat.markChatAsAnswered.mockRejectedValue(new Error("Database error"));

        const req = { params: { chatID: "1" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            end: jest.fn(),
            send: jest.fn(),
        };

        await chatController.markChatAsAnswered(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error updating chat status");
    });
});

describe("chatController searchClosedChats", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Return closed chats", async () => {
        const mockChats = [
            {
                chatID: 1,
                title: "Title1",
                created_date_time: new Date("2025-08-09T10:30:00"),
                last_activity_date_time: new Date("2025-08-09T10:30:00"),
            },
            {
                chatID: 2,
                title: "Title2",
                created_date_time: new Date("2025-08-09T10:30:00"),
                last_activity_date_time: new Date("2025-08-09T10:30:00"),
            },
        ];

        Chat.searchClosedChats.mockResolvedValue(mockChats);
        addHours.mockReturnValue(new Date("2025-08-09T02:30:00"));
        format.mockReturnValue("Fri, 9 Aug 2025 02:30 AM");

        const req = {
            user: {
                id: 17,
                role: "U",
            },
            query: {
                q: "searchQuery",
            },
        };
        const res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.searchClosedChats(req, res);

        expect(Chat.searchClosedChats).toHaveBeenCalledTimes(1);
        expect(Chat.searchClosedChats).toHaveBeenCalledWith("%searchQuery%");
        expect(res.render).toHaveBeenCalledWith("chat/allChatsSearch", {
            chatData: mockChats,
            userID: 17,
            searchQuery: "searchQuery",
            userRole: "U",
        });
    });

    test("Handle database error when searching closed chats", async () => {
        Chat.searchClosedChats.mockRejectedValue(new Error("Database error"));
        const req = {
            user: {
                id: "17",
                role: "U",
            },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.searchClosedChats(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error getting chats");
    });
});
