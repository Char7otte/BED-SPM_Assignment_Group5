const chatController = require("../controllers/chatController");
const Chat = require("../models/chatModel");

jest.mock("../models/chatModel.js");

describe("chatController getAllChats", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Retrieve all chats when logged in user has the role 'U'", async () => {
        const mockChats = [
            { chatID: 1, title: "Title1" },
            { chatID: 2, title: "Title2" },
        ];

        Chat.getAllChatsByHelpeeID.mockResolvedValue(mockChats);

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

        expect(Chat.getAllChatsByHelpeeID).toHaveBeenCalledTimes(1);
        expect(Chat.getAllChatsByHelpeeID).toHaveBeenCalledWith(17);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith("chat/allChats", { chatData: mockChats });
    });

    test("Retrieve all chats when logged in user has the role 'A'", async () => {
        const mockChats = [
            { chatID: 1, title: "Title1" },
            { chatID: 2, title: "Title2" },
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

        expect(Chat.getAllChats).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith("chat/allChats", { chatData: mockChats });
    });

    test("Handle error when retrieving chats", async () => {
        Chat.getAllChats.mockRejectedValue(new Error("Database error"));

        const req = {};
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
        const newChatID = 5;
        const mockNewChat = { chatID: 5, title: "NewChat5", userID: 4 };

        Chat.createChat.mockResolvedValue(newChatID);
        Chat.getChatByID.mockResolvedValue(mockNewChat);

        const req = { params: { userID: "4" } };
        const res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.createChat(req, res);

        expect(Chat.createChat).toHaveBeenCalledWith("4");
        expect(Chat.getChatByID).toHaveBeenCalledWith(newChatID);
        expect(res.redirect).toHaveBeenCalledWith(`/chats/${newChatID}`);
    });

    test("Return 404 when createChat returns null", async () => {
        Chat.createChat.mockResolvedValue(null);

        const req = { params: { userID: "4" } };
        const res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.createChat(req, res);

        expect(Chat.createChat).toHaveBeenCalledWith("4");
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith("Error creating chat.");
    });

    test("Return 404 when newly created chat cannot be retrieved", async () => {
        const newChatID = 5;

        Chat.createChat.mockResolvedValue(newChatID);
        Chat.getChatByID.mockResolvedValue(null);

        const req = { params: { userID: "4" } };
        const res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.createChat(req, res);

        expect(Chat.createChat).toHaveBeenCalledWith("4");
        expect(Chat.getChatByID).toHaveBeenCalledWith(newChatID);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith("Error retrieving chat.");
    });

    test("Handle error when creating chat", async () => {
        Chat.createChat.mockRejectedValue(new Error("Database error"));

        const req = { params: { userID: "4" } };
        const res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await chatController.createChat(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error creating chat");
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
