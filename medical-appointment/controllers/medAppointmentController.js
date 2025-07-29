const medAppointmentModel = require("../models/medAppointmentModel");

// Get all appointments
async function getAllAppointmentsByUser(req, res) {
  try {
    const userId = req.user.id; // Get user ID from JWT token
    const appointments = await medAppointmentModel.getAllAppointmentsByUser(userId);
    res.json(appointments);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving appointments" });
  }
}

// Get appointments by date
async function getAppointmentsByDate(req, res) {
  try {
    const userId = req.user.id; // Get user ID from JWT token
    const date = req.params.date;
    if (!date) {
      return res.status(400).json({ error: "Invalid appointment date" });
    }

    const appointments = await medAppointmentModel.getAppointmentsByDate(date, userId);
    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ error: "No appointments found" });
    }

    res.json(appointments);
  } catch (error) {
    console.error("Controller error in getAppointmentByDate:", error);
    res.status(500).json({ error: "Error retrieving appointment" });
  }
}

// Get appointments by month and year
async function getAppointmentsByMonthYear(req, res) {
  try {
    const userId = req.user.id; // Get user ID from JWT token
    const { month, year } = req.params;

    if (!month || !year) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    const appointments = await medAppointmentModel.getAppointmentsByMonthYear(month, year, userId);
    res.json(appointments);
  } catch (error) {
    console.error("Controller error in getAppointmentsByMonthYear:", error);
    res.status(500).json({ error: "Error retrieving appointments for the month and year" });
  }
}

// Create new appointment
async function createAppointment(req, res) {
  try {
    const userId = req.user.id; // Get user ID from JWT token
    const newAppointment = await medAppointmentModel.createAppointment(userId, req.body);
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

    const userId = req.user.id; // Get user ID from JWT token

    const appointmentData = {
      ...req.body,
      status: req.body.status || "Scheduled" // Provide default status if not provided
    };

    // Validate status for past appointments
    const appointmentDate = new Date(appointmentData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    
    const isPastAppointment = appointmentDate < today;
    const isCompletedToday = appointmentDate.getTime() === today.getTime() && 
                            appointmentData.end_time && 
                            now > new Date(`${appointmentData.date}T${appointmentData.end_time}`);
    
    if (isPastAppointment || isCompletedToday) {
        if (appointmentData.status === "Scheduled" || appointmentData.status === "Ongoing") {
            return res.status(400).json({ 
                error: "Cannot set past appointments to 'Scheduled' or 'Ongoing' status. Please select 'Attended', 'Missed', or 'Cancelled'." 
            });
        }
    }
    
    console.log("Updating appointment with data:", appointmentData);

    const updatedAppointment = await medAppointmentModel.updateAppointment(id, userId, appointmentData);
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

      const userId = req.user.id; // Get user ID from JWT token
      const deletedAppointment = await medAppointmentModel.deleteAppointment(id, userId);
      if (!deletedAppointment){
        return res.status(404).json({ error: "Appointment not found"});
      }

      res.status(204).end(); // No content to return
    } catch (error) {
        console.error("Controller error in deleteAppointment:", error);
        res.status(500).json({ error: "Error deleting appointment" });
    }
}

// Search appointments by search term
async function searchAppointments(req, res) {
    const searchTerm = req.query.searchTerm; // Extract search term from query params

    if (!searchTerm) {
        return res.status(400).json({ message: "Search term is required" });
    }

    try {
        const userId = req.user.id; // Get user ID from JWT token
        const appointments = await medAppointmentModel.searchAppointments(searchTerm, userId);
        res.json(appointments);
    } catch (error) {
        console.error("Controller error in searchAppointments:", error);
        res.status(500).json({ message: "Error searching appointments" });
    }
}


module.exports = {
  getAllAppointmentsByUser,
  getAppointmentsByDate,
  getAppointmentsByMonthYear,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  searchAppointments,
};