const jwt = require("jsonwebtoken");
const joi = require("joi");
const { validateID } = require("../../utils/validation/IDValidation");

const schema = joi.object({
    user_id: joi.number().integer().required(),
    NoteTitle: joi.string().min(1).max(100).required(),
    NoteContent: joi.string().min(1).max(5000).required(),
    CreatedDate: joi.date(),
    LastEditedDate: joi.date()
});

function validateNoteID(req, res, next) {
    if (!validateID(req.params.note_id)) return res.status(400).send("Invalid note ID");
    next();
}

function validateNoteInput(req, res, next) {
    //user_id, NoteTitle, NoteContent, CreatedDate, LastEditedDate

    const { error } = schema.validate(req.body);
    if (error) {
        console.log("Validation error:", error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
    }

    next();
}

// bulk validation functions
const bulkSchema = joi.object({
    noteIds: joi.array().items(joi.number().positive().required().min(1).required())
});

function bulkValidateNoteIDs(req, res, next) {
    const { error } = bulkSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const noteIds = req.body.noteIds;

    for (const id of noteIds) {
        if (!validateID(id)) {
            return res.status(400).json({ message: `Invalid note ID: ${id}` });
        }
    }

    next();
}

module.exports = {
    validateNoteID,
    bulkValidateNoteIDs,
    validateNoteInput
};