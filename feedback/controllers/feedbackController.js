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

    res.status(204).json(deletedFeedback);
  } catch (error) {
    console.error("Controller error in deleteFeedback:", error);
    res.status(500).json({ error: "Error deleting feedback" });
  }
}

async function searchFeedbacks(req, res) {
  const searchTerm = req.query.searchTerm; // Extract search term from query params

  if (!searchTerm) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    const userId = req.user.id; // Get user ID from JWT token
    const feedbacks = await feedbackModel.searchFeedbacks(searchTerm, userId);
    res.json(feedbacks);
  } catch (error) {
    console.error("Controller error in searchFeedbacks:", error);
    res.status(500).json({ message: "Error searching feedbacks" });
  }
}


module.exports = {
  getAllFeedbacksByUser,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  searchFeedbacks,
};