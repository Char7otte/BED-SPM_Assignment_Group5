const express = require("express");
const path = require("path");
const sql = require("mssql");
const dotenv = require("dotenv");

dotenv.config();

const medTrackerController = require("./controller/medTrackerController");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/medications/:id", medTrackerController.getMedicationById);
app.get("/medications/user/:userId", medTrackerController.getAllMedicationByUser);
app.get("/medications/user/:userId/:daily", medTrackerController.getDailyMedicationByUser);
app.get("medications/user/:userId/:weekly", medTrackerController.getWeeklyMedicationByUser);
app.post("/medications", medTrackerController.createMedication);
app.put("/medications/:userId/:medicationId", medTrackerController.updateMedication);
app.delete("/medications/:userId/:medicationId", medTrackerController.deleteMedication);
app.put("/medications/:userId/:medicationId/is-taken", medTrackerController.tickOffMedication);
app.get("/medications/:userId/:medicationId/by-name", medTrackerController.getTickOffMedication);

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

