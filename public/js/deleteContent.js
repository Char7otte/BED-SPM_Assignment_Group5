const scriptElement = document.querySelector('script[src*="deleteContent.js"]');
const classOfFormToLookFor = `.${scriptElement.dataset.classOfFormToLookFor}`;
const classOfElementToHide = scriptElement.dataset.classOfElementToHide;

const forms = document.querySelectorAll(classOfFormToLookFor);
for (const form of forms) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (confirm("Are you sure you want to delete this?")) {
            let parentElement = form;
            while (parentElement && !parentElement.classList.contains(classOfElementToHide)) {
                parentElement = parentElement.parentElement;
            }

            if (parentElement && parentElement.classList.contains(classOfElementToHide)) {
                parentElement.hidden = true;
                e.target.submit();
            } else {
                console.error("Could not find parent with class: ", classOfElementToHide);
            }
        }
    });
}
