const sql = require("mssql");
const config = require("../../dbConfig");

async function getAllChats() {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `SELECT * FROM Chat`;
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
        const query = `SELECT * FROM Chat WHERE ChatID = @chatID`;
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
        const query = `INSERT INTO Chat (HelpeeID) VALUES(@creatorUserID) SELECT SCOPE_IDENTITY() AS newChatID`;
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
        const query = `DELETE FROM Chat WHERE ChatID = @chatID`;
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
