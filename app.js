const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const medTrackerController = require("./medication_tracker/controller/medTrackerController");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/medications/user/:userId/daily", medTrackerController.getDailyMedicationByUser);
app.get("/medications/user/:userId/weekly", medTrackerController.getWeeklyMedicationByUser);
app.get("/medications/search", medTrackerController.searchMedicationByName);
app.put("/medications/:userId/:medicationId/is-taken", medTrackerController.tickOffMedication);

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
