const express = require("express");
const path = require("path");
const sql = require("mssql");
const dotenv = require("dotenv");

dotenv.config();

//import functions from alertRoutes
const alertController = require("./alert/controllers/alertController");
const { validateAlert, validateAlertId } = require("./alert/middlewares/alertValidation");

//Import chat functions
const chatController = require("./chat/controllers/chatController");
const chatMessageController = require("./chat/messaging/controllers/chatMessageController");

//import note taker functions
const noteTakerController = require("./note_taker/controller/noteTakerController");
// add validateNote here

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//routes for alerts
app.get("/alerts", alertController.getAllAlerts);
app.get("/alerts/:id", validateAlertId, alertController.getAlertById);
app.post("/alerts", validateAlert, alertController.createAlert);
app.put("/alerts/:id", validateAlertId, validateAlert, alertController.updateAlert);
app.delete("/alerts/:id", validateAlertId, alertController.deleteAlert);

//Charlotte's Chat routes
app.get("/chats", chatController.getAllChats);
// app.get("/chats/:chatID", chatController.getChatByID);
app.post("/chats/create/:userID", chatController.createChat);
app.delete("/chats/:chatID", chatController.deleteChat);

app.get("/chats/:chatID", chatMessageController.getAllMessagesInAChat);
app.post("/chats/:chatID", chatMessageController.createMessage);
app.delete("/chats/:chatID", chatMessageController.deleteMessage);
app.patch("/chats/:chatID", chatMessageController.editMessage);

// Asher's Not Taker routes
app.get("/notes", noteTakerController.getAllNotes);
app.get("/notes/:id", noteTakerController.getNoteById);
// add other routes here

app.listen(port, () => {
    console.log("Server running on port " + port);
});

app.get("/", async (req, res) => {
    res.render("./index.html");
});

process.on("SIGINT", async () => {
    console.log("Server is gracefully shutting down");
    await sql.close();
    console.log("Database connections closed");
    process.exit(0);
});
