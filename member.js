(function () {
	const MEMBER_ORDER = ["mica", "neo", "saku", "telahair", "ekmek", "tired"];
	const signatureAssets = {
		mica: "assets/signatures/Micha%20G..svg",
		neo: "assets/signatures/%C4%B0brahim%20G..svg",
		saku: "assets/signatures/Daphne%20R..svg",
		telahair: "assets/signatures/Arda%20A..svg",
		ekmek: "assets/signatures/%C3%96mer%20E..svg",
		tired: "assets/signatures/Iskhak%20W..svg",
	};

	const refs = {
		body: document.body,
		loading: document.getElementById("loading"),
		loadingLabel: document.getElementById("loading-label"),
		content: document.getElementById("content"),
		router: document.getElementById("member-router"),
		avatar: document.getElementById("avatar"),
		nameLabel: document.getElementById("name-label"),
		quote: document.getElementById("quote"),
		bio: document.getElementById("bio"),
		socials: document.getElementById("socials"),
		signatureWrap: document.getElementById("signature-wrap"),
		gallery: document.getElementById("gallery"),
		galleryStage: document.getElementById("gallery-stage"),
		stickersLayer: document.getElementById("stickers-layer"),
		ambientCanvas: document.getElementById("member-fire-canvas"),
	};

	if (!refs.body || !refs.content) return;

	const state = {
		membersPromise: null,
		members: null,
		currentKey: null,
		isTransitioning: false,
		stickers: [],
		stickerFrame: 0,
		ambientCtx: refs.ambientCanvas ? refs.ambientCanvas.getContext("2d") : null,
		ambientParticles: [],
		ambientSigils: [],
		ambientFrame: 0,
		ambientLastRender: 0,
		ambientRunning: false,
		ambientMode: "",
	};

	function normalizeAssetPath(path) {
		return path.replace(/^\.\.\//, "");
	}

	function escapeHtml(value) {
		return value
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;");
	}

	function delay(ms) {
		return new Promise(resolve => window.setTimeout(resolve, ms));
	}

	function getMemberKeyFromLocation() {
		const params = new URLSearchParams(window.location.search);
		const raw = (params.get("user") || "neo").toLowerCase();
		return MEMBER_ORDER.includes(raw) ? raw : "neo";
	}

	function getMemberNickname(memberKey) {
		return memberKey.toUpperCase();
	}

	function setLoadingLabel(message) {
		if (refs.loadingLabel) refs.loadingLabel.textContent = message;
	}

	function showLoading(message) {
		setLoadingLabel(message);
		refs.body.classList.remove("is-ready");
	}

	function hideLoading() {
		requestAnimationFrame(() => {
			refs.body.classList.add("is-ready");
		});
	}

	async function loadMembersData() {
		if (!state.membersPromise) {
			state.membersPromise = fetch("data/member.json").then(async response => {
				if (!response.ok) {
					throw new Error(`Failed to load member data: ${response.status}`);
				}
				const members = await response.json();
				state.members = members;
				return members;
			});
		}
		return state.membersPromise;
	}

	function renderInlineHighlights(html) {
		return html
			.replace(
				/<img[^>]*src="([^"]*text_logo_minesa\.png)"[^>]*alt="([^"]*)"[^>]*>/g,
				(_, src, label) => {
					const displayLabel = label.toLowerCase() === "mini-interaction" ? "mini-interaction" : `The ${label}`;
					return `<span class="member-inline-highlight"><img class="member-inline-mark" src="${escapeHtml(normalizeAssetPath(src))}" alt=""><span class="member-inline-label">${escapeHtml(displayLabel)}</span></span>`;
				}
			)
			.replace(
				/<img[^>]*src="([^"]*text_logo_darkvoid\.png)"[^>]*alt="([^"]*)"[^>]*>/g,
				(_, src, label) => `<span class="member-inline-highlight"><img class="member-inline-mark member-inline-mark-darkvoid" src="${escapeHtml(normalizeAssetPath(src))}" alt=""><span class="member-inline-label">${escapeHtml(label)}</span></span>`
			)
			.replace(
				/<img[^>]*src="([^"]*text_logo_dungeon_blitz\.png)"[^>]*alt="([^"]*)"[^>]*>/g,
				(_, src, label) => `<span class="member-inline-highlight"><img class="member-inline-mark member-inline-mark-dungeon" src="${escapeHtml(normalizeAssetPath(src))}" alt=""><span class="member-inline-label">${escapeHtml(label)}: R</span></span>`
			)
			.replace(
				/<img[^>]*src="([^"]*mini-interaction[^"]*\.(svg|png|webp))"[^>]*alt="([^"]*)"[^>]*>/g,
				(_, src, _ext, label) => `<span class="member-inline-highlight"><img class="member-inline-mark" src="${escapeHtml(normalizeAssetPath(src))}" alt=""><span class="member-inline-label">${escapeHtml(label)}</span></span>`
			);
	}

	function splitWords(element, text) {
		element.textContent = "";
		const words = text.trim().split(/\s+/);
		words.forEach((word, index) => {
			const span = document.createElement("span");
			span.className = "member-word";
			span.textContent = word;
			element.appendChild(span);
			if (index < words.length - 1) {
				element.appendChild(document.createTextNode(" "));
			}
		});
	}

	function animateWords(element, baseDelay = 0) {
		const words = Array.from(element.querySelectorAll(".member-word"));
		words.forEach((word, index) => {
			window.setTimeout(() => {
				word.classList.add("is-visible");
			}, baseDelay + index * 34);
		});
		return baseDelay + words.length * 34;
	}

	function animateReveals() {
		splitWords(refs.nameLabel, refs.nameLabel.dataset.text || "");
		splitWords(refs.quote, refs.quote.dataset.text || "");
		let delayCursor = 60;
		delayCursor = animateWords(refs.nameLabel, delayCursor);
		delayCursor = animateWords(refs.quote, delayCursor + 100);

		const revealItems = [
			refs.signatureWrap,
			refs.bio,
			refs.socials,
			refs.galleryStage,
		];

		revealItems.forEach((item, index) => {
			item.classList.remove("is-visible");
			window.setTimeout(() => {
				item.classList.add("is-visible");
			}, delayCursor + 120 + index * 90);
		});
	}

	function buildRouter(members = state.members) {
		if (!refs.router) return;
		if (!members) return;
		refs.router.innerHTML = MEMBER_ORDER
			.filter(key => members[key])
			.map(key => {
				const member = members[key];
				const nickname = getMemberNickname(key);
				return `
					<a class="member-route-link" data-member-route="${key}" href="member.html?user=${key}">
						<img class="member-route-avatar" src="${escapeHtml(normalizeAssetPath(member.avatar))}" alt="${escapeHtml(member.name)} avatar" />
						<span class="member-route-name">${escapeHtml(nickname)}</span>
					</a>
				`;
			})
			.join("");
	}

	function updateRouterActive(memberKey) {
		if (!refs.router) return;
		refs.router.querySelectorAll("[data-member-route]").forEach(link => {
			link.classList.toggle("is-active", link.getAttribute("data-member-route") === memberKey);
		});
	}

	function clearRenderedContent() {
		refs.signatureWrap.innerHTML = "";
		refs.bio.innerHTML = "";
		refs.socials.innerHTML = "";
		refs.gallery.innerHTML = "";
		refs.stickersLayer.innerHTML = "";
		refs.quote.textContent = "";
		refs.nameLabel.textContent = "";
		[refs.signatureWrap, refs.bio, refs.socials, refs.galleryStage].forEach(item => {
			item.classList.remove("is-visible");
		});
	}

	function applyTheme(member, memberKey) {
		document.documentElement.style.setProperty("--theme-bg", member.theme_color);
		const themeText = memberKey === "mica" ? "#ffffff" : (member.is_dark_mode ? "#ffffff" : "#1b1b1b");
		document.documentElement.style.setProperty("--theme-text", themeText);
		document.documentElement.style.setProperty("--theme-muted", member.muted_text_color || `color-mix(in srgb, ${themeText} 34%, transparent)`);
		document.documentElement.style.setProperty("--gallery-border", member.gallery_border_color || (memberKey === "mica" ? "#ffffff" : "#000000"));
		refs.body.dataset.member = memberKey;
		refs.body.classList.toggle("dark-mode-manual", !!member.is_dark_mode);
	}

	function renderSocials(member) {
		const socialEntries = Object.entries(member.socials || {});
		refs.socials.innerHTML = '<span class="social-links-label">Connect</span><div class="social-links-items"></div>';
		const items = refs.socials.querySelector(".social-links-items");
		socialEntries.forEach(([name, url], index) => {
			const anchor = document.createElement("a");
			anchor.href = url;
			if (name.toLowerCase() === "x") {
				anchor.setAttribute("aria-label", "X");
				anchor.innerHTML = `
					<svg class="social-x-icon" viewBox="0 0 24 24" aria-hidden="true">
						<path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.847h-7.406l-5.8-7.584-6.639 7.584H.474l8.6-9.83L0 1.153h7.594l5.243 6.932 6.064-6.932Zm-1.291 19.492h2.039L6.486 3.24H4.298L17.61 20.645Z"/>
					</svg>
				`;
			} else {
				anchor.textContent = name;
			}
			items.appendChild(anchor);

			if (index < socialEntries.length - 1) {
				const separator = document.createElement("span");
				separator.className = "social-links-separator";
				separator.setAttribute("aria-hidden", "true");
				items.appendChild(separator);
			}
		});
	}

	function renderSignature(memberKey, member) {
		const signatureAsset = signatureAssets[memberKey];
		if (!signatureAsset) return;
		const signatureClass = member.is_dark_mode ? "signature-light" : "signature-dark";
		refs.signatureWrap.innerHTML = `<img class="signature-asset ${signatureClass}" src="${signatureAsset}" alt="${escapeHtml(member.name)} signature" />`;
	}

	function renderGallery(member) {
		member.gallery.forEach(src => {
			const item = document.createElement("div");
			item.className = "gallery-item";
			item.innerHTML = `<img src="${normalizeAssetPath(src)}" alt="Gallery Item">`;
			refs.gallery.appendChild(item);
		});
	}

	function renderStickers(memberKey, member) {
		member.stickers.forEach(sticker => {
			const img = document.createElement("img");
			img.src = normalizeAssetPath(sticker.src);
			img.className = "sticker";
			if (memberKey === "mica" && sticker.src.includes("sticker_mica_ita")) {
				img.dataset.noParallax = "true";
			}
			if (sticker.top) img.style.top = sticker.top;
			if (sticker.bottom) img.style.bottom = sticker.bottom;
			if (sticker.left) img.style.left = sticker.left;
			if (sticker.right) img.style.right = sticker.right;
			img.style.width = sticker.width;
			const rotateNumber = Number.parseFloat(sticker.rotate);
			img.style.rotate = Number.isFinite(rotateNumber) ? `${rotateNumber}deg` : "0deg";
			img.style.setProperty("--sticker-float-duration", `${4.3 + Math.random() * 2.1}s`);
			img.style.setProperty("--sticker-float-delay", `${Math.random() * -3.2}s`);
			refs.stickersLayer.appendChild(img);
		});
		state.stickers = Array.from(refs.stickersLayer.querySelectorAll(".sticker"));
		updateStickerParallax();
	}

	function updateStickerParallax() {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !state.stickers.length) return;
		const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
		const scrollProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
		const scrollWave = Math.sin(scrollProgress * Math.PI);

		state.stickers.forEach((sticker, index) => {
			if (sticker.dataset.noParallax === "true") {
				sticker.style.setProperty("--sticker-parallax-x", "0px");
				sticker.style.setProperty("--sticker-parallax-y", "0px");
				return;
			}
			const direction = index % 2 === 0 ? 1 : -1;
			const horizontal = (scrollProgress - 0.5) * 2 * (70 + index * 24) * direction;
			const vertical = -scrollWave * (130 + index * 42);
			sticker.style.setProperty("--sticker-parallax-x", `${horizontal.toFixed(2)}px`);
			sticker.style.setProperty("--sticker-parallax-y", `${vertical.toFixed(2)}px`);
		});
	}

	function requestStickerParallax() {
		if (state.stickerFrame) return;
		state.stickerFrame = window.requestAnimationFrame(() => {
			state.stickerFrame = 0;
			updateStickerParallax();
		});
	}

	function resizeAmbientCanvas() {
		if (!refs.ambientCanvas || !state.ambientCtx) return;
		const dpr = Math.min(1.5, window.devicePixelRatio || 1);
		refs.ambientCanvas.width = Math.floor(window.innerWidth * dpr);
		refs.ambientCanvas.height = Math.floor(window.innerHeight * dpr);
		refs.ambientCanvas.style.width = `${window.innerWidth}px`;
		refs.ambientCanvas.style.height = `${window.innerHeight}px`;
		state.ambientCtx.setTransform(1, 0, 0, 1, 0, 0);
		state.ambientCtx.scale(dpr, dpr);
	}

	function createNeoSigil() {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const symbolSet = [
			"⛧",
			"𖤐",
			"⛥",
			"𓃶",
			"🜏",
			"☠︎︎",
			"´ཀ`",
			"☪︎",
			"𖤐",
			"𐦍",
			"☾",
			"𖤓",
			`⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢀⣴⣿⣿⣷⣮⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣻⣿⣿⣿⣿⣿⠂⠀⠀
⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⣿⣿⠋⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⢸⣧⠁⠀⠀⠀
⠀⡀⠀⠀⠀⠀⢸⣿⣿⣿⣸⣿⣷⣄⠀⠀
⠀⠈⠫⠂⠀⠀⠊⣿⢿⣿⡏⣿⠿⠟⠀⠀
⠀⠀⠀⠀⠱⡀⠈⠁⠀⢝⢷⡸⡇⠀⠀⠀
⠀⠀⠀⠀⢀⠇⠀⠀⢀⣾⣦⢳⡀⠀⠀⠀
⠀⠀⠀⢀⠎⠀⢀⣴⣿⣿⣿⡇⣧⠀⠀⠀
⠀⢀⡔⠁⠀⢠⡟⢻⡻⣿⣿⣿⣌⡀⠀⠀
⢀⡎⠀⠀⠀⣼⠁⣼⣿⣦⠻⣿⣿⣷⡀⠀
⢸⠀⠀⠀⠀⡟⢰⣿⣿⡟⠀⠘⢿⣿⣷⡀
⠈⠳⠦⠴⠞⠀⢸⣿⣿⠁⠀⠀⠀⠹⣿⡧
⠀⠀⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠀⢰⣿⡇
⠀⠀⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠀⢸⣿⡇
⠀⠀⠀⠀⠀⡀⢸⣿⠁⠀⠀⠀⠀⢸⣿⡇
⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⠀⠀⠀⠀⣿⡇
⠀⠀⠀⠀⠀⠀⠀⣿⣆⠀⠀⠀⠀⠀⣿⣧
⠀⠀⠀⠀⠀⠀⠀⠏⢿⠄⠀⠀⠀⠐⢸⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉`,
		];
		const symbol = symbolSet[Math.floor(Math.random() * symbolSet.length)];
		const isTotem = symbol.includes("\n");
		const size = isTotem ? 5.6 + Math.random() * 2.4 : 22 + Math.random() * 54;
		return {
			kind: isTotem ? "totem" : "glyph",
			symbol,
			x: width * (0.12 + Math.random() * 0.76),
			y: Math.random() * height,
			size,
			rotation: Math.random() * Math.PI * 2,
			rotationSpeed: (Math.random() - 0.5) * 0.0024,
			driftX: (Math.random() - 0.5) * 0.12,
			driftY: -0.04 - Math.random() * 0.14,
			life: 0.72 + Math.random() * 0.52,
			decay: 0.00035 + Math.random() * 0.0008,
			pulse: Math.random() * Math.PI * 2,
		};
	}

	function createSnowParticle() {
		return {
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
			radius: 1.4 + Math.random() * 3.6,
			speedY: 0.35 + Math.random() * 1.15,
			driftX: (Math.random() - 0.5) * 0.55,
			swing: Math.random() * Math.PI * 2,
			alpha: 0.22 + Math.random() * 0.42,
		};
	}

	function createFlowerParticle() {
		return {
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
			size: 10 + Math.random() * 12,
			speedY: 0.26 + Math.random() * 0.88,
			driftX: (Math.random() - 0.5) * 0.85,
			rotate: Math.random() * Math.PI * 2,
			rotateSpeed: (Math.random() - 0.5) * 0.016,
			swing: Math.random() * Math.PI * 2,
			alpha: 0.24 + Math.random() * 0.24,
			hue: 252 + Math.random() * 26,
		};
	}

	function populateAmbientParticles() {
		state.ambientParticles = [];
		state.ambientSigils = [];

		const count = state.ambientMode === "mica"
			? Math.max(28, Math.floor(window.innerWidth / 30))
			: state.ambientMode === "saku"
				? Math.max(16, Math.floor(window.innerWidth / 48))
				: 0;

		for (let index = 0; index < count; index += 1) {
			if (state.ambientMode === "mica") state.ambientParticles.push(createSnowParticle());
			if (state.ambientMode === "saku") state.ambientParticles.push(createFlowerParticle());
		}

		if (state.ambientMode === "neo") {
			const sigilCount = Math.max(4, Math.floor(window.innerWidth / 280));
			for (let index = 0; index < sigilCount; index += 1) {
				state.ambientSigils.push(createNeoSigil());
			}
		}
	}

	function drawFlower(ctx, particle) {
		ctx.save();
		ctx.translate(particle.x, particle.y);
		ctx.rotate(particle.rotate);
		ctx.fillStyle = `hsla(${particle.hue}, 74%, 78%, ${particle.alpha})`;
		for (let index = 0; index < 5; index += 1) {
			ctx.rotate((Math.PI * 2) / 5);
			ctx.beginPath();
			ctx.ellipse(0, particle.size * 0.34, particle.size * 0.28, particle.size * 0.52, 0, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.fillStyle = `hsla(${particle.hue - 18}, 92%, 92%, ${particle.alpha})`;
		ctx.beginPath();
		ctx.arc(0, 0, particle.size * 0.18, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	function drawNeoTotem(ctx, sigil, alpha) {
		const lines = sigil.symbol.split("\n");
		const lineHeight = sigil.size * 0.92;
		ctx.font = `${sigil.size}px monospace`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = `rgba(255, 196, 166, ${alpha})`;
		lines.forEach((line, index) => {
			const y = (index - (lines.length - 1) / 2) * lineHeight;
			ctx.fillText(line, 0, y);
		});
	}

	function drawNeoSigil(ctx, sigil, now) {
		sigil.life -= sigil.decay;
		sigil.rotation += sigil.rotationSpeed;
		sigil.x += sigil.driftX + Math.sin((now * 0.0007) + sigil.pulse) * 0.06;
		sigil.y += sigil.driftY;

		if (sigil.life <= 0 || sigil.y < -sigil.size * 2) {
			return false;
		}

		const alpha = Math.max(0, sigil.life) * 0.28;
		ctx.save();
		ctx.translate(sigil.x, sigil.y);
		ctx.rotate(sigil.rotation);
		if (sigil.kind === "totem") {
			drawNeoTotem(ctx, sigil, alpha * 0.9);
		} else {
			ctx.font = `${sigil.size}px serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = `rgba(255, 196, 166, ${alpha})`;
			ctx.fillText(sigil.symbol, 0, 0);
		}
		ctx.restore();
		return true;
	}

	function renderAmbient(now = performance.now()) {
		if (!state.ambientCtx || !refs.ambientCanvas || !state.ambientRunning) return;
		if (now - state.ambientLastRender < 33) {
			state.ambientFrame = window.requestAnimationFrame(renderAmbient);
			return;
		}
		state.ambientLastRender = now;

		const ctx = state.ambientCtx;
		const width = window.innerWidth;
		const height = window.innerHeight;
		ctx.clearRect(0, 0, width, height);

		if (state.ambientMode === "neo") {
			const shadowBlend = ctx.createLinearGradient(0, 0, 0, height);
			shadowBlend.addColorStop(0, "#1b1b1b");
			shadowBlend.addColorStop(0.34, "rgba(27, 27, 27, 0.96)");
			shadowBlend.addColorStop(0.62, "rgba(22, 14, 12, 0.62)");
			shadowBlend.addColorStop(1, "rgba(8, 3, 2, 0.5)");
			ctx.fillStyle = shadowBlend;
			ctx.fillRect(0, 0, width, height);

			const baseGlow = ctx.createLinearGradient(0, height, 0, height * 0.42);
			baseGlow.addColorStop(0, "rgba(255, 64, 0, 0.34)");
			baseGlow.addColorStop(0.34, "rgba(255, 104, 28, 0.2)");
			baseGlow.addColorStop(0.72, "rgba(255, 96, 40, 0.07)");
			baseGlow.addColorStop(1, "rgba(255, 140, 60, 0)");
			ctx.fillStyle = baseGlow;
			ctx.fillRect(0, 0, width, height);

			const emberBloom = ctx.createRadialGradient(width * 0.5, height * 0.94, 0, width * 0.5, height * 0.94, Math.max(width, height) * 0.38);
			emberBloom.addColorStop(0, "rgba(255, 128, 54, 0.18)");
			emberBloom.addColorStop(0.4, "rgba(255, 86, 24, 0.11)");
			emberBloom.addColorStop(1, "rgba(255, 86, 24, 0)");
			ctx.fillStyle = emberBloom;
			ctx.fillRect(0, 0, width, height);

			state.ambientSigils = state.ambientSigils.filter(sigil => drawNeoSigil(ctx, sigil, now));
			while (state.ambientSigils.length < Math.max(4, Math.floor(window.innerWidth / 280))) {
				state.ambientSigils.push(createNeoSigil());
			}
		} else if (state.ambientMode === "mica") {
			ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
			ctx.fillRect(0, 0, width, height);
			state.ambientParticles.forEach((particle, index) => {
				particle.y += particle.speedY;
				particle.x += particle.driftX + Math.sin((now * 0.0012) + particle.swing) * 0.28;
				if (particle.y > height + particle.radius * 2) {
					state.ambientParticles[index] = { ...createSnowParticle(), y: -particle.radius * 3 };
					return;
				}
				ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
				ctx.beginPath();
				ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
				ctx.fill();
			});
		} else if (state.ambientMode === "saku") {
			const floralGlow = ctx.createLinearGradient(0, 0, 0, height);
			floralGlow.addColorStop(0, "rgba(255, 221, 109, 0.06)");
			floralGlow.addColorStop(1, "rgba(255, 168, 66, 0.02)");
			ctx.fillStyle = floralGlow;
			ctx.fillRect(0, 0, width, height);
			state.ambientParticles.forEach((particle, index) => {
				particle.y += particle.speedY;
				particle.x += particle.driftX + Math.sin((now * 0.0013) + particle.swing) * 0.46;
				particle.rotate += particle.rotateSpeed;
				if (particle.y > height + particle.size * 2) {
					state.ambientParticles[index] = { ...createFlowerParticle(), y: -particle.size * 2 };
					return;
				}
				drawFlower(ctx, particle);
			});
		}

		state.ambientFrame = window.requestAnimationFrame(renderAmbient);
	}

	function stopAmbient() {
		state.ambientRunning = false;
		state.ambientMode = "";
		state.ambientLastRender = 0;
		if (state.ambientFrame) {
			window.cancelAnimationFrame(state.ambientFrame);
			state.ambientFrame = 0;
		}
		if (state.ambientCtx) {
			state.ambientCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
		}
	}

	function startAmbient(mode) {
		if (!refs.ambientCanvas || !state.ambientCtx) return;
		state.ambientMode = mode;
		resizeAmbientCanvas();
		populateAmbientParticles();
		state.ambientRunning = true;
		state.ambientLastRender = 0;
		if (state.ambientFrame) {
			window.cancelAnimationFrame(state.ambientFrame);
		}
		state.ambientFrame = window.requestAnimationFrame(renderAmbient);
	}

	function renderMember(memberKey, member) {
		clearRenderedContent();
		applyTheme(member, memberKey);
		updateRouterActive(memberKey);

		if (MEMBER_ORDER.includes(memberKey)) startAmbient(memberKey);
		else stopAmbient();

		refs.avatar.src = normalizeAssetPath(member.avatar);
		refs.avatar.alt = member.name;
		refs.nameLabel.dataset.text = getMemberNickname(memberKey);
		refs.quote.dataset.text = member.quote;
		renderSignature(memberKey, member);
		refs.bio.innerHTML = member.bio.map(paragraph => `<p>${renderInlineHighlights(paragraph)}</p>`).join("");
		renderSocials(member);
		renderGallery(member);
		renderStickers(memberKey, member);
	}

	async function transitionOut(nextKey) {
		if (!state.currentKey) return;
		refs.body.classList.add("route-leaving");
		await delay(280);
	}

	async function navigateToMember(memberKey, { push = false, replace = false, force = false } = {}) {
		if (state.isTransitioning) return;
		if (!force && state.currentKey === memberKey) return;

		state.isTransitioning = true;
		try {
			const isInitialLoad = !state.currentKey;
			if (isInitialLoad) {
				showLoading(`Loading ${memberKey.toUpperCase()}`);
			}
			await transitionOut(memberKey);
			const members = await loadMembersData();
			const member = members[memberKey];

			if (!member) {
				if (isInitialLoad) {
					showLoading("Member not found");
				}
				state.isTransitioning = false;
				return;
			}

			renderMember(memberKey, member);
			const nextUrl = `member.html?user=${memberKey}`;
			if (push) {
				window.history.pushState({ member: memberKey }, "", nextUrl);
			} else if (replace || !window.history.state) {
				window.history.replaceState({ member: memberKey }, "", nextUrl);
			}

			state.currentKey = memberKey;
			refs.body.classList.remove("route-leaving");
			if (isInitialLoad) {
				hideLoading();
			}
			animateReveals();
		} catch (error) {
			console.error(error);
			if (!state.currentKey) {
				showLoading("Error loading profile");
			}
		} finally {
			state.isTransitioning = false;
		}
	}

	function bindRouter() {
		if (!refs.router) return;
		refs.router.addEventListener("click", event => {
			const link = event.target.closest("[data-member-route]");
			if (!link) return;
			event.preventDefault();
			const memberKey = link.getAttribute("data-member-route");
			navigateToMember(memberKey, { push: true });
		});

		window.addEventListener("popstate", () => {
			navigateToMember(getMemberKeyFromLocation(), { replace: true, force: true });
		});
	}

	window.addEventListener("scroll", requestStickerParallax, { passive: true });
	window.addEventListener("resize", () => {
		requestStickerParallax();
		if (!state.ambientRunning) return;
		resizeAmbientCanvas();
		populateAmbientParticles();
	});

	bindRouter();
	showLoading("Loading profile");
	loadMembersData()
		.then(members => {
			buildRouter(members);
			return navigateToMember(getMemberKeyFromLocation(), { replace: true, force: true });
		})
		.catch(error => {
			console.error(error);
			showLoading("Error loading profile");
		});
})();
