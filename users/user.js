var currentUser = window.currentUser;
var userColors = {
    defaultColor: "var(--clr-primary-300)",
    neo: "var(--neo-color)",
    mica: "var(--mica-color)",
    saku: "var(--saku-color)",
    maintainer: "var(--maintainer-color)",
    member: "var(--member-color)",
};

var userColor = userColors[currentUser] || userColors["defaultColor"];

document.documentElement.style.setProperty("--clr-default", userColor);
