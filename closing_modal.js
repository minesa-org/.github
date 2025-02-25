let openModal = document.getElementById("open-modal"),
    closeModal = document.getElementById("close-modal"),
    modal = document.getElementById("modal");

openModal.addEventListener("click", () => {
    modal.showModal();
    modal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
    modal.close();
    modal.style.display = "none";
});
