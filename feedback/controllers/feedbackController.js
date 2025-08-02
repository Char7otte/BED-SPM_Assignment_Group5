const feedbackModel = require("../models/feedbackModel");

// Get all feedbacks
async function getAllFeedbacksByUser(req, res) {
  try {
    const userId = req.user.id; // Get user ID from JWT token
    const feedbacks = await feedbackModel.getAllFeedbacksByUser(userId);
    res.json(feedbacks);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving feedbacks" });
  }
}

// Get all feedbacks - for admin use
async function getAllFeedbacks(req, res) {
  try {
    const feedbacks = await feedbackModel.getAllFeedbacks();
    res.json(feedbacks);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving feedbacks" });
  }
}

// Create new feedback
async function createFeedback(req, res) {
  try {
    const userId = req.user.id; // Get user ID from JWT token
    const newFeedback = await feedbackModel.createFeedback(userId, req.body);
    res.status(201).json(newFeedback);
  } catch (error) {
    console.error("Controller error in createFeedback:", error);
    res.status(500).json({ error: "Error creating feedback" });
  }
}

// Update feedback by ID
async function updateFeedback(req, res) {
  try {
    const id = parseInt(req.params.feedback_id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid feedback ID" });
    }

    const userId = req.user.id; // Get user ID from JWT token
    const updatedFeedback = await feedbackModel.updateFeedback(id, userId, req.body);
    if (!updatedFeedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error("Controller error in updateFeedback:", error);
    res.status(500).json({ error: "Error updating feedback" });
  }
}

// Update feedback status  - for admin use
async function editFeedbackStatus(req, res) {
  try {
    const id = parseInt(req.params.feedback_id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid feedback ID" });
    }

    const status = req.body.status; // Get status from request body
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updatedFeedback = await feedbackModel.editFeedbackStatus(id, status);
    if (!updatedFeedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error("Controller error in editFeedbackStatus:", error);
    res.status(500).json({ error: "Error updating feedback" });
  }
}

// Delete feedback by ID
async function deleteFeedback(req, res) {
  try {
    const id = parseInt(req.params.feedback_id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid feedback ID" });
    }

    const userId = req.user.id; // Get user ID from JWT token
    const deletedFeedback = await feedbackModel.deleteFeedback(id, userId);
    if (!deletedFeedback){
      return res.status(404).json({ error: "Feedback not found"});
    }

    res.status(204).end(); // No content to return
  } catch (error) {
    console.error("Controller error in deleteFeedback:", error);
    res.status(500).json({ error: "Error deleting feedback" });
  }
}

// Delete feedback by ID - for admin use
async function deleteFeedbackAdmin(req, res) {
  try {
    const id = parseInt(req.params.feedback_id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid feedback ID" });
    }

    const deletedFeedback = await feedbackModel.deleteFeedbackAdmin(id);
    if (!deletedFeedback){
      return res.status(404).json({ error: "Feedback not found"});
    }

    res.status(204).end(); // No content to return
  } catch (error) {
    console.error("Controller error in deleteFeedbackAdmin:", error);
    res.status(500).json({ error: "Error deleting feedback" });
  }
}

// Search feedbacks by term 
async function searchFeedbacks(req, res) {
  const searchTerm = req.query.searchTerm; // Extract search term from query params

  if (!searchTerm) {
    return res.status(400).json({ error: "Search term is required" });
  }

  try {
    const userId = req.user.id; // Get user ID from JWT token
    const feedbacks = await feedbackModel.searchFeedbacks(searchTerm, userId);
    res.json(feedbacks);
  } catch (error) {
    console.error("Controller error in searchFeedbacks:", error);
    res.status(500).json({ error: "Error searching feedbacks" });
  }
}

// Search feedbacks by title or status - for admin use
async function searchFeedbacksAdmin(req, res) {
  const searchTerm = req.query.searchTerm; // Extract search term from query params

  if (!searchTerm) {
    return res.status(400).json({ error: "Search term is required" });
  }

  try {
    const feedbacks = await feedbackModel.searchFeedbacksAdmin(searchTerm);
    res.json(feedbacks);
  } catch (error) {
    console.error("Controller error in searchFeedbacksAdmin:", error);
    res.status(500).json({ error: "Error searching feedbacks" });
  }
}


module.exports = {
  getAllFeedbacksByUser,
  getAllFeedbacks,
  createFeedback,
  updateFeedback,
  editFeedbackStatus,
  deleteFeedback,
  deleteFeedbackAdmin,
  searchFeedbacks,
  searchFeedbacksAdmin,
};