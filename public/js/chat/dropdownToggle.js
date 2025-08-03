const dropdowns = document.querySelectorAll(".dropdown");

dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("click", (e) => {
        dropdown.classList.toggle("is-active");
    });
});
