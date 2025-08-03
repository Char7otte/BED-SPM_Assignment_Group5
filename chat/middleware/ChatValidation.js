const Joi = require("joi");
const { validateID } = require("../../utils/validation/IDValidation");

function validateChatID(req, res, next) {
    if (!validateID(req.params.chatID)) return res.status(400).send("Invalid chat ID");
    next();
}

module.exports = {
    validateChatID,
};
