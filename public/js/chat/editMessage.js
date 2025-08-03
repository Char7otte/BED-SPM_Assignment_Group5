const forms = document.querySelectorAll(".edit-message-form");
for (const form of forms) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const message = form[1].value;

        const newMessage = prompt("Edit message:", message);
        if (newMessage === null) {
        } else if (newMessage === "") {
            alert("Message can't be empty!");
        } else {
            form[1].value = newMessage;
            e.target.submit();
        }
    });
}
