const sql = require("mssql");
const path = require("path");
const dbConfig = require(path.join(__dirname, "..", "..", "dbConfig.js"));
// const dbConfig = require("../dbConfig.js");

// get all notes
async function getAllNotes() {
    let connection; // Declare connection outside try for finally access
    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request().query("SELECT * FROM Notes;");
        return result.recordset;
    } catch (error) {
        console.error("Database error in getAllNotes:", error); // More specific error logging
        throw error; // Re-throw the error for the controller to handle
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing connection after getAllNotes:", err);
            }
        }
    }
}

// get note by id
async function searchNotes(searchTerm) {
    let connection; // Declare connection outside try for finally access
    try {
        connection = await sql.connect(dbConfig);

        // Use parameterized query to prevent SQL injection
        const query = `
    SELECT *
    FROM Notes
    WHERE NoteTitle LIKE @searchTerm
        OR NoteContent LIKE @searchTerm
    `;

        const request = connection.request();
        request.input("searchTerm", sql.NVarChar, `%${searchTerm}%`); // Explicitly define type
        const result = await request.query(query);
        return result.recordset;
        // logic if no notes have searchTerm
    } catch (error) {
        console.error("Database error in searchNotes:", error); // More specific error logging
        throw error; // Re-throw the error for the controller to handle
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing connection after searchNotes:", err);
            }
        }
    }
}

module.exports = {
    // ... existing exports ...
    searchNotes,
};

// create note

// update note

//delete note

// module.exports to export model functions
module.exports = {
    getAllNotes,
    searchNotes,
    // createNote,
    // updateNote,
    // deleteNote
}