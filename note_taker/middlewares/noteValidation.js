const jwt = require("jsonwebtoken");
const joi = require("joi");
const { validateID } = require("../../utils/validation/IDValidation");
const { parse } = require("dotenv");

const schema = joi.object({
    user_id: joi.number().integer().positive().required(),
    NoteTitle: joi.string().min(1).max(100).required(),
    NoteContent: joi.string().min(1).max(5000).required()
});

const idSchema = joi.object({
    id: joi.number().positive().required()
});


function validateNoteID(req, res, next) {
    console.log("Validating note ID:", req.params.id);
    const id = parseInt(req.params.id, 10);
    const { error } = idSchema.validate({ id });
    if (error) {
        return res.status(400).json({ message: `Invalid note ID: ${id}` });
    }
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