const express = require("express");
const path = require("path");
const sql = require("mssql");
const dotenv = require("dotenv");

dotenv.config();

//import medical appointment functions 
const medAppointmentController = require("./health-appointment-calendar/controllers/medAppointmentController");
const {
  validateMedAppointment,
  validateMedAppointmentId,
} = require("./health-appointment-calendar/middlewares/medAppointmentValidation");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.engine("html", require("ejs").renderFile);

//routes for medical appointments
app.get("/med-appointments", medAppointmentController.getAllAppointments);
app.get("/med-appointments/:date", medAppointmentController.getAppointmentByDate);
app.post("/med-appointments", validateMedAppointment, medAppointmentController.createAppointment);
app.put("/med-appointments/:appointment_id", validateMedAppointmentId, validateMedAppointment, medAppointmentController.updateAppointment);
app.delete("/med-appointments/:appointment_id", validateMedAppointmentId, medAppointmentController.deleteAppointment);


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
