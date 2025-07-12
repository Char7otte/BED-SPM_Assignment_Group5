const express = require("express");
const path = require("path");
const sql = require("mssql");
const dotenv = require("dotenv");

dotenv.config();

//import note taker functions
const noteTakerController = require("./note_taker/controllers/noteTakerController");
// add validateNote here

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

//app.set("view engine", "ejs");
//app.set("views", path.join(__dirname, "views"));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Asher's Note Taker routes
app.get("/notes", noteTakerController.getAllNotes);
app.get("/notes", noteTakerController.searchNotes);
// add other routes here

app.listen(port, () => {
    console.log("Server running on port " + port);
});

process.on("SIGINT", async () => {
    console.log("Server is gracefully shutting down");
    await sql.close();
    console.log("Database connections closed");
    process.exit(0);
});
