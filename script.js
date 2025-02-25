document.addEventListener("DOMContentLoaded", function () {
    const video = document.getElementById("banner-video");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                video.play();
                observer.unobserve(video);
            }
        });
    });
    observer.observe(video);
});
