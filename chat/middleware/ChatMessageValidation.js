const Joi = require("joi");
const { validateID } = require("../../utils/validation/IDValidation");

const chatMessageSchema = Joi.string().min(1).max(255).required().messages({
    "string.base": "Message must be a string",
    "string.min": "Message can't be empty",
    "string.max": "Message past max character count of 255",
    "any.required": "Message is required",
});

function validateChatMessage(req, res, next) {
    const { error } = chatMessageSchema.validate(req.body.message, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(", ");
        return res.status(400).send(errorMessage);
    }
    next();
}

function validateChatMessageID(req, res, next) {
    if (!validateID(req.body.chatMessageID)) return res.status(400).send("Invalid chat message");
    next();
}

function validateSenderID(req, res, next) {
    if (!validateID(req.body.senderID)) return res.status(401).send("Unauthorized");
    next();
}

module.exports = {
    validateChatMessage,
    validateChatMessageID,
    validateSenderID,
};
