const Joi = require('joi');

// Joi schemas for medication tracking validation
const medicationCreateSchema = Joi.object({
    user_id: Joi.number().integer().positive().required()
        .messages({
            'number.base': 'User ID must be a number',
            'number.integer': 'User ID must be an integer',  
            'number.positive': 'User ID must be positive',
            'any.required': 'User ID is required'
        }),
        
    medication_name: Joi.string().trim().min(1).max(100).required()
        .messages({
            'string.base': 'Medication name must be a string',
            'string.empty': 'Medication name cannot be empty',
            'string.min': 'Medication name must be at least 1 character',
            'string.max': 'Medication name cannot exceed 100 characters',
            'any.required': 'Medication name is required'
        }),
    
    medication_date: Joi.date().iso().required()
        .messages({
            'date.base': 'Medication date must be a valid date',
            'date.iso': 'Medication date must be in ISO format (YYYY-MM-DD)',
            'any.required': 'Medication date is required'
        }),
    
    medication_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
        .messages({
            'string.base': 'Medication time must be a string',
            'string.pattern.base': 'Medication time must be in HH:MM format (24-hour)',
            'any.required': 'Medication time is required'
        }),
    
    medication_dosage: Joi.string().trim().min(1).max(50).required()
        .messages({
            'string.base': 'Medication dosage must be a string',
            'string.empty': 'Medication dosage cannot be empty',
            'string.min': 'Medication dosage must be at least 1 character',
            'string.max': 'Medication dosage cannot exceed 50 characters',
            'any.required': 'Medication dosage is required'
        }),
    
    medication_quantity: Joi.number().integer().min(0).max(10000).default(0)
        .messages({
            'number.base': 'Medication quantity must be a number',
            'number.integer': 'Medication quantity must be an integer',
            'number.min': 'Medication quantity cannot be negative',
            'number.max': 'Medication quantity cannot exceed 10,000'
        }),
    
    medication_notes: Joi.string().trim().max(500).allow('').optional()
        .messages({
            'string.base': 'Medication notes must be a string',
            'string.max': 'Medication notes cannot exceed 500 characters'
        }),
    
    medication_reminders: Joi.boolean().default(false)
        .messages({
            'boolean.base': 'Medication reminders must be true or false'
        }),
    
    prescription_startdate: Joi.date().iso().optional()
        .messages({
            'date.base': 'Prescription start date must be a valid date',
            'date.iso': 'Prescription start date must be in ISO format (YYYY-MM-DD)'
        }),
    
    prescription_enddate: Joi.date().iso().min(Joi.ref('prescription_startdate')).optional()
        .messages({
            'date.base': 'Prescription end date must be a valid date',
            'date.iso': 'Prescription end date must be in ISO format (YYYY-MM-DD)',
            'date.min': 'Prescription end date must be after or equal to start date'
        }),
    
    is_taken: Joi.boolean().default(false)
        .messages({
            'boolean.base': 'Is taken field must be true or false'
        })
});

const medicationUpdateSchema = Joi.object({
    medicationName: Joi.string().trim().min(1).max(100).required()
        .messages({
            'string.base': 'Medication name must be a string',
            'string.empty': 'Medication name cannot be empty',
            'string.min': 'Medication name must be at least 1 character',
            'string.max': 'Medication name cannot exceed 100 characters',
            'any.required': 'Medication name is required'
        }),
    
    medicationDate: Joi.date().iso().required()
        .messages({
            'date.base': 'Medication date must be a valid date',
            'date.iso': 'Medication date must be in ISO format (YYYY-MM-DD)',
            'any.required': 'Medication date is required'
        }),
    
    medicationTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
        .messages({
            'string.base': 'Medication time must be a string',
            'string.pattern.base': 'Medication time must be in HH:MM format (24-hour)',
            'any.required': 'Medication time is required'
        }),
    
    medicationDosage: Joi.string().trim().min(1).max(50).required()
        .messages({
            'string.base': 'Medication dosage must be a string',
            'string.empty': 'Medication dosage cannot be empty',
            'string.min': 'Medication dosage must be at least 1 character',
            'string.max': 'Medication dosage cannot exceed 50 characters',
            'any.required': 'Medication dosage is required'
        }),
    
    medicationQuantity: Joi.number().integer().min(0).max(10000).required()
        .messages({
            'number.base': 'Medication quantity must be a number',
            'number.integer': 'Medication quantity must be an integer',
            'number.min': 'Medication quantity cannot be negative',
            'number.max': 'Medication quantity cannot exceed 10,000',
            'any.required': 'Medication quantity is required'
        }),
    
    medicationNotes: Joi.string().trim().max(500).allow('').optional()
        .messages({
            'string.base': 'Medication notes must be a string',
            'string.max': 'Medication notes cannot exceed 500 characters'
        }),
    
    medicationReminders: Joi.boolean().required()
        .messages({
            'boolean.base': 'Medication reminders must be true or false',
            'any.required': 'Medication reminders field is required'
        }),
    
    prescriptionStartDate: Joi.date().iso().optional()
        .messages({
            'date.base': 'Prescription start date must be a valid date',
            'date.iso': 'Prescription start date must be in ISO format (YYYY-MM-DD)'
        }),
    
    prescriptionEndDate: Joi.date().iso().min(Joi.ref('prescriptionStartDate')).optional()
        .messages({
            'date.base': 'Prescription end date must be a valid date',
            'date.iso': 'Prescription end date must be in ISO format (YYYY-MM-DD)',
            'date.min': 'Prescription end date must be after or equal to start date'
        }),
    
    isTaken: Joi.boolean().required()
        .messages({
            'boolean.base': 'Is taken field must be true or false',
            'any.required': 'Is taken field is required'
        })
});

