const axios = require("axios");

exports.fetchTriviaQuiz = async () => {
    try{
        const response = await axios.get('https://opentdb.com/api.php?amount=10&type=multiple');
        return response.data.results;
    }
    catch (error) {
        console.error("Error fetching trivia quiz data:", error);
        throw error;
    }
    finally {
        console.log("Trivia quiz data fetched successfully.");
    }
};