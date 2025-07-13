const BaseJoi = require('joi');
const JoiDate = require('@joi/date');
const Joi = BaseJoi.extend(JoiDate);


// Validation schema for appointments (used for POST/PUT)
const medAppointmentSchema = Joi.object({
  // do i include user_id in the schema? if yes, do I also add it for update/PUT sql
  //   user_id: Joi.string().min(1).max(50).required().messages({
  //       "string.base": "User ID must be a string",
  //       "string.empty": "User ID cannot be empty",
  //       "string.min": "User ID must be at least 1 character long",
  //       "string.max": "User ID cannot exceed 50 characters",
  //       "any.required": "User ID is required",
  //   }),
    appointment_date: Joi.date().format('YYYY-MM-DD').required()
    .custom((value, helpers) => {
      const today = new Date();
      today.setHours(0,0,0,0); // ignore time, only prioritize date 
      const inputDate = new Date(value); //Converts input date to a JS Date object
      if (inputDate < today) {
        return helpers.error("date.min", { limit: today.toISOString().slice(0,10) });
      }
      //slice(0,10) extracts just the date portion(YYYY-MM-DD) of the ISO string
      return value;
    }).messages({
        "date.base": "Appointment date must be a valid date",
        "date.format": "Appointment date must be in YYYY-MM-DD format",
        "date.empty": "Appointment date cannot be empty",
        "any.required": "Appointment date is required",
        "date.min": "Appointment date cannot be in the past"
    }),
    appointment_title: Joi.string().min(1).max(50).required().messages({
        "string.base": "Appointment title must be a string",
        "string.empty": "Appointment title cannot be empty",
        "string.min": "Appointment title must be at least 1 character long",
        "string.max": "Appointment title cannot exceed 50 characters",
        "any.required": "Appointment title is required",
    }),
    doctor: Joi.string().min(1).max(50).required().messages({
        "string.base": "Doctor must be a string",
        "string.empty": "Doctor cannot be empty",
        "string.min": "Doctor must be at least 1 character long",
        "string.max": "Doctor cannot exceed 50 characters",
        "any.required": "Doctor is required",
    }),
    start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).required().messages({ // Pattern matches 24-hour format HH:mm:ss
        "string.base": "Start time must be a valid time",
        "string.empty": "Start time cannot be empty",
        "any.required": "Start time is required",
    }),
    end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).required().messages({
        "string.base": "End time must be a valid time",
        "string.empty": "End time cannot be empty",
        "any.required": "End time is required",
    }),
    location: Joi.string().min(1).max(100).required().messages({
        "string.base": "Location must be a string",
        "string.empty": "Location cannot be empty",
        "string.min": "Location must be at least 1 character long",
        "string.max": "Location cannot exceed 100 characters",
        "any.required": "Location is required",
    }),
    notes: Joi.string().max(500).optional().allow(null, "").messages({
        "string.base": "Notes must be a string",
        "string.max": "Notes cannot exceed 500 characters",
    }),
});

// Middleware to validate appointment data (for POST/PUT)
function validateMedAppointment(req, res, next) {
  // Validate the request body against the medAppointmentSchema
  const { error } = medAppointmentSchema.validate(req.body, { abortEarly: false }); // abortEarly: false collects all errors

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ error: errorMessage });
  }

  next();
}

// Middleware to check if user can access the specified user's appointments
function validateUserAccess(req, res, next) {
  const requestedUserId = parseInt(req.params.user_id);
  const authenticatedUserId = req.user.id; // From JWT token
  const userRole = req.user.role; // From JWT token

  // Admin can access any user's appointments
  if (userRole === 'A') {
    return next();
  }

  // Users can only access their own appointments
  if (authenticatedUserId === requestedUserId) {
    return next();
  }

  // If user is trying to access someone else's appointments
  return res.status(403).json({ 
    error: "Access denied. You can only view your own appointments." 
  });
}

// Middleware to validate user ID from URL parameters
function validateMedAppointmentUserId(req, res, next) {
  // Parse the user ID from request parameters
  const userId = parseInt(req.params.user_id);

  // Check if the parsed user ID is a valid positive number
  if (isNaN(userId) || userId <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid user ID. ID must be a positive number" });
  }

  next();
}

// Middleware to validate appointment ID from URL parameters (for PUT, DELETE)
function validateMedAppointmentId(req, res, next) {
  // Parse the ID from request parameters
  const id = parseInt(req.params.appointment_id);

  // Check if the parsed ID is a valid positive number
  if (isNaN(id) || id <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid appointment ID. ID must be a positive number" });
  }

  next();
}

module.exports = {
  validateMedAppointment,
  validateMedAppointmentId,
};