const refillSchema = Joi.object({
    newQuantity: Joi.number().integer().min(1).max(10000).required()
        .messages({
            'number.base': 'New quantity must be a number',
            'number.integer': 'New quantity must be an integer',
            'number.min': 'New quantity must be at least 1',
            'number.max': 'New quantity cannot exceed 10,000',
            'any.required': 'New quantity is required'
        })
});

const medicationIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required()
        .messages({
            'number.base': 'Medication ID must be a number',
            'number.integer': 'Medication ID must be an integer',
            'number.positive': 'Medication ID must be positive',
            'any.required': 'Medication ID is required'
        }),
    medicationId: Joi.number().integer().positive().optional()
        .messages({
            'number.base': 'Medication ID must be a number',
            'number.integer': 'Medication ID must be an integer',
            'number.positive': 'Medication ID must be positive'
        })
});

const dateRangeQuerySchema = Joi.object({
    startDate: Joi.date().iso().optional()
        .messages({
            'date.base': 'Start date must be a valid date',
            'date.iso': 'Start date must be in ISO format (YYYY-MM-DD)'
        }),
    
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
        .messages({
            'date.base': 'End date must be a valid date',
            'date.iso': 'End date must be in ISO format (YYYY-MM-DD)',
            'date.min': 'End date must be after or equal to start date'
        }),
        
    medicationName: Joi.string().trim().max(100).optional()
        .messages({
            'string.base': 'Medication name must be a string',
            'string.max': 'Medication name cannot exceed 100 characters'
        })
});

// Validation middleware functions
const validateMedicationCreate = (req, res, next) => {
    const { error, value } = medicationCreateSchema.validate(req.body, { 
        abortEarly: false,
        stripUnknown: true 
    });
    
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errorMessages 
        });
    }
    
    req.body = value; // Use sanitized and validated data
    next();
};

const validateMedicationUpdate = (req, res, next) => {
    const { error, value } = medicationUpdateSchema.validate(req.body, { 
        abortEarly: false,
        stripUnknown: true 
    });
    
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errorMessages 
        });
    }
    
    req.body = value; // Use sanitized and validated data
    next();
};

const validateRefillRequest = (req, res, next) => {
    // Validate body
    const { error: bodyError, value: bodyValue } = refillSchema.validate(req.body, { 
        abortEarly: false,
        stripUnknown: true 
    });
    
    if (bodyError) {
        const errorMessages = bodyError.details.map(detail => detail.message);
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errorMessages 
        });
    }
    
    // Validate params
    const { error: paramError } = medicationIdParamSchema.validate(req.params);
    if (paramError) {
        const errorMessages = paramError.details.map(detail => detail.message);
        return res.status(400).json({ 
            error: 'Invalid parameters', 
            details: errorMessages 
        });
    }
    
    req.body = bodyValue;
    next();
};

const validateMedicationIdParam = (req, res, next) => {
    const paramToValidate = req.params.id || req.params.medicationId;
    const { error } = Joi.number().integer().positive().required().validate(paramToValidate);
    
    if (error) {
        return res.status(400).json({ 
            error: 'Invalid medication ID', 
            details: ['Medication ID must be a positive integer'] 
        });
    }
    
    next();
};

const validateDateRangeQuery = (req, res, next) => {
    const { error, value } = dateRangeQuerySchema.validate(req.query, { 
        abortEarly: false,
        stripUnknown: true 
    });
    
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ 
            error: 'Invalid query parameters', 
            details: errorMessages 
        });
    }
    
    req.query = value; // Use sanitized and validated data
    next();
};

const validateSearchQuery = (req, res, next) => {
    const searchSchema = Joi.object({
        name: Joi.string().trim().min(1).max(100).required()
            .messages({
                'string.base': 'Medication name must be a string',
                'string.empty': 'Medication name cannot be empty',
                'string.min': 'Medication name must be at least 1 character',
                'string.max': 'Medication name cannot exceed 100 characters',
                'any.required': 'Medication name is required for search'
            })
    });
    
    const { error, value } = searchSchema.validate(req.query, { 
        abortEarly: false,
        stripUnknown: true 
    });
    
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ 
            error: 'Invalid search parameters', 
            details: errorMessages 
        });
    }
    
    req.query = value; // Use sanitized and validated data
    next();
};

module.exports = {
    // Schemas
    medicationCreateSchema,
    medicationUpdateSchema,
    refillSchema,
    medicationIdParamSchema,
    dateRangeQuerySchema,
    
    // Middleware functions
    validateMedicationCreate,
    validateMedicationUpdate,
    validateRefillRequest,
    validateMedicationIdParam,
    validateDateRangeQuery,
    validateSearchQuery
};
