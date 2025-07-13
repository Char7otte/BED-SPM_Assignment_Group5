const noteTakerModel = require("../models/noteTakerModel.js");

// Get all notes
async function getAllNotes(req, res) {
    try {
        const notes = await noteTakerModel.getAllNotes();
        res.json(notes);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving notes" });
    }
}

// search Notes by searchTerm
async function searchNotes(req, res) {
    try {
        const searchTerm = req.query.search?.trim();
        console.log("Search term:", `"${searchTerm}"`);
        // check if searchTerm is empty
        // if (searchTerm === "") {
        //     return res.status(400).json({ error: "Search term cannot be empty" });
        // }
        console.log("Searching for notes with term:", searchTerm);
        const note = await noteTakerModel.searchNotes(searchTerm);
        // check if there are notes with the searchTerm
        if (!note) {
            return res.status(404).json({ error: `There are no notes with ${searchTerm}` });
        }

        res.json(note);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving note" });
    }
}

// Create a new note
async function createNote(req, res) {
    try {
        const noteData = req.body;
        console.log("Creating note with data:", noteData);

        //basic validation
        if (!noteData.user_id || !noteData.NoteTitle || !noteData.NoteContent) {
            return res.status(400).json({ error: "missing required fields" });
        }

        const newNote = await noteTakerModel.createNote(noteData);
        res.status(201).json({ message: 'Note created successfully', note: newNote });
    } catch (error) {
        console.error("Controller error:", error);
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
        console.error("Controller error:", error);
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
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error deleting note" });
    }
}

// module exports
module.exports = {
    getAllNotes,
    searchNotes,
    createNote,
    updateNote,
    deleteNote
};