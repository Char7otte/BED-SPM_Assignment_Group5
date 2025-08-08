// Authentication functions
function getCurrentUserId() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        const decoded = decodeJwtPayload(token);
        return decoded ? decoded.id : null;
    } catch (error) {
        console.error("Error getting user ID:", error);
        return null;
    }
}

function decodeJwtPayload(token) {
    try {
        const jwt = token.split(" ")[1] || token;
        const payloadBase64 = jwt.split(".")[1];
        const payloadJson = atob(payloadBase64);
        return JSON.parse(payloadJson);
    } catch (error) {
        console.error("Error decoding JWT:", error);
        return null;
    }
}

function isTokenExpired(token) {
    const decoded = decodeJwtPayload(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp < Date.now() / 1000;
}

function checkAuth() {
    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
        localStorage.removeItem("token");

        // Check for token in cookies if not found in localStorage
        const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
        if (match) {
            const cookieToken = decodeURIComponent(match[1]);
            if (!isTokenExpired(cookieToken)) {
                localStorage.setItem("token", cookieToken);
                return true;
            }
        }

        window.location.href = "/login";
        return false;
    }

    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

function logout() {
    localStorage.removeItem("token");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
}

// Trivia game functionality
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");

let triviaData = [];
let currentQuestionIndex = 0;
let currentDifficulty = "easy";
let currentCategory = "9";
let currentUserId = null;

// Category mapping
const categories = {
    9: { name: "General Knowledge", icon: "🧠" },
    12: { name: "Music", icon: "🎵" },
    11: { name: "Film", icon: "🎬" },
    23: { name: "History", icon: "📚" },
    22: { name: "Geography", icon: "🌍" },
    24: { name: "Politics", icon: "🏛️" },
};

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
    // Check authentication first
    if (!checkAuth()) {
        return; // Stop execution if not authenticated
    }

    // Get current user ID from token
    currentUserId = getCurrentUserId();
    if (!currentUserId) {
        console.error("Unable to get user ID from token");
        showAlert("Authentication error. Please log in again.", "danger");
        logout();
        return;
    }

    try {
        // Initialize the trivia game
        initializeTrivia();
    } catch (error) {
        console.error("Initialization error:", error);
        showAlert("Failed to initialize trivia game. Please refresh the page.", "danger");
    }
});

function initializeTrivia() {
    // Start with category selection
    startNewQuiz();

    // Set up next button event listener
    nextBtn.addEventListener("click", () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < triviaData.length) {
            showQuestion();
        } else {
            showQuizComplete();
        }
    });
}

