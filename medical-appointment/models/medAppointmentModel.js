const sql = require("mssql");
const dbConfig = require("../../dbConfig");

// Get all appointments for a user
async function getAllAppointmentsByUser(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      SELECT 
        appointment_id as id, 
        FORMAT(date, 'yyyy-MM-dd') as date, 
        title, 
        doctor, 
        CONVERT(VARCHAR(8), start_time, 108) as startTime, 
        CONVERT(VARCHAR(8), end_time, 108) as endTime, 
        location, 
        status,
        notes 
      FROM MedAppointments 
      WHERE user_id = @user_id
      ORDER BY date, start_time ASC`; // Order by date and time
    const request = connection.request();
    request.input("user_id", userId);
    const result = await request.query(query);
    return result.recordset;
    
  } catch(error){
      console.error("Database error in getAllAppointments:", error);
      throw error;
  } finally{
      if(connection){
          try{
              await connection.close();
          } catch(err){
              console.error("Error closing connection:", err);
          }
      }
  }
}

// Get appointments by date 
async function getAppointmentsByDate(date, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      SELECT 
        appointment_id as id, 
        FORMAT(date, 'yyyy-MM-dd') as date, 
        title, 
        doctor, 
        CONVERT(VARCHAR(8), start_time, 108) as startTime, 
        CONVERT(VARCHAR(8), end_time, 108) as endTime, 
        location, 
        status,
        notes 
      FROM MedAppointments 
      WHERE date = @date AND user_id = @user_id
      ORDER BY start_time`; 
    const request = connection.request();
    request.input("date", new Date(date));
    request.input("user_id", userId);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // Appointment not found
    }

    return result.recordset;
  } catch (error) {
      console.error("Database error in getAppointmentsByDate:", error);
      throw error;
  } finally {
      if (connection) {
        try {
            await connection.close();
        } catch (err) {
            console.error("Error closing connection:", err);
        }
      }
  }
}

// Get appointments by month and year
async function getAppointmentsByMonthYear(month, year, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      SELECT 
        appointment_id as id, 
        FORMAT(date, 'yyyy-MM-dd') as date, 
        title, 
        doctor, 
        CONVERT(VARCHAR(8), start_time, 108) as startTime, 
        CONVERT(VARCHAR(8), end_time, 108) as endTime, 
        location, 
        status,
        notes 
      FROM MedAppointments 
      WHERE MONTH(date) = @month AND YEAR(date) = @year AND user_id = @user_id
      ORDER BY date, start_time ASC`; // Order by date and time
    const request = connection.request();
    request.input("month", month);
    request.input("year", year);
    request.input("user_id", userId);
    const result = await request.query(query);
    return result.recordset;
    
  } catch (error) {
      console.error("Database error in getAppointmentsByMonthYear:", error);
      throw error;
  } finally {
      if (connection) {
        try {
            await connection.close();
        } catch (err) {
            console.error("Error closing connection:", err);
        }
      }
  }
}

// Get appointment by appointment id
async function getAppointmentById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      SELECT 
        appointment_id as id, 
        FORMAT(date, 'yyyy-MM-dd') as date, 
        title, 
        doctor, 
        CONVERT(VARCHAR(8), start_time, 108) as startTime, 
        CONVERT(VARCHAR(8), end_time, 108) as endTime, 
        location, 
        status,
        notes 
      FROM MedAppointments 
      WHERE appointment_id = @appointment_id`;
    const request = connection.request();
    request.input("appointment_id", id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // Appointment not found
    }

    return result.recordset[0];
  } catch (error) {
      console.error("Database error in getAppointmentsById:", error);
      throw error;
  } finally {
      if (connection) {
        try {
            await connection.close();
        } catch (err) {
            console.error("Error closing connection:", err);
        }
      }
  }
}

// Create new appointment
async function createAppointment(userId, appointmentData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // Default status to 'Scheduled' if not provided
    if (!appointmentData.status) {
      appointmentData.status = 'Scheduled';
    }

    // Properly handle and validate time values
    let startTime = appointmentData.start_time;
    let endTime = appointmentData.end_time;
    
    // Ensure times are not null/undefined
    if (!startTime || startTime === 'null' || startTime === null || startTime === undefined) {
        startTime = '00:00:00';
    }
    if (!endTime || endTime === 'null' || endTime === null || endTime === undefined) {
        endTime = '00:00:00';
    }
    
    // Validate time format
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime)) {
        startTime = '00:00:00';
    }
    if (!timeRegex.test(endTime)) {
        endTime = '00:00:00';
    }
    
    console.log("Final time values being sent to database:", { startTime, endTime });

    const query = `
      INSERT INTO MedAppointments (user_id, date, title, doctor, start_time, end_time, location, status, notes) 
      VALUES (@user_id, @date, @title, @doctor, @start_time, @end_time, @location, @status, @notes); 
      SELECT SCOPE_IDENTITY() AS appointment_id;`;
    const request = connection.request();
    request.input("user_id", userId);
    request.input("date", new Date(appointmentData.date));
    request.input("title", appointmentData.title);
    request.input("doctor", appointmentData.doctor);
    request.input("start_time", startTime);
    request.input("end_time", endTime);
    request.input("location", appointmentData.location);
    request.input("status", appointmentData.status);
    request.input("notes", appointmentData.notes);
    
    const result = await request.query(query);

    const newAppointmentId = result.recordset[0].appointment_id;
    return await getAppointmentById(newAppointmentId);

  } catch(error){
      console.error("Database error in createAppointment:", error);
      throw error;
  } finally{
      if(connection){
          try{
              await connection.close();
          } catch(err){
              console.error("Error closing connection:", err);
          }
      }
  }
}

