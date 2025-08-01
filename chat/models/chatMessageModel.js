const sql = require("mssql");
const config = require("../../dbConfig");

async function getAllMessagesInAChat(chatID) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `SELECT cm.*, u.username FROM ChatMessages cm INNER JOIN Users u ON cm.sender_id = u.user_id WHERE chat_id = @chatID ORDER BY message_id asc`;
        const request = connection.request();
        request.input("chatID", chatID);
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error("Database error:", error);
        throw error;
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
        INSERT INTO ChatMessages (chat_id, sender_id, message)
        VALUES(@chatID, @senderID, @message)`;
        const request = connection.request();
        request.input("chatID", chatID).input("senderID", senderID).input("message", message);
        const result = await request.query(query);
        return result.rowsAffected != 0;
    } catch (error) {
        console.error("Database error:", error);
        throw error;
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
        UPDATE ChatMessages 
        SET message = @newMessage 
        WHERE chat_id = @chatID AND message_id = @messageID`;
        const request = connection.request();
        request.input("chatID", chatID).input("messageID", messageID).input("newMessage", newMessage);
        const result = await request.query(query);
        return result.rowsAffected != 0;
    } catch (error) {
        console.error("Database error:", error);
        throw error;
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
        const query = `DELETE FROM ChatMessages WHERE chat_id = @chatID AND message_id = @messageID`;
        const request = connection.request();
        request.input("chatID", chatID).input("messageID", messageID);
        const result = await request.query(query);
        return result.rowsAffected != 0;
    } catch (error) {
        console.error("Database error:", error);
        throw error;
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
