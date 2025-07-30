const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");

dotenv.config();

// Import functions from alertRoutes
const alertController = require("./alert/controllers/alertController");
const { validateAlert, validateAlertId } = require("./alert/middlewares/alertValidation");
// Import functions from userRoutes
const userController = require("./users/controllers/userController");
const { validateUserInput, validateUserInputForUpdate, verifyJWT, validateUserID } = require("./users/middlewares/userValidation");
const { authenticateToken } = require("./users/middlewares/auth");


// Import chat functions
const chatController = require("./chat/controllers/chatController");
const chatMessageController = require("./chat/controllers/chatMessageController");
const { validateChatID, checkIfChatIDIsInDatabase, checkIfChatIsDeletedInDatabase } = require("./chat/middleware/ChatValidation");
const { validateChatMessage, validateChatMessageID, validateSenderID } = require("./chat/middleware/ChatMessageValidation");


// Import medical appointment functions
const medAppointmentController = require("./medical-appointment/controllers/medAppointmentController");
const { validateMedAppointment, validateMedAppointmentId } = require("./medical-appointment/middlewares/medAppointmentValidation");


// Import functions from medication tracker
const medTrackerController = require("./medication_tracker/controller/medTrackerController");
const {
    validateMedicationCreate,
    validateMedicationUpdate,
    validateRefillRequest,
    validateMedicationIdParam,
    validateDateRangeQuery,
    validateSearchQuery,
} = require("./medication_tracker/middleware/medTrackerValidation");


// Import note taker functions
const noteTakerController = require("./note_taker/controllers/noteTakerController");
const jwt = require("jsonwebtoken");


// Import feedback functions
const feedbackController = require("./feedback/controllers/feedbackController");
const { validateFeedback, validateFeedbackId } = require("./feedback/middlewares/feedbackValidation");


// Import weather functions
const weatherController = require("./Weather/controllers/weatherController");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/views", express.static(path.join(__dirname, "views")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// JWT middleware
app.use((req, res, next) => {
    const token = req.cookies?.token || null;
    let tokenExpired = false;
    let user = null;

    if (token) {
        try {
            user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            tokenExpired = true;
        }
    } else {
        tokenExpired = true;
    }

    res.locals.user = user;
    res.locals.tokenExpired = tokenExpired;

    next();
});

///// Frontend routes /////
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'auth', 'loginauth.html'));
});
app.get("/loginauth.html", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "auth", "loginauth.html"));
});

app.get('/homepage', (req, res) => {
  res.render('index', { user: res.locals.user });
});

// Alert routes
app.get("/alert", (req, res) => {
    res.render("alert/alert", { message: "This is an alert message" });
});
app.get("/alertdetail", (req, res) => {
    res.render("alert/alertdetail", { message: "This is an alert detail message" });
});
app.get("/alertadmin", (req, res) => {
    res.render("alert/alertadmin", { message: "This is an alert admin message" });
});

// User routes
app.get("/user", (req, res) => {
    res.render("user/user", { user: res.locals.user });
});
app.get("/users/updatedetail/:id", (req, res) => {
    const userId = req.params.id;
    res.render("user/updatedetail", { userId: userId, user: res.locals.user });
});
app.get('/users/profile', (req, res) => {
  res.render('user/profile', { user: res.locals.user });
});

// Medical appointment calendar page
app.get("/calendar", (req, res) => {
  res.render("medical-appointment/calendar");
});

// Route to serve the medication tracker HTML page
app.get("/medications", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "medication_index.html"));
});

// Route to serve the daily medication HTML page
app.get("/medications/daily", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "daily_medication.html"));
});

// Route to serve the weekly medication HTML page
app.get("/medications/weekly", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "weekly_medication.html"));
});
  
// Feedback pages
app.get("/feedback-form", (req, res) => {
  res.render("feedback/feedback-form");
});
app.get("/feedbacks", (req, res) => {
  res.render("feedback/all-feedbacks");
});
app.get("/feedback-admin", (req, res) => {
  res.render("feedback/feedback-admin");
});

// Weather
app.get("/weather", async (req, res) => {
  res.render("weather/weather", { user: res.locals.user }); 
});

///// API routes /////
//ALERT SEARCH + READ STATUS (specific paths FIRST)/
app.get("/alerts/search", alertController.searchAlerts); //  Search alerts by title or category
app.get("/alerts/readstatus/:id", alertController.getreadAlerts); //  Get read status of an alert by ID
app.post("/alerts/updatestatus/:id", validateAlertId, alertController.updateAlertStatus); //  Mark alert as read/unread

// CREATE ALERT (Admin only)
app.post("/alerts", validateAlert, alertController.createAlert); //  Create a new alert

// UPDATE + DELETE ALERT (Admin only)
app.put("/alerts/:id", validateAlertId, validateAlert, alertController.updateAlert); // Update an existing alert
app.put("/alerts/delete/:id", validateAlertId, alertController.deleteAlert); //  Delete alert

// BASIC ALERT FETCHING
app.get("/alerts", alertController.getAllAlerts); //  List all alerts (user/admin)
app.get("/alerts/:id", validateAlertId, alertController.getAlertById); // View alert by ID (last!)

