const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const methodOverride = require("method-override");

dotenv.config();

//import functions from alertRoutes
const alertController = require("./alert/controllers/alertController");
const { validateAlert, validateAlertId } = require("./alert/middlewares/alertValidation");
//import functions from userRoutes
const userController = require("./users/controllers/userController");
const { validateUserInput, verifyJWT } = require("./users/middlewares/userValidation");
const { authenticateToken } = require("./alert/middlewares/auth");

//Import chat functions
const chatController = require("./chat/controllers/chatController");
const chatMessageController = require("./chat/controllers/chatMessageController");

//import medical appointment functions
const medAppointmentController = require("./medical-appointment/controllers/medAppointmentController");
const { validateMedAppointment, validateMedAppointmentId } = require("./medical-appointment/middlewares/medAppointmentValidation");

const medTrackerController = require("./medication_tracker/controller/medTrackerController");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//ALERT SEARCH + READ STATUS (specific paths FIRST)/
app.get("/alerts/search", alertController.searchAlerts); //  Search alerts by title or category
app.get("/alerts/unreadstatus/:id", alertController.getUnreadAlerts); //  Get read status of an alert by ID
app.put("/alerts/updatestatus/:id", validateAlertId, alertController.updateAlertStatus); //  Mark alert as read/unread


// CREATE ALERT (Admin only)
app.post("/alerts", validateAlert, alertController.createAlert); //  Create a new alert

// UPDATE + DELETE ALERT (Admin only)
app.put("/alerts/:id", validateAlertId, validateAlert, alertController.updateAlert); // Update an existing alert
app.delete("/alerts/:id", validateAlertId, alertController.deleteAlert); //  Delete alert

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
app.put("/users/updatedetail/:id", verifyJWT, validateUserInput, userController.updateUser); // Update user details #okay
app.delete("/users/:id", verifyJWT, userController.deleteUser); //OKay


//Charlotte's Chat routes
app.get("/chats", chatController.getAllChats);
// app.get("/chats/:chatID", chatController.getChatByID);
app.post("/chats/create/:userID", chatController.createChat);
app.patch("/chats/delete/:chatID", chatController.deleteChat); //This is patch in order to maintain the chat in the backend.

app.get("/chats/:chatID", chatMessageController.getAllMessagesInAChat);
app.post("/chats/:chatID", chatMessageController.createMessage);
app.delete("/chats/:chatID", chatMessageController.deleteMessage);
app.patch("/chats/:chatID", chatMessageController.editMessage);


//routes for medical appointments
app.get("/med-appointments", verifyJWT, medAppointmentController.getAllAppointmentsByUser);
app.get("/med-appointments/:date", verifyJWT, medAppointmentController.getAppointmentByDate);
app.post("/med-appointments", verifyJWT, validateMedAppointment, medAppointmentController.createAppointment);
app.put("/med-appointments/:appointment_id", verifyJWT, validateMedAppointmentId, validateMedAppointment, medAppointmentController.updateAppointment);
app.delete("/med-appointments/:appointment_id", verifyJWT, validateMedAppointmentId, medAppointmentController.deleteAppointment);

//routes for medication tracker
app.get("/medications/user/:userId/daily", medTrackerController.getDailyMedicationByUser);
app.get("/medications/user/:userId/weekly", medTrackerController.getWeeklyMedicationByUser);
app.put("/medications/:userId/:medicationId/is-taken", medTrackerController.tickOffMedication);
app.get("/medications/user/:userId/search", medTrackerController.searchMedicationByName);

app.get("/medications/user/:userId", medTrackerController.getAllMedicationByUser);
app.get("/medications/:userId/:medicationId", medTrackerController.getMedicationById);
app.post("/medications", medTrackerController.createMedication);
app.put("/medications/:userId/:medicationId", medTrackerController.updateMedication);
app.delete("/medications/:userId/:medicationId", medTrackerController.deleteMedication);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
