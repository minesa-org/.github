const videoElement = document.querySelector(".video-background");
const audioElement = document.getElementById("background-audio");

let playbackDirection = 1;
let audioPlayed = false;

function playVideo() {
    videoElement.playbackRate = playbackDirection;
    videoElement.play();
}

function togglePlaybackDirection() {
    playbackDirection *= -1;
}

videoElement.addEventListener("ended", function () {
    togglePlaybackDirection();
    playVideo();
});

videoElement.addEventListener("playing", function () {
    setTimeout(() => {
        togglePlaybackDirection();
        playVideo();
    }, videoElement.duration * 1000);
});

document.addEventListener("scroll", function () {
    const scrollPosition = window.scrollY;

    if (scrollPosition >= 600 && scrollPosition <= 1300) {
        videoElement.style.filter =
            "hue-rotate(220deg) contrast(1.3) saturate(1.2)";
        videoElement.style.transition = "filter 1s linear";
    } else if (scrollPosition >= 1300 && scrollPosition <= 2300) {
        videoElement.style.filter =
            "hue-rotate(395deg) contrast(1.3) saturate(0.6)";
        videoElement.style.transition = "filter 1s linear";
    } else if (scrollPosition >= 2300 && scrollPosition <= 3500) {
        videoElement.style.filter =
            "hue-rotate(260deg) contrast(1) saturate(1.2)";
        videoElement.style.transition = "filter 1s linear";
    } else {
        videoElement.style.filter =
            "hue-rotate(360deg) contrast(1) saturate(1)";
        videoElement.style.transition = "filter 1s linear";
    }
});

function playAudio() {
    if (!audioPlayed) {
        audioElement.muted = false;
        audioElement
            .play()
            .then(() => {
                audioPlayed = true;
            })
            .catch((error) => {
                console.log("Failed to play audio:", error);
            });
    }
}

const logoElement = document.querySelector(".logo");
logoElement.addEventListener("click", function () {
    if (audioElement.paused) {
        audioElement.play();
        logoElement.src = "./assets/svgs/logo.svg";
        logoElement.classList.add("rotate-element");
    } else {
        audioElement.pause();
        logoElement.src = "./assets/svgs/play.svg";
        logoElement.classList.remove("rotate-element");
    }
    playAudio();
});

playVideo();