function showAlert(message, type = "success") {
    // Create alert container if it doesn't exist
    let alertContainer = document.getElementById("alert-container");
    if (!alertContainer) {
        alertContainer = document.createElement("div");
        alertContainer.id = "alert-container";
        alertContainer.style.position = "fixed";
        alertContainer.style.top = "20px";
        alertContainer.style.right = "20px";
        alertContainer.style.zIndex = "9999";
        document.body.appendChild(alertContainer);
    }

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible`;
    alert.style.marginBottom = "10px";
    alert.innerHTML = `
    <button type="button" class="close" onclick="this.parentElement.remove()">
      <span>&times;</span>
    </button>
    ${message}
  `;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function fetchTrivia(category, difficulty) {
    // Check authentication before making API calls
    if (!checkAuth()) {
        return;
    }

    currentCategory = category;
    currentDifficulty = difficulty;
    const apiUrl = `https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}`;

    // Show loading message
    questionEl.innerHTML = `
    <div class="loading-message">
      <h3>Loading ${categories[category].name} - ${difficulty.toUpperCase()} questions...</h3>
      <div class="loading-spinner">⏳</div>
    </div>
  `;
    answersEl.innerHTML = "";
    feedbackEl.textContent = "";
    nextBtn.style.display = "none";

    fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
            if (data.results && data.results.length > 0) {
                triviaData = data.results;
                currentQuestionIndex = 0;
                showQuestion();
            } else {
                questionEl.innerHTML = `
          <div class="error-message">
            <h3>No questions available for this category and difficulty.</h3>
            <button onclick="startNewQuiz()" class="new-quiz-btn">Choose Different Options</button>
          </div>
        `;
            }
        })
        .catch((error) => {
            console.error("Error fetching trivia:", error);
            questionEl.innerHTML = `
        <div class="error-message">
          <h3>Sorry, there was an error loading the questions.</h3>
          <button onclick="startNewQuiz()" class="new-quiz-btn">Try Again</button>
        </div>
      `;
        });
}

function showQuestion() {
    feedbackEl.textContent = "";
    nextBtn.style.display = "none";
    answersEl.innerHTML = "";

    const questionObj = triviaData[currentQuestionIndex];

    // Display category, difficulty and question number
    const questionHeader = `<div class="question-info">
    <div class="category-info">
      <span class="category-badge">${categories[currentCategory].icon} ${categories[currentCategory].name}</span>
      <span class="difficulty-badge ${currentDifficulty}">${currentDifficulty.toUpperCase()}</span>
    </div>
    <span class="question-number">Question ${currentQuestionIndex + 1} of ${triviaData.length}</span>
  </div>`;

    questionEl.innerHTML = questionHeader + `<div class="question-content">${decodeURIComponent(questionObj.question)}</div>`;

    let answers = [...questionObj.incorrect_answers, questionObj.correct_answer];
    shuffle(answers);

    answers.forEach((answer) => {
        const li = document.createElement("li");
        li.innerHTML = `<button>${decodeURIComponent(answer)}</button>`;
        li.querySelector("button").addEventListener("click", () => checkAnswer(answer, questionObj.correct_answer));
        answersEl.appendChild(li);
    });
}

function checkAnswer(selected, correct) {
    const buttons = answersEl.querySelectorAll("button");
    buttons.forEach((btn) => (btn.disabled = true));

    if (selected === correct) {
        feedbackEl.innerHTML = '<div class="feedback correct">✅ Correct! Well done!</div>';
    } else {
        feedbackEl.innerHTML = `<div class="feedback incorrect">❌ Oops! The correct answer was: <strong>${decodeURIComponent(
            correct
        )}</strong></div>`;
    }

    nextBtn.style.display = "inline-block";
}

function showCategorySelection() {
    questionEl.innerHTML = `
    <div class="welcome-header">
      <h2>🧠 Trivia Quiz</h2>
      <p>Welcome! Choose a category to get started:</p>
    </div>
    <div class="category-selection">
      ${Object.entries(categories)
          .map(
              ([id, info]) => `
        <button class="category-btn" onclick="showDifficultySelection('${id}')">
          <div class="category-icon">${info.icon}</div>
          <div class="category-name">${info.name}</div>
        </button>
      `
          )
          .join("")}
    </div>
  `;
    answersEl.innerHTML = "";
    feedbackEl.textContent = "";
    nextBtn.style.display = "none";
}

function showDifficultySelection(categoryId) {
    const category = categories[categoryId];
    questionEl.innerHTML = `
    <div class="selection-header">
      <button onclick="showCategorySelection()" class="back-btn">← Back to Categories</button>
      <h3>${category.icon} ${category.name}</h3>
      <p>Choose your difficulty level:</p>
    </div>
    <div class="difficulty-selection">
      <button class="difficulty-btn easy" onclick="fetchTrivia('${categoryId}', 'easy')">
        🟢 Easy
        <small>Simple questions for everyone</small>
      </button>
      <button class="difficulty-btn medium" onclick="fetchTrivia('${categoryId}', 'medium')">
        🟡 Medium
        <small>A bit more challenging</small>
      </button>
      <button class="difficulty-btn hard" onclick="fetchTrivia('${categoryId}', 'hard')">
        🔴 Hard
        <small>For trivia experts</small>
      </button>
    </div>
  `;
    answersEl.innerHTML = "";
    feedbackEl.textContent = "";
    nextBtn.style.display = "none";
}

function showQuizComplete() {
    const categoryName = categories[currentCategory].name;
    questionEl.innerHTML = `
    <div class="quiz-complete">
      🎊 Congratulations!
      <br>
      You've completed all ${categoryName} - ${currentDifficulty.toUpperCase()} questions!
      <br><br>
      <button onclick="showDifficultySelection('${currentCategory}')" class="new-quiz-btn">
        Try Different Difficulty
      </button>
      <button onclick="startNewQuiz()" class="new-quiz-btn secondary">
        Choose New Category
      </button>
      <button onclick="window.location.href='/index.html'" class="new-quiz-btn tertiary">
        Back to Home
      </button>
    </div>
  `;
    answersEl.innerHTML = "";
    feedbackEl.textContent = "";
    nextBtn.style.display = "none";
}

function startNewQuiz() {
    // Check authentication before starting
    if (!checkAuth()) {
        return;
    }

    showCategorySelection();
}

// Make functions available globally
window.fetchTrivia = fetchTrivia;
window.showDifficultySelection = showDifficultySelection;
window.startNewQuiz = startNewQuiz;
window.logout = logout;
