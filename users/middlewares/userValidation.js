const jwt = require("jsonwebtoken");
const joi = require("joi");
const { validateID } = require("../../utils/validation/IDValidation");

function validateUserInput(req, res, next) {
    
  const schema = joi.object({
    username: joi.string().min(3).max(30).required(),
    phone_number: joi.string().min(8).max(8).required(),
    password: joi.string().min(8).max(100).required(),
    age: joi.number().integer().min(0).required(),
    gender: joi.string().valid('Male', 'Female', 'Other'),
    role: joi.string().valid('A', 'U', 'V')

  });

  const { error } = schema.validate(req.body);
  if (error) {
    console.log("Validation error:", error.details[0].message);
    return res.status(400).json({ message: error.details[0].message });
  }


    next();
}

function validateUserInputForUpdate(req, res, next) {
    const schema = joi.object({
        username: joi.string().min(3).max(30),
        phone_number: joi.string(),
        password: joi.string().min(8).max(100),
        age: joi.number().integer().min(0),
        gender: joi.string().valid("Male", "Female", "Other"),
        role: joi.string().valid("A", "U", "V"),
        status: joi.string().valid("active", "inactive", "deleted"),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        console.log("Validation error:", error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
    }

    next();
}

function verifyJWT(req, res, next) {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const authorizedRoles = {
            //user
            "POST /users/register": ["A", "U"], // Admin and User can register
            "PUT /users/changepassword/[0-9]+": ["A", "U"], // Admin and User can change password
            "GET /users/username/[a-zA-Z0-9]+": ["A", "U"], // Admin and User can get user by username
            //user management
            "GET /users": ["A"], // Only Admin can get all users
            "PUT /users/updatedetail/[0-9]+": ["A"], // Admin can update user details
            "PUT /users/delete/[0-9]+": ["A"], // Only Admin can delete users
            "POST /users/login": ["A", "U"], // Admin and User can login
            "POST /users/search": ["A"], // Admin and User can search users
            "PATCH /users/updatedetail/:id": ["A"], // Admin and User can update their own details

            // Medical appointments - Only Users can access
            "GET /med-appointments": ["U"],
            "GET /med-appointments/search": ["U"], // Get appointment by searchTerm
            "GET /med-appointments/.*": ["U"], // Match any date format
            "GET /med-appointments/[0-9]{2}/[0-9]{4}": ["U"], // Get appointment by month and year
            "POST /med-appointments": ["U"],
            "PUT /med-appointments/[0-9]+": ["U"],
            "DELETE /med-appointments/[0-9]+": ["U"],

            // Alerts
            "GET /alerts": ['A', 'U'], // Admin and User can get all alerts
            "GET /alerts/search": ['A', 'U'], // Admin and User can search alerts
            "POST /alerts": ['A'], // Only Admin can create alerts
            "PUT /alerts/[0-9]+": ['A'], // Only Admin can update alerts
            "PUT /alerts/delete/[0-9]+": ['A'], // Only Admin can delete alerts


            // Feedback
            "GET /feedback": ["A", "U"], // Admin and User can get all feedback
            "GET /feedback/search": ["A", "U"], // Admin and User can search feedback
            "POST /feedback": ["U"], // Only User can create feedback
            "PUT /feedback/[0-9]+": ["U"], // Only User can update their own feedback
            "DELETE /feedback/[0-9]+": ["U"], // Only User can delete their own feedback

        };

        // Check if the current route requires role-based authorization
        const currentRoute = `${req.method} ${req.path}`;

        const matchingRole = Object.keys(authorizedRoles).find((route) => {
            // Only replace [a-zA-Z0-9]+ with [\\w-]+, keep [0-9]+ as is
            let regexPattern = route.replace(/\[a-zA-Z0-9\]\+/g, "[\\w-]+");
            regexPattern = regexPattern.replace(/\[0-9\]\+/g, "[0-9]+");
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(currentRoute);
        });

        if (matchingRole) {
            const requiredRoles = authorizedRoles[matchingRole];
            const userRole = decoded.role;

            if (!requiredRoles.includes(userRole)) {
                return res.status(403).json({ message: "Access denied. Insufficient permissions." });
            }
        } else {
            // For medical appointment routes, if no explicit authorization rule is found, deny access
            if (currentRoute.includes("/med-appointments")) {
                return res.status(403).json({ message: "Access denied. No authorization rule defined for this route." });
            }
        }

        req.user = decoded;
        next();
    });
}

function validateUserID(req, res, next) {
    if (!validateID(req.params.userID)) return res.status(400).send("Invalid user");
    next();
}

module.exports = {
    validateUserInput,
    validateUserInputForUpdate,
    verifyJWT,
    validateUserID,
};

