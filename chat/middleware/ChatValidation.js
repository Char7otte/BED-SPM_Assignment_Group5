const Joi = require("joi");
const { validateID } = require("../../utils/validation/IDValidation");
const chatModel = require("../models/chatModel");

function validateChatID(req, res, next) {
    if (!validateID(req.params.chatID)) return res.status(400).send("Invalid chat ID");
    next();
}

// async function checkIfChatIDIsInDatabase(req, res, next) {
//     const chat = await chatModel.getChatByID(req.params.chatID);
//     if (chat == null) return res.status(404).send("Chat not found");
//     next();
// }

// async function checkIfChatIsDeletedInDatabase(req, res, next) {
//     //This exists as a separate check because admins bypass it
//     //Future Charlotte: I have no idea what this is for, actually. The above comment makes no sense.
//     const chat = await chatModel.getChatByID(req.params.chatID);
//     if (chat.is_deleted) return res.status(404).send("Chat not found");
//     next();
// }

module.exports = {
    validateChatID,
};
