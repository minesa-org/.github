// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Animation configuration with spring physics
const springConfig = {
	duration: 0.7,
	ease: "back.out(1.7)",
};

const bounceConfig = {
	duration: 0.5,
	ease: "elastic.out(1, 0.3)",
};

const smoothConfig = {
	duration: 0.4,
	ease: "power2.out",
};

// Animation utilities
const AnimationUtils = {
	// Spring entrance animation
	springIn: (element, delay = 0, direction = "up") => {
		const directions = {
			up: { y: 50, x: 0 },
			down: { y: -50, x: 0 },
			left: { y: 0, x: 50 },
			right: { y: 0, x: -50 },
		};

		gsap.fromTo(
			element,
			{
				opacity: 0,
				scale: 0.8,
				...directions[direction],
			},
			{
				opacity: 1,
				scale: 1,
				x: 0,
				y: 0,
				delay,
				...springConfig,
			},
		);
	},

	// Floating animation
	float: (element, intensity = 1) => {
		gsap.to(element, {
			y: `+=${10 * intensity}`,
			duration: 2 + Math.random(),
			ease: "sine.inOut",
			yoyo: true,
			repeat: -1,
		});
	},

	// Rotation float
	rotateFloat: (element, intensity = 1) => {
		gsap.to(element, {
			rotation: `+=${5 * intensity}`,
			duration: 2 + Math.random(),
			ease: "sine.inOut",
			yoyo: true,
			repeat: -1,
		});
	},

	// Hover spring effect
	hoverSpring: (element) => {
		// Check if it's a navigation item or primary button for different effects
		const isNavItem = element.closest("nav");

		element.addEventListener("mouseenter", () => {
			if (isNavItem) {
				// Subtle effect for navigation items
				gsap.to(element, {
					y: -2,
					duration: 0.2,
					ease: "power2.out",
				});
			} else if (isPrimaryButton) {
				// Gentle effect for primary button
				gsap.to(element, {
					scale: 1.02,
					y: -3,
					duration: 0.25,
					ease: "power2.out",
				});
			} else {
				// Default effect for other elements
				gsap.to(element, {
					scale: 1.03,
					y: -3,
					duration: 0.2,
					ease: "power2.out",
				});
			}
		});

		element.addEventListener("mouseleave", () => {
			gsap.to(element, {
				scale: 1,
				y: 0,
				duration: 0.2,
				ease: "power2.out",
			});
		});
	},

	// Stagger animation for multiple elements
	staggerIn: (elements, delay = 0.1) => {
		gsap.fromTo(
			elements,
			{
				opacity: 0,
				y: 30,
				scale: 0.9,
			},
			{
				opacity: 1,
				y: 0,
				scale: 1,
				stagger: delay,
				...springConfig,
			},
		);
	},

	// Text reveal animation
	textReveal: (element, delay = 0) => {
		const text = element.textContent;
		element.textContent = "";

		gsap.to(element, {
			text: text,
			duration: 1.5,
			delay,
			ease: "none",
		});
	},

	// Magnetic effect
	magnetic: (element, strength = 0.3) => {
		element.addEventListener("mousemove", (e) => {
			const rect = element.getBoundingClientRect();
			const x = e.clientX - rect.left - rect.width / 2;
			const y = e.clientY - rect.top - rect.height / 2;

			gsap.to(element, {
				x: x * strength,
				y: y * strength,
				duration: 0.3,
				ease: "power2.out",
			});
		});

		element.addEventListener("mouseleave", () => {
			gsap.to(element, {
				x: 0,
				y: 0,
				duration: 0.5,
				ease: "elastic.out(1, 0.3)",
			});
		});
	},
};

