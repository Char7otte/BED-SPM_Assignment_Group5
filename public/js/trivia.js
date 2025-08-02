const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const feedbackEl = document.getElementById('feedback');
const nextBtn = document.getElementById('next-btn');

let triviaData = [];
let currentQuestionIndex = 0;

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function fetchTrivia() {
  fetch('https://opentdb.com/api.php?amount=10')
    .then(res => res.json())
    .then(data => {
      triviaData = data.results;
      currentQuestionIndex = 0;
      showQuestion();
    });
}

function showQuestion() {
  feedbackEl.textContent = '';
  nextBtn.style.display = 'none';
  answersEl.innerHTML = '';

  const questionObj = triviaData[currentQuestionIndex];
  questionEl.innerHTML = decodeURIComponent(questionObj.question);

  let answers = [...questionObj.incorrect_answers, questionObj.correct_answer];
  shuffle(answers);

  answers.forEach(answer => {
    const li = document.createElement('li');
    li.innerHTML = `<button>${decodeURIComponent(answer)}</button>`;
    li.querySelector('button').addEventListener('click', () => checkAnswer(answer, questionObj.correct_answer));
    answersEl.appendChild(li);
  });
}

function checkAnswer(selected, correct) {
  const buttons = answersEl.querySelectorAll('button');
  buttons.forEach(btn => btn.disabled = true);

  if (selected === correct) {
    feedbackEl.textContent = '✅ Correct!';
  } else {
    feedbackEl.textContent = `❌ Oops! Correct answer: ${decodeURIComponent(correct)}`;
  }

  nextBtn.style.display = 'inline-block';
}

nextBtn.addEventListener('click', () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < triviaData.length) {
    showQuestion();
  } else {
    questionEl.textContent = "🎊 You've finished all questions!";
    answersEl.innerHTML = '';
    feedbackEl.textContent = '';
    nextBtn.style.display = 'none';
  }
});

fetchTrivia();
