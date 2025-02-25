function createScrollTopButton() {
    const scrollTopButton = document.createElement("button");
    scrollTopButton.id = "scroll-top-button";
    scrollTopButton.textContent = "⇧";

    scrollTopButton.style.display = "none";
    scrollTopButton.style.position = "fixed";
    scrollTopButton.style.right = "50px";
    scrollTopButton.style.bottom = "50px";
    scrollTopButton.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    scrollTopButton.style.borderRadius = "100%";
    scrollTopButton.style.width = "50px";
    scrollTopButton.style.height = "50px";
    scrollTopButton.style.backdropFilter = "blur(20px)";
    scrollTopButton.style.webkitBackdropFilter = "blur(20px)";
    scrollTopButton.style.animation = "slide-top 500ms ease";
    scrollTopButton.style.fontSize = "var(--space-9)";
    scrollTopButton.style.textAlign = "center";
    scrollTopButton.style.color = "var(--clr-default)";

    document.body.appendChild(scrollTopButton);

    return scrollTopButton;
}

function scrollToTop(scrollThreshold = 500) {
    const scrollTopButton = createScrollTopButton();

    scrollTopButton.addEventListener("click", () => {
        window.scrollTo(0, 0);
    });

    window.addEventListener("scroll", () => {
        if (window.scrollY >= scrollThreshold) {
            scrollTopButton.style.display = "block";
        } else {
            scrollTopButton.style.display = "none";
        }
    });
}

export { scrollToTop };