// Page-specific animations
const PageAnimations = {
	// Home page animations
	initHomePage: () => {
		// Header animation
		AnimationUtils.springIn("header", 0.2);

		// Logo magnetic effect
		const logo = document.querySelector("header svg");
		if (logo) AnimationUtils.magnetic(logo, 0.2);

		// Hero section staggered entrance
		const heroElements = [
			".website-tagline",
			"h1",
			".hero-text",
			".header__discord",
		];

		heroElements.forEach((selector, index) => {
			const element = document.querySelector(selector);
			if (element) {
				AnimationUtils.springIn(element, 0.4 + index * 0.2);
			}
		});

		// Animate stacked images in hero text
		const stackedImages = document.querySelector(".stacked-images");
		if (stackedImages) {
			AnimationUtils.springIn(stackedImages, 0.8, "left");
			AnimationUtils.float(stackedImages, 0.3);
		}

		// Background elements floating
		const backgroundElements = [
			{ selector: ".figma", intensity: 0.8 },
			{ selector: ".laptop", intensity: 1.2 },
			{ selector: ".sticker", intensity: 0.6 },
		];

		backgroundElements.forEach(({ selector, intensity }) => {
			const element = document.querySelector(selector);
			if (element) {
				AnimationUtils.float(element, intensity);
				AnimationUtils.rotateFloat(element, 0.3);
			}
		});

		// Character animations
		const characters = [
			{ selector: ".mica", delay: 1.0, direction: "left" },
			{ selector: ".neo", delay: 1.2, direction: "right" },
			{ selector: ".saku", delay: 1.4, direction: "up" },
		];

		characters.forEach(({ selector, delay, direction }) => {
			const element = document.querySelector(selector);
			if (element) {
				AnimationUtils.springIn(element, delay, direction);
				AnimationUtils.float(element, 0.5);
			}
		});

		// Navigation entrance
		const nav = document.querySelector("nav");
		if (nav) {
			gsap.fromTo(
				nav,
				{
					opacity: 0,
					y: 20,
				},
				{
					opacity: 1,
					y: 0,
					delay: 1.6,
					...springConfig,
				},
			);

			// Navigation items hover effects
			const navItems = nav.querySelectorAll("a");
			navItems.forEach((item) => {
				AnimationUtils.hoverSpring(item);
			});
		}

		// Discord button special effects (optimized)
		const discordButton = document.querySelector(".header__discord");
		if (discordButton) {
			// Remove magnetic effect and use subtle hover only
			discordButton.addEventListener("mouseenter", () => {
				gsap.to(discordButton, {
					y: -2,
					duration: 0.2,
					ease: "power2.out",
				});
			});

			discordButton.addEventListener("mouseleave", () => {
				gsap.to(discordButton, {
					y: 0,
					duration: 0.2,
					ease: "power2.out",
				});
			});
		}
	},

	// Projects page animations
	initProjectsPage: () => {
		// Header animation
		AnimationUtils.springIn("header", 0.2);

		// Project cards staggered entrance
		const projectCards = document.querySelectorAll(".project");
		if (projectCards.length > 0) {
			// Animate each project card with stagger
			projectCards.forEach((card, index) => {
				// Animate the entire card
				AnimationUtils.springIn(card, 0.5 + index * 0.2);

				// Animate individual elements within the card
				const projectName = card.querySelector(".project-name");
				const projectDescription = card.querySelector(
					".project-description",
				);
				const projectIcon = card.querySelector(".project-icon");
				const projectBanner = card.querySelector(".project-banner");
				const projectImage = card.querySelector(".project-image");

				if (projectName) {
					AnimationUtils.springIn(projectName, 0.7 + index * 0.2);
				}
				if (projectDescription) {
					gsap.fromTo(
						projectDescription,
						{
							opacity: 0,
							scale: 0.8,
							y: 20,
						},
						{
							opacity: 0.4, // Final opacity should be 0.4, not 1
							scale: 1,
							y: 0,
							delay: 0.9 + index * 0.2,
							...springConfig,
						},
					);
				}
				if (projectIcon) {
					AnimationUtils.springIn(projectIcon, 0.6 + index * 0.2);
				}
				if (projectBanner) {
					AnimationUtils.springIn(projectBanner, 0.4 + index * 0.2);
					AnimationUtils.magnetic(projectBanner, 0.1);
				}
				if (projectImage) {
					AnimationUtils.springIn(projectImage, 1.0 + index * 0.2);
				}

				// Add hover effects
				AnimationUtils.hoverSpring(card);

				// Add sequential scaling hover effect
				addProjectHoverEffect(card);
			});
		}

		// Navigation entrance
		const nav = document.querySelector("nav");
		if (nav) {
			gsap.fromTo(
				nav,
				{
					opacity: 0,
					y: 20,
				},
				{
					opacity: 1,
					y: 0,
					delay: 1.0,
					...springConfig,
				},
			);

			// Navigation items hover effects
			const navItems = nav.querySelectorAll("a");
			navItems.forEach((item) => {
				AnimationUtils.hoverSpring(item);
			});
		}

		// Animate kaeru sticker after a delay
		setTimeout(() => {
			animateKaeru();
		}, 1500);
	},

	// Clients page animations
	initClientsPage: () => {
		// Header animation
		AnimationUtils.springIn("header", 0.2);

		// Client cards staggered entrance
		const clientCards = document.querySelectorAll(".client-card");
		if (clientCards.length > 0) {
			clientCards.forEach((card, index) => {
				AnimationUtils.springIn(card, 0.5 + index * 0.3);

				// Add hover effects
				AnimationUtils.hoverSpring(card);
				addClientHoverEffect(card);
			});
		}

		// Become partner button
		const becomePartner = document.querySelector(".become-partner");
		if (becomePartner) {
			AnimationUtils.springIn(becomePartner, 1.2);
			AnimationUtils.hoverSpring(becomePartner);
		}

		// Animate heart reaction after a delay
		setTimeout(() => {
			animateHeart();
		}, 2000);

		// Navigation entrance
		const nav = document.querySelector("nav");
		if (nav) {
			gsap.fromTo(
				nav,
				{
					opacity: 0,
					y: 20,
				},
				{
					opacity: 1,
					y: 0,
					delay: 1.4,
					...springConfig,
				},
			);

			// Navigation items hover effects
			const navItems = nav.querySelectorAll("a");
			navItems.forEach((item) => {
				AnimationUtils.hoverSpring(item);
			});
		}
	},
};

