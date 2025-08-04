const startNewChatForm = document.querySelector(".create-new-chat-form");
const questionInput = startNewChatForm.childNodes[1];

startNewChatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const question = prompt("What is your question?");
    questionInput.value = question;
    e.target.submit();
});
