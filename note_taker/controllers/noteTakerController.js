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
        const searchTerm = req.params.search?.trim();
        console.log("Searching for notes with term:", searchTerm);
        const note = await noteTakerModel.searchNotes(searchTerm);
        if (!note || note.length === 0) {
            return res.status(404).json({ error: `There are no notes with ${searchTerm}` });
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

module.exports = {
    getAllNotes,
    searchNotes,
    //getNoteById,
    // add other functions here
};