// Project hover effects
const addProjectHoverEffect = (projectCard) => {
	const elements = [
		{ selector: ".project-banner", delay: 0 }, // Top
		{ selector: ".project-image", delay: 0.05 }, // Bottom right
		{ selector: ".project-icon", delay: 0.1 }, // Content area
		{ selector: ".project-name", delay: 0.15 }, // Content area
		{ selector: ".project-description", delay: 0.2 }, // Content area
	];

	projectCard.addEventListener("mouseenter", () => {
		elements.forEach(({ selector, delay }) => {
			const element = projectCard.querySelector(selector);
			if (element) {
				gsap.to(element, {
					scale: 1.02,
					delay,
					duration: 0.2,
					ease: "power2.out",
				});
			}
		});
	});

	projectCard.addEventListener("mouseleave", () => {
		elements.forEach(({ selector, delay }) => {
			const element = projectCard.querySelector(selector);
			if (element) {
				gsap.to(element, {
					scale: 1,
					delay: delay * 0.5,
					duration: 0.2,
					ease: "power2.out",
				});
			}
		});
	});
};

// Client hover effects
const addClientHoverEffect = (clientCard) => {
	const elements = [
		{ selector: ".client-icon", delay: 0 },
		{ selector: ".client-name", delay: 0.05 },
		{ selector: ".client-badge", delay: 0.1 },
	];

	clientCard.addEventListener("mouseenter", () => {
		elements.forEach(({ selector, delay }) => {
			const element = clientCard.querySelector(selector);
			if (element) {
				gsap.to(element, {
					scale: 1.05,
					delay,
					duration: 0.2,
					ease: "power2.out",
				});
			}
		});
	});

	clientCard.addEventListener("mouseleave", () => {
		elements.forEach(({ selector, delay }) => {
			const element = clientCard.querySelector(selector);
			if (element) {
				gsap.to(element, {
					scale: 1,
					delay: delay * 0.5,
					duration: 0.2,
					ease: "power2.out",
				});
			}
		});
	});
};

