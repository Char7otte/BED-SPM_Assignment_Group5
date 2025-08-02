const funcName = require("./note-taker");
const noteTakerModel = require("../models/noteTakerModel");
const sql = require("mssql");

test('getAllNotes should return all notes', async () => {
    const mockNotes = [
        { NoteID: 1, Title: "Note 1", Content: "Content 1" },
        { NoteID: 2, Title: "Note 2", Content: "Content 2" }
    ];

    jest.spyOn(noteTakerModel, 'getAllNotes').mockResolvedValue(mockNotes);

    const notes = await funcName.getAllNotes();
    expect(notes).toEqual(mockNotes);
});