// --bed_spm db v1.05
// CREATE DATABASE bed_spm

// -- Users table
// CREATE TABLE Users (
//     user_id INT PRIMARY KEY IDENTITY(1,1),
//     username NVARCHAR(100) NOT NULL,
//     phone_number NVARCHAR(15) NOT NULL,
//     password NVARCHAR(255) NOT NULL,
//     joined_date DATE NOT NULL DEFAULT GETDATE(),
//     age INT NOT NULL,
//     gender NVARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')) NOT NULL,
//     role CHAR(1) NOT NULL DEFAULT 'U'
//         CONSTRAINT chk_user_role CHECK (role IN ('A', 'U', 'V')) -- A = Admin, U = User, V = Volunteer
// );

// -- MedAppointments table
// CREATE TABLE MedAppointments (
//     appointment_id     INT PRIMARY KEY IDENTITY(1,1),
//     user_id            INT NOT NULL,
//     appointment_date   DATE NOT NULL,
//     appointment_title  VARCHAR(50) NOT NULL,
//     doctor             VARCHAR(50) NOT NULL,
//     start_time         TIME NOT NULL,
//     end_time           TIME NOT NULL,
//     location           VARCHAR(100) NOT NULL,
//     notes              VARCHAR(500),
//     FOREIGN KEY (user_id) REFERENCES Users(user_id)
// );

// -- Alert table
// CREATE TABLE Alert (
//     AlertID INT PRIMARY KEY IDENTITY(1,1),
//     Title VARCHAR(255) NOT NULL,
//   Category VARCHAR(50),
//     Message VARCHAR(500),
//     Date DATETIME NOT NULL DEFAULT GETDATE(),
//     Severity VARCHAR(50)
// );

// -- ReadStatus table
// CREATE TABLE ReadStatus (
//     user_id INT NOT NULL,
//     AlertID INT NOT NULL,
//     ReadStatus BIT NOT NULL,  -- 1 = Read, 0 = Unread
//     PRIMARY KEY (user_id, AlertID),
//     FOREIGN KEY (user_id) REFERENCES Users(user_id),
//     FOREIGN KEY (AlertID) REFERENCES Alert(AlertID)
// );

// CREATE TABLE Medications (
//     user_id INT NOT NULL,
//     medication_id INT IDENTITY(1,1) PRIMARY KEY,
//     medication_name NVARCHAR(255) NOT NULL,
//     medication_date DATE NOT NULL,
//     medication_time TIME NOT NULL,
//     medication_dosage NVARCHAR(100),
//     medication_notes NVARCHAR(MAX),
//     medication_reminders BIT DEFAULT 0,
//     prescription_startdate DATE,
//     prescription_enddate DATE,
//     is_taken BIT DEFAULT 0,
//     created_at DATETIME DEFAULT GETDATE(),
//     updated_at DATETIME DEFAULT GETDATE(),
//     FOREIGN KEY (user_id) REFERENCES Users(user_id)
// );

// CREATE TABLE Chat (
//     ChatID INT IDENTITY(1,1) PRIMARY KEY,
//     HelpeeID INT NOT NULL,
//     Status VARCHAR(10) CHECK (Status IN ('Closed', 'Open', 'Responded')) NOT NULL DEFAULT 'Open',
//     CreatedDateTime DATETIME2 NOT NULL DEFAULT GETDATE(),
//     LastActivityDatetime DATETIME2 NOT NULL DEFAULT GETDATE(),
//   FOREIGN KEY (HelpeeID) REFERENCES Users(user_id)
// );

// CREATE TABLE ChatLog (
//     ChatID INT NOT NULL,
//     LogID INT IDENTITY(1,1),
//     Text NVARCHAR(MAX) NOT NULL,
//     SenderID INT NOT NULL,
//     SentDateTime DATETIME2 NOT NULL DEFAULT GETDATE(),
//   FOREIGN KEY (ChatID) REFERENCES Chat(ChatID),
//   FOREIGN KEY (SenderID) REFERENCES Users(user_id),
//     CONSTRAINT PK_ChatLog PRIMARY KEY (ChatID, LogID)
// );

// -- notes table for note taker feature
// CREATE TABLE Notes (
//     NoteID INT IDENTITY(1,1) PRIMARY KEY,
//     user_id INT NOT NULL,
//     NoteTitle VARCHAR(50) NOT NULL,
//     NoteContent VARCHAR(1028) NOT NULL, -- number
//     CreatedDate DATE NOT NULL,
//     LastEditedDate DATE NOT NULL DEFAULT GETDATE(),
//     FOREIGN KEY (user_id) REFERENCES Users(user_id)
// );

