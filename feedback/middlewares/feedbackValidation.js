const Joi = require("joi"); // Import Joi for validation

// Validation schema for feedbacks (used for POST/PUT)
const feedbackSchema = Joi.object({
    title: Joi.string().min(1).max(100).required().messages({
        "string.base": "Title must be a string",
        "string.empty": "Title cannot be empty",
        "string.min": "Title must be at least 1 character long",
        "string.max": "Title cannot exceed 100 characters",
        "any.required": "Title is required",
    }),
    feature: Joi.string().min(1).max(100).required().messages({
        "string.base": "Feature must be a string",
        "string.empty": "Feature cannot be empty",
        "string.min": "Feature must be at least 1 character long",
        "string.max": "Feature cannot exceed 100 characters",
        "any.required": "Feature is required",
    }),
    description: Joi.string().min(1).max(500).required().messages({
        "string.base": "Description must be a string",
        "string.empty": "Description cannot be empty",
        "string.min": "Description must be at least 1 character long",
        "string.max": "Description cannot exceed 500 characters",
        "any.required": "Description is required",
    }),
    status: Joi.string().valid('Pending', 'Reviewed').optional().messages({
        "string.base": "Status must be a string",
        "any.only": "Status must be one of the following: Pending, Reviewed"
    }),
});

// Middleware to validate appointment data (for POST/PUT)
const validateFeedback = (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().min(1).max(100).required(),
        feature: Joi.string().min(1).max(100).required(),
        description: Joi.string().min(1).max(500).required(),
        status: Joi.string().valid('Pending', 'Reviewed').optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};

// Middleware to validate feedback ID from URL parameters (for PUT, DELETE)
function validateFeedbackId(req, res, next) {
  // Parse the ID from request parameters
  const id = parseInt(req.params.feedback_id);

  // Check if the parsed ID is a valid positive number
  if (isNaN(id) || id <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid feedback ID. ID must be a positive number" });
  }

  next();
}

module.exports = {
  validateFeedback,
  validateFeedbackId,
};