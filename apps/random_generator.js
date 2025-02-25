// Function to generate a random color in hex format
function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to generate a random password of a specified length
// Function to generate a random password of a specified length with hyphens every 5 characters
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

// Function to generate a random number within a specified range
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to update the placeholders and the color block
function updatePlaceholders() {
    let color = getRandomColor();
    document.getElementById("color").textContent = color;
    document.getElementById("password").textContent = getRandomPassword(15); // Change the length as needed
    document.getElementById("number").textContent = getRandomNumber(
        10000,
        99999
    );
    document.getElementById("color-block").style.backgroundColor = color;
}

// Attach a click event listener to the "Refresh" button
document
    .getElementById("refresh-button")
    .addEventListener("click", updatePlaceholders);

// Generate random values when the page loads
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
