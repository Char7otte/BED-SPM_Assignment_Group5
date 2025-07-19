const BaseJoi = require('joi');
const JoiDate = require('@joi/date');
const Joi = BaseJoi.extend(JoiDate);


// Validation schema for appointments (used for POST/PUT)
const medAppointmentSchema = Joi.object({
    date: Joi.date().format('YYYY-MM-DD').required()
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
    title: Joi.string().min(1).max(50).required().messages({
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
    status: Joi.string().valid('Scheduled', 'Ongoing', 'Attended', 'Missed', 'Cancelled').optional().messages({
        "string.base": "Status must be a string",
        "any.only": "Status must be one of the following: Scheduled, Ongoing, Attended, Missed, Cancelled"
    }),
    notes: Joi.string().max(500).optional().allow(null, "").messages({
        "string.base": "Notes must be a string",
        "string.max": "Notes cannot exceed 500 characters",
    }),
});

// Middleware to validate appointment data (for POST/PUT)
const validateMedAppointment = (req, res, next) => {
    const schema = Joi.object({
        date: Joi.date().required(),
        title: Joi.string().min(3).max(100).required(),
        doctor: Joi.string().min(3).max(100).required(),
        start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
        end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
        location: Joi.string().min(3).max(100).required(),
        notes: Joi.string().max(500).allow(''),
        status: Joi.string().valid('Scheduled', 'Ongoing', 'Attended', 'Missed', 'Cancelled').optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    // Only check for past dates on POST (create) requests, not PUT (update)
    if (req.method === 'POST') {
        const appointmentDate = new Date(req.body.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day

        if (appointmentDate < today) {
            return res.status(400).json({ error: "Appointment date cannot be in the past" });
        }
    }

    next();
};

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