const sql = require("mssql");

const Chat = require("../models/chatModel");

jest.mock("mssql");

const mockRequest = {
    query: jest.fn(),
    input: jest.fn().mockReturnThis(),
};

const mockConnection = {
    request: jest.fn().mockReturnValue(mockRequest),
    close: jest.fn(),
};

describe("chatModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        sql.connect.mockResolvedValue(mockConnection);
    });

    describe("chatModel getAllChats", () => {
        test("Return all chats successfully", async () => {
            const mockChats = [
                {
                    chatID: 1,
                    title: "Title1",
                },
                {
                    chatID: 2,
                    title: "Title2",
                },
            ];

            mockRequest.query.mockResolvedValue({ recordset: mockChats });

            const chats = await Chat.getAllChats();

            expect(mockRequest.query).toHaveBeenCalledWith(`SELECT c.*, u.username
        FROM Chats c
        INNER JOIN Users u
        ON c.helpee_id = u.user_id
        WHERE is_deleted = 0
        ORDER BY chat_status desc`);
            expect(chats).toEqual(mockChats);
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });

        test("Handle database errors gracefully", async () => {
            mockRequest.query.mockRejectedValue(new Error("Database error"));

            await expect(Chat.getAllChats()).rejects.toThrow("Database error");
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });
    });

    describe("chatModel getChatByID", () => {
        test("Return chat by ID successfully", async () => {
            const mockChat = { chatID: 1, title: "Title1" };

            mockRequest.query.mockResolvedValue({ recordset: [mockChat] });

            const chat = await Chat.getChatByID(1);

            expect(mockRequest.input).toHaveBeenCalledWith("chatID", 1);
            expect(mockRequest.query).toHaveBeenCalledWith("SELECT * FROM Chats WHERE chat_id = @chatID");
            expect(chat).toEqual(mockChat);
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });

        test("Return undefined when chat not found", async () => {
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const chat = await Chat.getChatByID(999);

            expect(chat).toBeUndefined();
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });

        test("Handle database errors gracefully", async () => {
            mockRequest.query.mockRejectedValue(new Error("Database error"));

            await expect(Chat.getChatByID(1)).rejects.toThrow("Database error");
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });
    });

    describe("chatModel createChat", () => {
        test("Create chat successfully", async () => {
            const newChatID = 5;
            mockRequest.query.mockResolvedValue({ recordset: [{ newChatID }] });

            const chatID = await Chat.createChat(4);

            expect(mockRequest.input).toHaveBeenCalledWith("creatorUserID", 4);
            expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO Chats"));
            expect(chatID).toStrictEqual({ newChatID });
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });

        test("Handle database errors gracefully", async () => {
            mockRequest.query.mockRejectedValue(new Error("Database error"));

            await expect(Chat.createChat(4)).rejects.toThrow("Database error");
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });
    });

    describe("chatModel deleteChat", () => {
        test("Delete chat successfully", async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

            const isDeleted = await Chat.deleteChat(1);

            expect(mockRequest.input).toHaveBeenCalledWith("chatID", 1);
            expect(mockRequest.query).toHaveBeenCalledWith("UPDATE Chats SET is_deleted = 1 WHERE chat_id = @chatID");
            expect(isDeleted).toBe(true);
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });

        test("Return false when no rows affected", async () => {
            mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

            const isDeleted = await Chat.deleteChat(999);

            expect(isDeleted).toBe(false);
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });

        test("Handle database errors gracefully", async () => {
            mockRequest.query.mockRejectedValue(new Error("Database error"));

            await expect(Chat.deleteChat(1)).rejects.toThrow("Database error");
            expect(mockConnection.close).toHaveBeenCalledTimes(1);
        });
    });
});
