const medAppointmentModel = require("../models/medAppointmentModel");

// Get all appointments
async function getAllAppointments(req, res) {
  try {
    const appointments = await medAppointmentModel.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving appointments" });
  }
}

// Get appointment by date
async function getAppointmentByDate(req, res) {
  try {
    const date = req.params.date;
    if (!date) {
      return res.status(400).json({ error: "Invalid appointment date" });
    }

    const appointment = await medAppointmentModel.getAppointmentByDate(date);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    console.error("Controller error in getAppointmentByDate:", error);
    res.status(500).json({ error: "Error retrieving appointment" });
  }
}

// Create new appointment
async function createAppointment(req, res) {
  try {
    const newAppointment = await medAppointmentModel.createAppointment(req.body);
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error("Controller error in createAppointment:", error);
    res.status(500).json({ error: "Error creating appointment" });
  }
}

// Update appointment by ID
async function updateAppointment(req, res) {
  try {
    const id = parseInt(req.params.appointment_id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    const updatedAppointment = await medAppointmentModel.updateAppointment(id, req.body);
    if (!updatedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error("Controller error in updateAppointment:", error);
    res.status(500).json({ error: "Error updating appointment" });
  }
}

// Delete appointment by ID
async function deleteAppointment(req, res) {
    try {
      const id = parseInt(req.params.appointment_id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }

      const deletedAppointment = await medAppointmentModel.deleteAppointment(id);
      if (!deletedAppointment){
        return res.status(404).json({ error: "Appointment not found"});
      }

      res.status(204).json(deletedAppointment);
    } catch (error) {
        console.error("Controller error in deleteAppointment:", error);
        res.status(500).json({ error: "Error deleting appointment" });
    }
}

module.exports = {
  getAllAppointments,
  getAppointmentByDate,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};