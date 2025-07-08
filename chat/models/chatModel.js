const sql = require("mssql");
const config = require("../../dbConfig");

async function getAllChats() {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `SELECT c.chat_id, c.helpee_id, u.username, c.status, c.created_date_time, c.last_activity_date_time
        FROM Chats c
        INNER JOIN Users u
        ON c.helpee_id = u.user_id`;
        const request = connection.request();
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

async function getChatByID(chatID) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `SELECT * FROM Chats WHERE chat_id = @chatID`;
        const request = connection.request();
        request.input("chatID", chatID);
        const result = await request.query(query);
        return result.recordset[0];
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

async function createChat(creatorUserID) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `INSERT INTO Chats (helpee_id, title) VALUES(@creatorUserID, 'test123') SELECT SCOPE_IDENTITY() AS newChatID`;
        const request = connection.request();
        request.input("creatorUserID", creatorUserID);
        const result = await request.query(query);

        return result.recordset[0].newChatID;
    } catch (error) {
        console.error("Database error:", error);
        return null;
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

async function deleteChat(chatID) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `DELETE FROM Chats WHERE chat_id = @chatID`;
        const request = connection.request();
        request.input("chatID", chatID);
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
    getAllChats,
    getChatByID,
    createChat,
    deleteChat,
};
