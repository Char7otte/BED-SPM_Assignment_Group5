const sql = require("mssql");
const config = require("../../../dbConfig");

async function getAllMessagesInAChat(chatID) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `SELECT * FROM ChatMessage WHERE ChatID = @chatID ORDER BY MessageID asc`;
        const request = connection.request();
        request.input("chatID", chatID);
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error("Database error:", error);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                console.error("Error closing connection:", error);
            }
        }
    }
}

async function createMessage(chatID, senderID, message) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `
        INSERT INTO ChatMessage (ChatID, SenderID, Message)
        VALUES(@chatID, @senderID, @message)`;
        const request = connection.request();
        request.input("chatID", chatID).input("senderID", senderID).input("message", message);
        const result = await request.query(query);
        return result.rowsAffected != 0;
    } catch (error) {
        console.error("Database error:", error);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                console.error("Error closing connection:", error);
            }
        }
    }
}

async function editMessage(chatID, messageID, newMessage) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `
        UPDATE ChatMessage 
        SET Message = @newMessage 
        WHERE ChatID = @chatID AND MessageID = @messageID`;
        const request = connection.request();
        request.input("chatID", chatID).input("messageID", messageID).input("newMessage", newMessage);
        const result = await request.query(query);
        return result.rowsAffected != 0;
    } catch (error) {
        console.error("Database error:", error);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                console.error("Error closing connection:", error);
            }
        }
    }
}

async function deleteMessage(chatID, messageID) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `DELETE FROM ChatMessage WHERE ChatID = @chatID AND MessageID = @messageID`;
        const request = connection.request();
        request.input("chatID", chatID).input("messageID", messageID);
        const result = await request.query(query);
        return result.rowsAffected != 0;
    } catch (error) {
        console.error("Database error:", error);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                console.error("Error closing connection:", error);
            }
        }
    }
}

module.exports = {
    getAllMessagesInAChat,
    createMessage,
    editMessage,
    deleteMessage,
};
