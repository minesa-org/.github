function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomPassword(length) {
    const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset.charAt(randomIndex);

        // Add a hyphen every 5 characters except for the last group
        if ((i + 1) % 5 === 0 && i !== length - 1) {
            password += "-";
        }
    }
    return password;
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updatePlaceholders() {
    let color = getRandomColor();
    document.getElementById("color").textContent = color;
    document.getElementById("password").textContent = getRandomPassword(15);
    document.getElementById("number").textContent = getRandomNumber(
        10000,
        99999
    );
    document.getElementById("color-block").style.backgroundColor = color;
}

document
    .getElementById("refresh-button")
    .addEventListener("click", updatePlaceholders);

updatePlaceholders();

const openAppsModal = document.getElementById("open-apps-modal");
const closeAppsModal = document.getElementById("close-apps-modal");
const appsModal = document.getElementById("apps-modal");

openAppsModal.addEventListener("click", () => {
    appsModal.showModal();
    appsModal.style.display = "flex";
});

closeAppsModal.addEventListener("click", () => {
    appsModal.close();
    appsModal.style.display = "none";
});
