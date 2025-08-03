const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const router = express.Router();

dotenv.config();

// Import functions from alertRoutes
const alertController = require("./alert/controllers/alertController");
const { validateAlert, validateAlertId } = require("./alert/middlewares/alertValidation");
// Import functions from userRoutes
const userController = require("./users/controllers/userController");
const {
  validateUserInput,
  validateUserInputForUpdate,
  verifyJWT,
  validateUserID,
  onlyAllowUser,
  onlyAllowAdmin,
} = require("./users/middlewares/userValidation");
const { authenticateToken } = require("./users/middlewares/auth");


// Import chat functions
const chatController = require("./chat/controllers/chatController");
const chatMessageController = require("./chat/controllers/chatMessageController");
const { validateChatID } = require("./chat/middleware/ChatValidation");
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
const { validateNoteInput, validateNoteID, validateCreateNoteInput, bulkValidateNoteIDs } = require("./note_taker/middlewares/noteValidation");


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

app.get('/homepage', (req, res) => {
  res.render('index', { user: res.locals.user });
});
app.get('/admin', (req, res) => {
  res.render('indexadmin', { user: res.locals.user });
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
app.get('/notes', (req, res) => {
  res.render('note-taker/notes', { user: res.locals.user });
});

// Medical appointment calendar route
app.get("/calendar", (req, res) => {
  res.render("medical-appointment/calendar");
});

// Medication tracker routes
app.get("/medications", (req, res) => {
  res.render("medication-tracker/all-medications");
});
app.get("/medications/daily", (req, res) => {
  res.render("medication-tracker/daily_medication");
});
app.get("/medications/weekly", (req, res) => {
  res.render("medication-tracker/weekly_medication");
});
app.get("/medications/create", (req, res) => {
  res.render("medication-tracker/create-medication");
});

// Route to serve the notes page
app.get('/notes', (req, res) => {
  res.render('note-taker/notes', { user: res.locals.user });
});

// Feedback routes
app.get("/feedback-form", (req, res) => {
  res.render("feedback/feedback-form");
});
app.get("/feedbacks", (req, res) => {
  res.render("feedback/all-feedbacks");
});
app.get("/feedback-admin", (req, res) => {
  res.render("feedback/feedback-admin");
});

app.get("/loginauth.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "loginauth.html"));
});

// Weather route
app.get("/weather", async (req, res) => {
  res.render("weather/weather", { user: res.locals.user });
});

// Trivia Quiz 3rd Party route
app.get('/trivia', (req, res) => {
  res.render('trivia-quiz/trivia');
});


// ===== ALERTS ROUTES ===== //
// --- User-specific Operations --- //
app.get("/alerts/search", verifyJWT, alertController.searchAlerts); // Search by title/category
app.get("/alerts/readstatus/:id", verifyJWT, alertController.getreadAlerts); // Get read status
app.post("/alerts/updatestatus/:id", verifyJWT, validateAlertId, alertController.updateAlertStatus); // Mark as read/unread
app.post("/alerts/checkhasnoties/:id", verifyJWT, alertController.checkHasNotiesAdded); // Check if alert has notes


// --- Admin-only Operations --- //
app.post("/alerts", verifyJWT, validateAlert, alertController.createAlert); // Create new alert
app.put("/alerts/:id", verifyJWT, validateAlertId, validateAlert, alertController.updateAlert); // Update alert
app.put("/alerts/delete/:id", verifyJWT, validateAlertId, alertController.deleteAlert); // Delete alert

// --- General Fetch Operations --- //
app.get("/alerts", verifyJWT, alertController.getAllAlerts); // Get all alerts
app.get("/alerts/:id", verifyJWT, validateAlertId, alertController.getAlertById); // Get alert by ID


//routes for users
app.post("/users/register", validateUserInput, userController.createUser); // User registration #okay
app.post("/users/login", userController.loginUser); // User login #okay
app.put("/users/changepassword/:id", userController.changePassword); // Change user password #okay
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
app.post("/chats/create/:userID", verifyJWT, onlyAllowUser, validateUserID, chatController.createChat);
app.patch("/chats/delete/:chatID", verifyJWT, validateChatID, chatController.deleteChat); //This is patch in order to maintain the chat in the backend.
app.patch("/chats/status/:chatID", verifyJWT, validateChatID, chatController.markChatAsAnswered);
app.get("/chats/closed", chatController.searchClosedChats);

app.get("/chats/:chatID", verifyJWT, validateChatID, chatController.checkIfChatIsAnswered, chatMessageController.getAllMessagesInAChat);
app.post("/chats/:chatID", verifyJWT, validateChatID, validateSenderID, validateChatMessage, chatMessageController.createMessage);
app.patch("/chats/:chatID", verifyJWT, validateChatID, validateChatMessage, chatMessageController.editMessage);
app.delete("/chats/:chatID", verifyJWT, validateChatID, chatMessageController.deleteMessage);

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
app.get("/medications/user/:userId/low-quantity", medTrackerController.getLowQuantityMedication);
app.get("/medications/user/:userId/expired", medTrackerController.getExpiredMedications);
app.get("/medications/user/:userId", medTrackerController.getAllMedicationByUser);
app.get("/medications/user/:userId/:medicationId", validateMedicationIdParam, medTrackerController.getMedicationById);

app.put("/medications/:userId/tick-all", medTrackerController.tickAllMedications);
app.post("/medications", validateMedicationCreate, medTrackerController.createMedication);
app.put("/medications/:userId/:medicationId", validateMedicationUpdate, medTrackerController.updateMedication);
app.put("/medications/:userId/:medicationId/is-taken", validateMedicationIdParam, medTrackerController.tickOffMedication);
app.put("/medications/:userId/:id/refill", validateRefillRequest, medTrackerController.refillMedication);
app.put("/medications/:userId/:id/missed", validateMedicationIdParam, medTrackerController.markMedicationAsMissed);
app.delete("/medications/:userId/:medicationId", validateMedicationIdParam, medTrackerController.deleteMedication);

// routes for note taker
app.get("/notes-api", noteTakerController.getAllNotes);
app.delete("/notes-api/bulk", bulkValidateNoteIDs, noteTakerController.bulkDeleteNotes);
app.get("/notes-api/search", noteTakerController.searchNotes);
app.get("/notes-api/:id", validateNoteID, noteTakerController.getNotesById);
app.post("/notes-api", validateCreateNoteInput, noteTakerController.createNote);
app.delete("/notes-api/:id", validateNoteID, noteTakerController.deleteNote);
app.put("/notes-api/:id", validateNoteInput, noteTakerController.updateNote);
app.get("/notes-api/export-md/:id", noteTakerController.exportNoteAsMarkdown);

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
