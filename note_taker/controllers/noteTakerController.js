const noteTakerModel = require("../models/noteTakerModel.js");

// Get all notes
async function getAllNotes(req, res) {
    try {
        // get userId
        const userId = res.locals.user?.id;
        console.log("Fetching all notes for user ID:", userId);
        const notes = await noteTakerModel.getAllNotes(userId);
        res.json(notes);
    } catch (error) {
        console.error("Controller error in getAllNotes:", error.message, error.stack);
        res.status(500).json({ error: "Error retrieving notes" });
    }
}

// get note by id
async function getNotesById(req, res) {
    try {
        // get userId
        const userId = res.locals.user?.id;
        const noteId = parseInt(req.params.id);
        console.log("Search term:", `"${noteId}"`);
        // check if searchTerm is empty
        // if (searchTerm === "") {
        //     return res.status(400).json({ error: "Search term cannot be empty" });
        // }
        console.log("Searching for notes with term:", noteId);
        const note = await noteTakerModel.getNotesById(noteId, userId);
        // check if there are notes with the searchTerm
        if (!note) {
            return res.status(404).json({ error: `There are no notes with ${noteId}` });
        }

        res.json(note);
    } catch (error) {
        console.error("Controller error in getNotesById:", error.message, error.stack);
        res.status(500).json({ error: "Error retrieving note" });
    }
}

// search Notes by searchTerm
async function searchNotes(req, res) {
    try {
        // get userId
        const userId = res.locals.user?.id;
        const searchTerm = req.query.search?.trim();
        console.log("Search term:", `"${searchTerm}"`);
        // check if searchTerm is empty
        // if (searchTerm === "") {
        //     return res.status(400).json({ error: "Search term cannot be empty" });
        // }
        console.log("Searching for notes with term:", searchTerm);
        const note = await noteTakerModel.searchNotes(searchTerm, userId);
        // check if there are notes with the searchTerm
        if (!note) {
            return res.status(404).json({ error: `There are no notes with ${searchTerm}` });
        }

        res.json(note);
    } catch (error) {
        console.error("Controller error in searchNotes:", error.message, error.stack);
        res.status(500).json({ error: "Error retrieving note" });
    }
}

// Create a new note
async function createNote(req, res) {
    try {
        // get userId
        const userId = res.locals.user?.id;
        const noteData = req.body;
        console.log("Creating note with data:", noteData);

        //basic validation
        if (!userId) {
            return res.status(400).json({ error: "Missing userId, need to test in browser" });
        } else if (!noteData.NoteTitle || !noteData.NoteContent) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newNote = await noteTakerModel.createNote(noteData, userId);
        res.status(201).json({ message: 'Note created successfully', note: newNote });
    } catch (error) {
        console.error("Controller error in createNote:", error.message, error.stack);
        res.status(500).json({ error: "Error creating note" });
    }
}

// Update an existing note
async function updateNote(req, res) {
    try {
        const noteId = req.params.id;
        const updatedNoteData = req.body;
        console.log("Updating note with ID:", noteId, "with data:", updatedNoteData);
        // Basic validation for noteId and updatedNoteData
        if (!noteId || !updatedNoteData || Object.keys(updatedNoteData).length === 0) {
            return res.status(400).json({ error: "Note ID and updated data are required" });
        }

        const updatedNote = await noteTakerModel.updateNote(noteId, updatedNoteData);
        if (!updatedNote) {
            return res.status(404).json({ error: "Note not found" });
        }
        res.json({ message: "Note updated successfully", note: updatedNote });
    } catch (error) {
        console.error("Controller error in updateNote:", error.message, error.stack);
        res.status(500).json({ error: "Error updating note" });
    }
}

// Delete a note
async function deleteNote(req, res) {
    try {
        const noteId = req.params.id;
        console.log("Deleting note with ID:", noteId);

        // basic validation for noteId
        if (!noteId) {
            return res.status(400).json({ error: "Note ID is required" });
        }

        await noteTakerModel.deleteNote(noteId);
        res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Controller error in deleteNote:", error.message, error.stack);
        res.status(500).json({ error: "Error deleting note" });
    }
}

// more functionality

// export note functions
// export note as .md file
async function exportNoteAsMarkdown(req, res) {
    try {
        const noteId = req.params.id;
        console.log("Exporting note with ID:", noteId);

        // basic validation for noteId
        if (!noteId) {
            return res.status(400).json({ error: "Note ID is required" });
        }

        const note = await noteTakerModel.getNotesById(noteId);
        console.log("Fetched note:", note);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        // Logic to convert note to markdown format
        const markdownContent = `# ${note.NoteTitle}\n\n${note.NoteContent}`;

        // Set headers for file download
        res.setHeader('Content-disposition', `attachment; filename=Note-${note.NoteTitle}-${noteId}.md`);
        res.setHeader('Content-type', 'text/markdown');

        res.send(markdownContent);
    } catch (error) {
        console.error("Controller error in expostNoteAsMarkdown:", error.message, error.stack);
        res.status(500).json({ error: "Error exporting note" });
    }
}

// bulk actions
// bulk delete notes
async function bulkDeleteNotes(req, res) {
    try {
        const noteIds = req.body.noteIds; // Expecting an array of note IDs
        console.log("Bulk deleting notes with IDs:", noteIds);

        if (!Array.isArray(noteIds) || noteIds.length === 0) {
            return res.status(400).json({ error: "Invalid or empty note IDs array" });
        }

        await noteTakerModel.bulkDeleteNotes(noteIds);
        res.status(200).json({ message: "Notes deleted successfully" });
    } catch (error) {
        console.error("Controller error in bulkDeleteNotes:", error.message, error.stack);
        res.status(500).json({ error: "Error deleting notes" });
    }
}

// module exports
module.exports = {
    // basic crud operations
    getAllNotes,
    getNotesById,
    searchNotes,
    createNote,
    updateNote,
    deleteNote,
    // export functions
    exportNoteAsMarkdown,
    // bulk actions
    bulkDeleteNotes
};