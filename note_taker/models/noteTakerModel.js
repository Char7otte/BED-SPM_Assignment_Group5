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

// get note by search term
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

// create note
async function createNote(noteData) {
    let connection; // Declare connection outside try for finally access
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Notes (user_id, NoteTitle, NoteContent, CreatedDate, LastEditedDate)
            VALUES (@user_id, @NoteTitle, @NoteContent, GETDATE(), GETDATE());
            SELECT SCOPE_IDENTITY() AS NoteID; -- Get the ID of the newly inserted note
        `;
        const request = connection.request();
        request.input("user_id", sql.Int, noteData.user_id);
        request.input("NoteTitle", sql.NVarChar, noteData.NoteTitle);
        request.input("NoteContent", sql.NVarChar, noteData.NoteContent);
        const result = await request.query(query);
        return { id: result.recordset[0].NoteID, ...noteData }; // Return the new note with its ID
    } catch (error) {
        console.error("Database error in createNote:", error); // More specific error logging
        throw error; // Re-throw the error for the controller to handle
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing connection after createNote:", err);
            }
        }
    }
}

// update note

//delete note
async function deleteNote(noteId) {
    let connection; // Declare connection outside try for finally access
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            DELETE FROM Notes
            WHERE NoteID = @noteId;
        `;
        const request = connection.request();
        request.input("noteId", sql.Int, noteId);
        await request.query(query);
        return { message: "Note deleted successfully" };
    } catch (error) {
        console.error("Database error in deleteNote:", error); // More specific error logging
        throw error; // Re-throw the error for the controller to handle
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing connection after deleteNote:", err);
            }
        }
    }

}

// module.exports to export model functions
module.exports = {
    getAllNotes,
    searchNotes,
    createNote,
    // updateNote,
    deleteNote
}