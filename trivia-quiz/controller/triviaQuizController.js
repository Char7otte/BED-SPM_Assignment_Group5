const triviaModel = require("../model/triviaQuizModel");

exports.getTriviaQuiz = async (req, res) => {
    try {
        const questions = await triviaModel.fetchTriviaQuiz();
        res.render('trivia', { questions });
    }
    catch (error) {
        console.error("Error in getTriviaQuiz:", error);
        res.status(500).send("Failed to fetch trivia quiz data.");
    }
};