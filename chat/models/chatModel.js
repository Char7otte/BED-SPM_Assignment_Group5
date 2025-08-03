const sql = require("mssql");
const config = require("../../dbConfig");

async function getAllChats() {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `SELECT c.*, u.username
        FROM Chats c
        INNER JOIN Users u
        ON c.helpee_id = u.user_id
        WHERE is_deleted = 0
        ORDER BY chat_status desc`;
        const request = connection.request();
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

async function getAllChatsByHelpeeID(userID) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `SELECT c.*, u.username
        FROM Chats c
        INNER JOIN Users u
        ON c.helpee_id = u.user_id
        WHERE is_deleted = 0 and helpee_id = @userID
        ORDER BY chat_status desc`;
        const request = connection.request();
        request.input("userID", userID);
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

async function createChat(creatorUserID, chatTitle) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `INSERT INTO Chats (helpee_id, title) VALUES(@creatorUserID, @chatTitle) SELECT * FROM Chats WHERE chat_id = SCOPE_IDENTITY()`;
        const request = connection.request();
        request.input("creatorUserID", creatorUserID).input("chatTitle", chatTitle);
        const result = await request.query(query);

        return result.recordset[0];
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

async function deleteChat(chatID) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `UPDATE Chats SET is_deleted = 1 WHERE chat_id = @chatID`;
        const request = connection.request();
        request.input("chatID", chatID);
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

async function markChatAsAnswered(chatID) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `UPDATE Chats SET chat_status = 'Closed' WHERE chat_id = @chatID`;
        const request = connection.request();
        request.input("chatID", chatID);
        const result = await request.query(query);
        console.log(result);
        return result.rowsAffected;
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

async function searchClosedChats(searchQuery) {
    let connection;
    try {
        connection = await sql.connect(config);
        const query = `SELECT * FROM Chats WHERE chat_status = 'Closed' AND  title LIKE @searchQuery`;
        const request = connection.request();
        request.input("searchQuery", searchQuery);
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

module.exports = {
    getAllChats,
    getAllChatsByHelpeeID,
    getChatByID,
    createChat,
    deleteChat,
    markChatAsAnswered,
    searchClosedChats,
};
