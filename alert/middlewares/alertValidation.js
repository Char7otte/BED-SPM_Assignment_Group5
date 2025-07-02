const Joi = require("joi");

const alertSchema = Joi.object({
    Title: Joi.string().min(1).max(255).required().messages({
        "string.base": "Title must be a string",
        "string.empty": "Title cannot be empty",
        "string.min": "Title must be at least 1 character long",
        "string.max": "Title cannot exceed 100 characters",
        "any.required": "Title is required",
    }),
    Message: Joi.string().min(1).max(500).required().messages({
        "string.base": "Message must be a string",
        "string.empty": "Message cannot be empty",
        "string.min": "Message must be at least 1 character long",
        "string.max": "Message cannot exceed 500 characters",
        "any.required": "Message is required",
    }),
    Category: Joi.string().valid("general", "emergency", "maintenance").required().messages({
        "string.base": "Category must be a string",
        "any.only": "Category must be one of: general, emergency, maintenance",
        "any.required": "Category is required",
    }),
    Severity: Joi.string().valid("low", "medium", "high").required().messages({
        "string.base": "Severity must be a string",
        "any.only": "Severity must be one of: low, medium, high",
        "any.required": "Severity is required",
    }),
});

function validateAlert(req, res, next) {
    const { error } = alertSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

function validateAlertId(req, res, next) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid alert ID" });
    }
    req.alertId = id;
    next();
}

function vaildAdmin (req, res, next) {
    // Placeholder for admin validation logic
    // This function should check if the user is an admin
    // For now, we will just call next() to proceed
    next();
}

module.exports = {
    validateAlert,
    validateAlertId,
};