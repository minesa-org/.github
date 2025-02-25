const CELSIUS_INPUT = document.getElementById("celsius-number");
const FAHRENHEIT_INPUT = document.getElementById("fahrenheit-number");
const KELVIN_INPUT = document.getElementById("kelvin-number");

CELSIUS_INPUT.addEventListener("input", function () {
    const CELSIUS_VALUE = parseFloat(CELSIUS_INPUT.value);
    const FAHRENHEIT_VALUE = (CELSIUS_VALUE * 9) / 5 + 32;
    const KELVIN_VALUE = CELSIUS_VALUE + 273.15;

    FAHRENHEIT_INPUT.value = isNaN(FAHRENHEIT_VALUE)
        ? ""
        : FAHRENHEIT_VALUE.toFixed(2);
    KELVIN_INPUT.value = isNaN(KELVIN_VALUE) ? "" : KELVIN_VALUE.toFixed(2);
});

FAHRENHEIT_INPUT.addEventListener("input", function () {
    const FAHRENHEIT_VALUE = parseFloat(FAHRENHEIT_INPUT.value);
    const CELSIUS_VALUE = ((FAHRENHEIT_VALUE - 32) * 5) / 9;
    const KELVIN_VALUE = CELSIUS_VALUE + 273.15;

    CELSIUS_INPUT.value = isNaN(CELSIUS_VALUE) ? "" : CELSIUS_VALUE.toFixed(2);
    KELVIN_INPUT.value = isNaN(KELVIN_VALUE) ? "" : KELVIN_VALUE.toFixed(2);
});

KELVIN_INPUT.addEventListener("input", function () {
    const KELVIN_VALUE = parseFloat(KELVIN_INPUT.value);
    const CELSIUS_VALUE = KELVIN_VALUE - 273.15;
    const FAHRENHEIT_VALUE = (CELSIUS_VALUE * 9) / 5 + 32;

    CELSIUS_INPUT.value = isNaN(CELSIUS_VALUE) ? "" : CELSIUS_VALUE.toFixed(2);
    FAHRENHEIT_INPUT.value = isNaN(FAHRENHEIT_VALUE)
        ? ""
        : FAHRENHEIT_VALUE.toFixed(2);
});
