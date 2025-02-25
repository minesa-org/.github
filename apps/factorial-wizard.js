function getRandomText() {
    const texts = [
        "Are you making a rocket? What is this number?",
        "Agh... My head hurts.",
        "Umm... I don't know. This is kinda high.",
        "What the- I mean, this is too high number to calculate. Even for me.",
    ];
    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
}

const FACTORIAL_INPUT = document.getElementById("factorial-input");
const FACTORIAL_RESULT = document.getElementById("factorial-result");

FACTORIAL_INPUT.addEventListener("input", () => {
    const USER_INPUT = parseInt(FACTORIAL_INPUT.value);

    if (isNaN(USER_INPUT)) {
        FACTORIAL_RESULT.textContent =
            "Please enter the factorial you want to calculate.";
        return;
    }

    if (USER_INPUT <= 0) {
        FACTORIAL_RESULT.textContent =
            "Negative. Factorial is not defined for negative numbers or zero.";
        return;
    }

    let factorial = 1;
    let multiplication = "";

    for (let i = USER_INPUT; i >= 1; i--) {
        factorial *= i;
        if (i === 1) {
            multiplication += `${i}`;
        } else {
            multiplication += `${i} * `;
        }
    }

    if (USER_INPUT >= 10) {
        multiplication = `${USER_INPUT} * ${USER_INPUT - 1} * ... * 2 * 1`;
    }
    if (USER_INPUT > 170) {
        let randomText = getRandomText();
        FACTORIAL_RESULT.textContent = randomText;
        return;
    }

    FACTORIAL_RESULT.textContent = `${USER_INPUT}! = ${multiplication} = ${factorial}`;
});
