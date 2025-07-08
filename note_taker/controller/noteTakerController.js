const noteTakerModel = require("../models/noteTakerModel.js");

// Get all notes
async function getAllNotes(req, res) {
    try {
        const notes = await notesModel.getAllNotes();
        res.json(notes);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving notes" });
    }
}

// Get note by ID
async function getNoteById(req, res) {
    try {
        const id = parseInt(req.params.id);
        const note = await noteModel.getNoteById(id);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        res.json(note);
    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error retrieving note" });
    }
}

// Create a new note


// Update an existing note


// Delete a note