//routes for users
app.post("/users/register", validateUserInput, userController.createUser); // User registration #okay
app.post("/users/login", userController.loginUser); // User login #okay
app.put("/users/changepassword/:id", verifyJWT, userController.changePassword); // Change user password #okay
//rotes for user management
app.get("/users", verifyJWT, userController.getAllUsers); // Get all users #okay
app.get("/users/username/:username", verifyJWT, userController.getUserByUsername); // Get user by username
app.get("/users/:id", verifyJWT, userController.getUserById); // Get user by ID #okay
app.patch("/users/updatedetail/:id", verifyJWT, validateUserInputForUpdate, userController.updateUser); // Update user details #okay
app.put("/users/delete/:id", verifyJWT, userController.deleteUser); //OKay
app.post("/users/search", verifyJWT, userController.searchUserByUsernameNid); //
app.get("/users/logout", userController.logoutUser); // Get user roles by ID #okay

//routes for chats
app.get("/chats", verifyJWT, chatController.getAllChats);
app.post("/chats/create/:userID", validateUserID, chatController.createChat);
app.patch("/chats/delete/:chatID", validateChatID, checkIfChatIDIsInDatabase, checkIfChatIsDeletedInDatabase, chatController.deleteChat); //This is patch in order to maintain the chat in the backend.

app.get("/chats/:chatID", validateChatID, checkIfChatIDIsInDatabase, chatMessageController.getAllMessagesInAChat);
app.post("/chats/:chatID", validateChatID, validateSenderID, validateChatMessage, checkIfChatIDIsInDatabase, chatMessageController.createMessage);
app.patch("/chats/:chatID", validateChatID, validateChatMessage, checkIfChatIDIsInDatabase, chatMessageController.editMessage);
app.delete("/chats/:chatID", validateChatID, checkIfChatIDIsInDatabase, chatMessageController.deleteMessage);

//routes for medical appointments
app.get("/med-appointments", verifyJWT, medAppointmentController.getAllAppointmentsByUser);
app.get("/med-appointments/search", verifyJWT, medAppointmentController.searchAppointments);
app.get("/med-appointments/:date", verifyJWT, medAppointmentController.getAppointmentsByDate);
app.get("/med-appointments/:month/:year", verifyJWT, medAppointmentController.getAppointmentsByMonthYear);
app.post("/med-appointments", verifyJWT, validateMedAppointment, medAppointmentController.createAppointment);
app.put("/med-appointments/:appointment_id", verifyJWT, validateMedAppointmentId, validateMedAppointment, medAppointmentController.updateAppointment);
app.delete("/med-appointments/:appointment_id", verifyJWT, validateMedAppointmentId, medAppointmentController.deleteAppointment);

//routes for medication tracker
app.get("/medications/user/:userId/reminders", medTrackerController.remindMedication);
app.get("/medications/user/:userId/daily", medTrackerController.getDailyMedicationByUser);
app.get("/medications/user/:userId/weekly", validateDateRangeQuery, medTrackerController.getWeeklyMedicationByUser);
app.get("/medications/user/:userId/search", validateSearchQuery, medTrackerController.searchMedicationByName);
app.put("/medications/:userId/:medicationId/is-taken", validateMedicationIdParam, medTrackerController.tickOffMedication);
app.put("/medications/:userId/tick-all", medTrackerController.tickAllMedications);
app.put("/medications/:userId/:id/refill", validateRefillRequest, medTrackerController.refillMedication);
app.put("/medications/:userId/:id/missed", validateMedicationIdParam, medTrackerController.markMedicationAsMissed);

app.get("/medications/user/:userId", medTrackerController.getAllMedicationByUser);
app.get("/medications/:userId/:medicationId", validateMedicationIdParam, medTrackerController.getMedicationById);
app.post("/medications", validateMedicationCreate, medTrackerController.createMedication);
app.put("/medications/:userId/:medicationId", validateMedicationIdParam, validateMedicationUpdate, medTrackerController.updateMedication);
app.delete("/medications/:userId/:medicationId", validateMedicationIdParam, medTrackerController.deleteMedication);

// routes for note taker
app.get("/notes", noteTakerController.getAllNotes);
app.delete("/notes/bulk", noteTakerController.bulkDeleteNotes);
app.get("/notes/search", noteTakerController.searchNotes);
app.get("/notes/:id", noteTakerController.getNotesById);
app.post("/notes", noteTakerController.createNote);
app.delete("/notes/:id", noteTakerController.deleteNote);
app.put("/notes/:id", noteTakerController.updateNote);
app.get("/notes/export-md/:id", noteTakerController.exportNoteAsMarkdown);

//routes for feedback - user
app.get("/feedback", verifyJWT, feedbackController.getAllFeedbacksByUser);
app.get("/feedback/search", verifyJWT, feedbackController.searchFeedbacks);
app.post("/feedback", verifyJWT, validateFeedback, feedbackController.createFeedback);
app.put("/feedback/:feedback_id", verifyJWT, validateFeedbackId, validateFeedback, feedbackController.updateFeedback);
app.delete("/feedback/:feedback_id", verifyJWT, validateFeedbackId, feedbackController.deleteFeedback);

//routes for feedback - admin
app.get("/feedback/admin", verifyJWT, feedbackController.getAllFeedbacks);
app.get("/feedback/admin/search", verifyJWT, feedbackController.searchFeedbacksAdmin);
app.put("/feedback/admin/:feedback_id", verifyJWT, validateFeedbackId, feedbackController.editFeedbackStatus);
app.delete("/feedback/admin/:feedback_id", verifyJWT, validateFeedbackId, feedbackController.deleteFeedbackAdmin);

//Weather API 3rd Party
//app.get("/weather", weatherController.fetchExternalData); // Fetch weather data from external API
app.get('/external', weatherController.fetchExternalData);
app.get('/forecast', weatherController.sendForecastData); // Fetch and send forecast data

//Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

process.on("SIGINT", async () => {
    console.log("Server is gracefully shutting down");
    await sql.close();
    console.log("Database connections closed");
    process.exit(0);
});
