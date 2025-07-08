const forms = document.querySelectorAll(".delete-chat-form");
for (const form of forms) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (confirm("Are you sure you want to delete this chat?")) {
            form.parentElement.parentElement.parentElement.hidden = true; //god bless.
            this.submit();
        }
    });
}