// Heart reaction animation
const animateHeart = () => {
	const heart = document.querySelector(".heart");
	if (heart) {
		// First phase: Enter and grow
		gsap.fromTo(
			heart,
			{
				x: -100,
				y: 50,
				scale: 0.5,
				opacity: 0,
				rotation: -15,
			},
			{
				x: 20,
				y: 0,
				scale: 1,
				opacity: 1,
				rotation: 0,
				duration: 0.7,
				ease: "power2.out",
				onComplete: () => {
					gsap.to(heart, {
						x: 20,
						y: -200,
						scale: 1.5,
						opacity: 1,
						rotation: 0,
						delay: 1,
						duration: 1.2,
						ease: "back.out(1.1)",
					});
				},
			},
		);
	}
};

// Kaeru sticker animation
const animateKaeru = () => {
	const kaeru = document.querySelector(".kaeru");
	if (kaeru) {
		gsap.fromTo(
			kaeru,
			{
				y: 200,
				scale: 0,
				opacity: 0,
				rotation: 180,
			},
			{
				y: -50,
				scale: 1,
				opacity: 1,
				rotation: 0,
				duration: 1,
				ease: "elastic.out(1, 0.5)",
				onComplete: () => {
					// Add subtle floating animation after sticking
					gsap.to(kaeru, {
						y: "+=10",
						duration: 1.5,
						ease: "sine.inOut",
						yoyo: true,
						repeat: -1,
					});
				},
			},
		);
	}
};

// Note: Scroll animations removed since there's no scrolling/parallax needed

// Performance optimizations
const optimizeAnimations = () => {
	// Respect user's motion preferences
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	);

	if (prefersReducedMotion.matches) {
		// Disable animations for users who prefer reduced motion
		gsap.globalTimeline.timeScale(0);
		return;
	}

	// Optimize for mobile devices
	const isMobile = window.innerWidth <= 768;
	if (isMobile) {
		// Reduce animation complexity on mobile
		gsap.globalTimeline.timeScale(0.7);
	}
};

// Page transition effects
const initPageTransitions = () => {
	// Add loading animation
	const body = document.body;
	gsap.set(body, { opacity: 0 });

	window.addEventListener("load", () => {
		gsap.to(body, {
			opacity: 1,
			duration: 0.5,
			ease: "power2.out",
		});
	});

	// Smooth page transitions for navigation
	const navLinks = document.querySelectorAll("nav a");
	navLinks.forEach((link) => {
		link.addEventListener("click", (e) => {
			const href = link.getAttribute("href");

			// Skip animation for external links
			if (href.startsWith("http")) return;

			e.preventDefault();

			gsap.to(body, {
				opacity: 0,
				duration: 0.2,
				ease: "power2.in",
				onComplete: () => {
					window.location.href = href;
				},
			});
		});
	});
};

// Utility functions
const joinNow = () => {
	window.open("https://discord.gg/8CtGyWxgGt", "_blank");
};

// Main initialization
const init = () => {
	// Apply performance optimizations first
	optimizeAnimations();

	// Initialize page transitions
	initPageTransitions();

	// Determine current page and initialize appropriate animations
	const currentPath = window.location.pathname;

	if (currentPath.includes("projects")) {
		PageAnimations.initProjectsPage();
	} else if (currentPath.includes("clients")) {
		PageAnimations.initClientsPage();
	} else {
		PageAnimations.initHomePage();
	}

	// Add some delightful micro-interactions
	addMicroInteractions();
};

// Micro-interactions for enhanced UX
const addMicroInteractions = () => {
	// Cursor trail effect (subtle)
	let cursor = { x: 0, y: 0 };

	document.addEventListener("mousemove", (e) => {
		cursor.x = e.clientX;
		cursor.y = e.clientY;
	});
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
