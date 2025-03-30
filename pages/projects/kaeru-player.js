(function () {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
})();

let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player("player", {
        videoId: "rGtf0LTlLr0",
        playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 0,
            playsinline: 1,
            showinfo: 0,
            rel: 0,
        },
        events: {
            onReady: updateButton,
        },
    });
}

function toggleAudio() {
    if (!player) return;

    const icon = document.getElementById("playPauseIcon");
    const isPlaying = player.getPlayerState() === 1;

    isPlaying ? player.pauseVideo() : player.playVideo();
    icon.src = `../../assets/vectors/projects/${
        isPlaying ? "play" : "pause"
    }.svg`;
}

function updateButton() {
    const icon = document.getElementById("playPauseIcon");
    if (icon) {
        icon.src = `../../assets/vectors/projects/${
            player.getPlayerState() === 1 ? "pause" : "play"
        }.svg`;
    }
}