// Update appointment by appointment id
async function updateAppointment(id, userId, appointmentData){
  let connection;
  try{
      connection = await sql.connect(dbConfig);
      
      // Properly handle and validate time values
      let startTime = appointmentData.start_time;
      let endTime = appointmentData.end_time;
      
      // Ensure times are not null/undefined
      if (!startTime || startTime === 'null' || startTime === null || startTime === undefined) {
          startTime = '00:00:00';
      }
      if (!endTime || endTime === 'null' || endTime === null || endTime === undefined) {
          endTime = '00:00:00';
      }
      
      // Validate time format
      const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
      if (!timeRegex.test(startTime)) {
          startTime = '00:00:00';
      }
      if (!timeRegex.test(endTime)) {
          endTime = '00:00:00';
      }
      
      console.log("Final time values being sent to database:", { startTime, endTime });

      // Default status to 'Scheduled' if not provided
      const status = appointmentData.status || "Scheduled";

      const query = `
        UPDATE MedAppointments 
        SET date = @date, title = @title, doctor = @doctor, start_time = @start_time, end_time = @end_time, location = @location, status = @status, notes = @notes 
        WHERE appointment_id = @appointment_id AND user_id = @user_id`;
      const request = connection.request();
      request.input("appointment_id", id);
      request.input("user_id", userId);
      request.input("date", new Date(appointmentData.date));
      request.input("title", appointmentData.title);
      request.input("doctor", appointmentData.doctor);
      request.input("start_time", startTime);
      request.input("end_time", endTime);
      request.input("location", appointmentData.location);
      request.input("status", status);
      request.input("notes", appointmentData.notes);
      
      const result = await request.query(query);

      if(result.rowsAffected[0] === 0){
          return null; // Appointment not found
      }

      return await getAppointmentById(id);
  } catch(error){
      console.error("Database error in updateAppointment:", error);
      throw error;
  } finally{
      if(connection){
          try{
              await connection.close();
          } catch(err){
              console.error("Error closing connection:", err);
          }
      }
  }
}

// Delete appointment by appointment id
async function deleteAppointment(id, userId) {
  let connection;
  try {
      connection = await sql.connect(dbConfig);

      const query = `
      DELETE FROM MedAppointments 
      WHERE appointment_id = @appointment_id AND user_id = @user_id`;
      const request = connection.request();
      request.input("appointment_id", id);
      request.input("user_id", userId);
      const result = await request.query(query);

      if(result.rowsAffected[0] === 0){
          return null; // Appointment not found
      }
      return true; //return success response to prevent error
  } catch(error){
      console.error("Database error in deleteAppointment:", error);
      throw error;
  } finally{
      if(connection){
          try{
              await connection.close();
          } catch(err){
              console.error("Error closing connection:", err);
          }
      }
  }
}

// Search appointments by search term
async function searchAppointments(searchTerm, userId) {
  let connection;
  try {
      connection = await sql.connect(dbConfig);

      const query = `
      SELECT 
        appointment_id as id, 
        FORMAT(date, 'yyyy-MM-dd') as date, 
        title, 
        doctor, 
        CONVERT(VARCHAR(8), start_time, 108) as startTime, 
        CONVERT(VARCHAR(8), end_time, 108) as endTime, 
        location, 
        status,
        notes 
      FROM MedAppointments
      WHERE user_id = @user_id AND (
        date LIKE '%' + @searchTerm + '%'
        OR title LIKE '%' + @searchTerm + '%'
        OR doctor LIKE '%' + @searchTerm + '%'
        OR start_time LIKE '%' + @searchTerm + '%'
        OR end_time LIKE '%' + @searchTerm + '%'
        OR location LIKE '%' + @searchTerm + '%'
        OR notes LIKE '%' + @searchTerm + '%'
      )
      ORDER BY date, start_time ASC`; 

      const request = connection.request();
      request.input("user_id", userId); 
      request.input("searchTerm", sql.NVarChar, searchTerm); // Explicitly define type
      const result = await request.query(query);
      return result.recordset;
  } catch (error) {
      console.error("Database error in searchAppointments:", error); 
      throw error; 
  } finally {
      if (connection) {
        try {
            await connection.close();
        } catch (err) {
            console.error("Error closing connection after searchAppointments:", err);
        }
      }
  }
}

module.exports = {
  getAllAppointmentsByUser,
  getAppointmentsByDate,
  getAppointmentsByMonthYear,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  searchAppointments,
};