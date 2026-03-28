(function () {
	const overlay = document.getElementById("grid-overlay");
	if (!overlay) return;

	const scoreEl = document.getElementById("game-score");
	const statusEl = document.getElementById("game-status");
	const timerEl = document.getElementById("game-timer");
	const hudEl = document.getElementById("game-hud");
	const closeButtonEl = document.getElementById("game-close");
	const restartButtonEl = document.getElementById("game-restart");

	const CELL_SIZE = 10;
	const CHARGE_MS = 3000;
	const INTRO_MS = 1800;
	const PLAYER_COLOR = "#ffffff";
	const RIVAL_COLOR = "var(--link)";
	const FOOD_COLOR = "var(--minesa-brown)";

	overlay.style.setProperty("--cell-size", CELL_SIZE + "px");

	const active = new Map();
	const audio = {
		ctx: null,
		master: null,
		musicTimer: 0,
		musicStep: 0,
		eatVariant: 0,
		active: false,
		unlocked: false,
	};

	function ensureAudio() {
		if (audio.ctx) return audio.ctx;
		const AudioContextClass = window.AudioContext || window.webkitAudioContext;
		if (!AudioContextClass) return null;
		audio.ctx = new AudioContextClass();
		audio.master = audio.ctx.createGain();
		audio.master.gain.value = 0.4;
		audio.master.connect(audio.ctx.destination);
		return audio.ctx;
	}

	function tone({
		frequency = 440,
		type = "sine",
		start = 0,
		duration = 0.14,
		volume = 0.1,
		slideTo = null,
	}) {
		const ctx = ensureAudio();
		if (!ctx || !audio.master) return;
		const when = ctx.currentTime + start;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(frequency, when);
		if (slideTo) {
			osc.frequency.exponentialRampToValueAtTime(slideTo, when + duration);
		}
		gain.gain.setValueAtTime(0.0001, when);
		gain.gain.exponentialRampToValueAtTime(volume, when + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
		osc.connect(gain);
		gain.connect(audio.master);
		osc.start(when);
		osc.stop(when + duration + 0.03);
	}

	function filteredNoise({
		start = 0,
		duration = 0.12,
		volume = 0.05,
		type = "bandpass",
		frequency = 900,
		q = 0.8,
	}) {
		const ctx = ensureAudio();
		if (!ctx || !audio.master) return;
		const frameCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
		const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let index = 0; index < frameCount; index += 1) {
			data[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
		}
		const source = ctx.createBufferSource();
		const filter = ctx.createBiquadFilter();
		const gain = ctx.createGain();
		const when = ctx.currentTime + start;
		filter.type = type;
		filter.frequency.setValueAtTime(frequency, when);
		filter.Q.value = q;
		gain.gain.setValueAtTime(volume, when);
		gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
		source.buffer = buffer;
		source.connect(filter);
		filter.connect(gain);
		gain.connect(audio.master);
		source.start(when);
		source.stop(when + duration);
	}

	function noiseBurst({ start = 0, duration = 0.08, volume = 0.05 } = {}) {
		filteredNoise({ start, duration, volume, type: "bandpass", frequency: 900, q: 0.7 });
	}

	function playStartSound() {
		tone({ frequency: 122, type: "sawtooth", duration: 0.42, volume: 0.11, slideTo: 184 });
		tone({ frequency: 184, type: "triangle", start: 0.14, duration: 0.56, volume: 0.08, slideTo: 138 });
		filteredNoise({ start: 0.03, duration: 0.24, volume: 0.04, type: "highpass", frequency: 1800, q: 0.9 });
	}

	function playFoodSound() {
		audio.eatVariant = (audio.eatVariant + 1) % 2;
		if (audio.eatVariant === 0) {
			tone({ frequency: 410, type: "triangle", duration: 0.05, volume: 0.065, slideTo: 470 });
			tone({ frequency: 560, type: "sine", start: 0.024, duration: 0.07, volume: 0.04, slideTo: 620 });
			return;
		}
		tone({ frequency: 350, type: "triangle", duration: 0.06, volume: 0.062, slideTo: 430 });
		tone({ frequency: 520, type: "sine", start: 0.018, duration: 0.08, volume: 0.038, slideTo: 575 });
	}

	function playAgentDeathSound() {
		tone({ frequency: 132, type: "square", duration: 0.08, volume: 0.06, slideTo: 108 });
		tone({ frequency: 218, type: "sawtooth", start: 0.012, duration: 0.11, volume: 0.05, slideTo: 164 });
		filteredNoise({ start: 0.01, duration: 0.1, volume: 0.03, type: "highpass", frequency: 2600, q: 1.2 });
		filteredNoise({ start: 0.045, duration: 0.08, volume: 0.022, type: "bandpass", frequency: 1400, q: 3.2 });
	}

	function playLoseSound() {
		tone({ frequency: 164, type: "sawtooth", duration: 0.38, volume: 0.11, slideTo: 82 });
		tone({ frequency: 98, type: "triangle", start: 0.04, duration: 0.46, volume: 0.07, slideTo: 54 });
		filteredNoise({ start: 0.015, duration: 0.22, volume: 0.05, type: "bandpass", frequency: 880, q: 1.1 });
	}

	function playLevelSound(level) {
		const base = 280 + Math.min(level, 12) * 18;
		tone({ frequency: base, type: "triangle", duration: 0.12, volume: 0.09, slideTo: base * 1.18 });
		tone({ frequency: base * 1.25, type: "sine", start: 0.08, duration: 0.16, volume: 0.06, slideTo: base * 1.5 });
	}

	function stopMusic() {
		audio.active = false;
		if (audio.musicTimer) {
			clearTimeout(audio.musicTimer);
			audio.musicTimer = 0;
		}
	}

	function queueMusic() {
		if (!audio.active) return;
		const loop = [
			{ notes: [98, 146.83, 185], drone: 49, duration: 0.96 },
			{ notes: [92.5, 138.59, 174.61], drone: 46.25, duration: 0.92 },
			{ notes: [82.41, 123.47, 164.81], drone: 41.2, duration: 1.08 },
			{ notes: [87.31, 130.81, 164.81], drone: 43.65, duration: 0.88 },
			{ notes: [73.42, 110, 146.83], drone: 36.71, duration: 1.16 },
			{ notes: [77.78, 116.54, 155.56], drone: 38.89, duration: 0.98 },
		];
		const chord = loop[audio.musicStep % loop.length];
		tone({
			frequency: chord.drone,
			type: "sawtooth",
			duration: chord.duration + 0.18,
			volume: 0.038,
			slideTo: chord.drone * 0.992,
		});
		chord.notes.forEach((note, index) => {
			tone({
				frequency: note,
				type: index === 0 ? "triangle" : "sine",
				start: index * 0.07,
				duration: chord.duration,
				volume: index === 0 ? 0.052 : 0.028,
				slideTo: note * (index === 2 ? 0.996 : 1.004),
			});
		});
		filteredNoise({
			start: 0.08,
			duration: chord.duration * 0.7,
			volume: 0.008,
			type: "bandpass",
			frequency: 1600 + (audio.musicStep % 3) * 220,
			q: 1.3,
		});
		audio.musicStep += 1;
		audio.musicTimer = window.setTimeout(queueMusic, chord.duration * 1000);
	}

	function startMusic() {
		const ctx = ensureAudio();
		if (!ctx) return;
		stopMusic();
		audio.active = true;
		audio.musicStep = 0;
		queueMusic();
	}

	function unlockAudio() {
		const ctx = ensureAudio();
		if (!ctx) return;
		if (ctx.state === "suspended") {
			ctx.resume().catch(() => {});
		}
		audio.unlocked = true;
	}

	function makeCell(x, y, className) {
		const el = document.createElement("div");
		el.className = `cell-instance ${className}`;
		el.style.left = `${x}px`;
		el.style.top = `${y}px`;
		el.style.width = `${CELL_SIZE}px`;
		el.style.height = `${CELL_SIZE}px`;
		return el;
	}

	function showAt(col, row, className) {
		const key = `${row}:${col}`;
		const now = Date.now();
		if (active.has(key)) {
			const entry = active.get(key);
			entry.lastSeen = now;
			entry.className = className;
			entry.el.className = `cell-instance ${className} show`;
			if (entry._removal) {
				clearTimeout(entry._removal);
				entry._removal = null;
			}
			entry.el.classList.remove("fade");
			return;
		}

		const x = col * CELL_SIZE;
		const y = row * CELL_SIZE;
		const el = makeCell(x, y, className);
		overlay.appendChild(el);

		const entry = { el, lastSeen: now, _removal: null, className };
		active.set(key, entry);

		requestAnimationFrame(() => {
			el.classList.add("show");
		});
	}

	function hideKey(key) {
		const entry = active.get(key);
		if (!entry) return;
		entry.el.classList.remove("show");
		entry.el.classList.add("fade");

		entry._removal = setTimeout(() => {
			if (entry.el.parentNode) {
				entry.el.parentNode.removeChild(entry.el);
			}
			active.delete(key);
		}, 1100);
	}

	function clearOverlay() {
		active.forEach((entry, key) => {
			if (entry._removal) clearTimeout(entry._removal);
			if (entry.el.parentNode) {
				entry.el.parentNode.removeChild(entry.el);
			}
			active.delete(key);
		});
	}

	function rand(min, max) {
		return Math.random() * (max - min) + min;
	}

	function randInt(min, max) {
		return Math.floor(rand(min, max + 1));
	}

	const state = {
		phase: "idle",
		chargeAt: 0,
		introAt: 0,
		lastTick: performance.now(),
		lastPointerCell: null,
		pointerCell: null,
		gridCols: Math.max(1, Math.floor(window.innerWidth / CELL_SIZE)),
		gridRows: Math.max(1, Math.floor(window.innerHeight / CELL_SIZE)),
		player: null,
		rivals: [],
		food: [],
		level: 1,
		foodSpawnCooldown: 0,
		smashTimer: 0,
	};

	function updateGridSize() {
		state.gridCols = Math.max(1, Math.floor(window.innerWidth / CELL_SIZE));
		state.gridRows = Math.max(1, Math.floor(window.innerHeight / CELL_SIZE));
		overlay.style.backgroundSize = `${CELL_SIZE}px ${CELL_SIZE}px`;
	}

	function setScore(length) {
		if (!scoreEl) return;
		scoreEl.textContent = `Level ${String(state.level).padStart(2, "0")} / Length ${String(length).padStart(3, "0")}`;
	}

	function setStatus(message) {
		if (!statusEl) return;
		statusEl.textContent = message;
	}

	function setChargeTimer(msRemaining = CHARGE_MS) {
		if (!timerEl) return;
		const seconds = Math.max(0, msRemaining) / 1000;
		timerEl.textContent = `Launch in ${seconds.toFixed(1)}s`;
	}

	function setPhase(phase) {
		state.phase = phase;
		document.body.classList.toggle("logo-charge", phase === "charging");
		document.body.classList.toggle("game-on", phase !== "idle" && phase !== "charging");
		if (hudEl) hudEl.classList.toggle("visible", phase !== "idle");
		if (closeButtonEl) closeButtonEl.classList.toggle("visible", phase !== "idle");
		if (restartButtonEl) restartButtonEl.classList.toggle("visible", phase === "lost");
		if (timerEl) timerEl.classList.toggle("visible", phase === "charging");

		if (phase === "idle") {
			setChargeTimer(CHARGE_MS);
			setStatus("Hover the Minesa logo to launch Ghost Grid.");
		} else if (phase === "charging") {
			setChargeTimer(CHARGE_MS);
			setStatus("Ghost Grid is charging. Hold the logo.");
		} else if (phase === "intro") {
			setStatus("Ghost Grid is smashing open. Survive the opening wave.");
		} else if (phase === "active") {
			setStatus("Eat smaller agents to grow. If a bigger one eats you, you lose.");
		} else if (phase === "lost") {
			setStatus("You got eaten. Restart Ghost Grid or hover the logo to try again.");
		}
	}

	function triggerSmash() {
		document.body.classList.add("game-smash");
		if (state.smashTimer) {
			clearTimeout(state.smashTimer);
		}
		state.smashTimer = window.setTimeout(() => {
			document.body.classList.remove("game-smash");
			state.smashTimer = 0;
		}, 420);
	}

	function createSnake({ startCol, startRow, length, direction, speed }) {
		const segments = [];
		for (let index = 0; index < length; index += 1) {
			segments.push({
				col: startCol - direction.col * index,
				row: startRow - direction.row * index,
			});
		}

		return {
			segments,
			direction: { ...direction },
			pendingGrowth: 0,
			speed,
			moveBuffer: 0,
		};
	}

	function randomCell() {
		return {
			col: randInt(0, Math.max(0, state.gridCols - 1)),
			row: randInt(0, Math.max(0, state.gridRows - 1)),
		};
	}

	function normalizeDirection(colDelta, rowDelta) {
		const col = colDelta === 0 ? 0 : colDelta > 0 ? 1 : -1;
		const row = rowDelta === 0 ? 0 : rowDelta > 0 ? 1 : -1;

		if (col !== 0 && row !== 0) {
			return Math.abs(colDelta) > Math.abs(rowDelta)
				? { col, row: 0 }
				: { col: 0, row };
		}

		return { col, row };
	}

	function wrapCell(cell) {
		if (cell.col < 0) cell.col = state.gridCols - 1;
		if (cell.col >= state.gridCols) cell.col = 0;
		if (cell.row < 0) cell.row = state.gridRows - 1;
		if (cell.row >= state.gridRows) cell.row = 0;
		return cell;
	}

	function cellKey(cell) {
		return `${cell.col}:${cell.row}`;
	}

	function snakeLength(snake) {
		return snake.segments.length;
	}

	function placeFood(count) {
		const occupied = new Set();
		if (state.player) {
			state.player.segments.forEach(segment => occupied.add(cellKey(segment)));
		}
		state.rivals.forEach(rival => {
			rival.snake.segments.forEach(segment => occupied.add(cellKey(segment)));
		});

		while (state.food.length < count) {
			const cell = randomCell();
			const key = cellKey(cell);
			if (occupied.has(key)) continue;
			if (state.food.some(item => item.col === cell.col && item.row === cell.row)) continue;
			state.food.push({
				...cell,
				life: rand(2.8, 6.5),
			});
		}
	}

	function updateLevel() {
		const previousLevel = state.level;
		const playerLength = snakeLength(state.player);
		state.level = 1 + Math.floor(Math.max(0, playerLength - 1) / 4);
		if (state.level > previousLevel) {
			playLevelSound(state.level);
		}
	}

	function resetGame() {
		updateGridSize();
		clearOverlay();
		state.player = createSnake({
			startCol: Math.floor(state.gridCols * 0.5),
			startRow: Math.floor(state.gridRows * 0.58),
			length: 1,
			direction: { col: 1, row: 0 },
			speed: 18,
		});
		state.rivals = [];
		state.food = [];
		state.level = 1;
		state.foodSpawnCooldown = 0;
		state.lastPointerCell = null;
		placeFood(18);
		setScore(1);
	}

	function createRival(length, sideIndex) {
		const side = sideIndex % 4;
		let startCol = randInt(0, Math.max(0, state.gridCols - 1));
		let startRow = randInt(0, Math.max(0, state.gridRows - 1));
		let direction = { col: 0, row: -1 };

		if (side === 0) {
			startRow = state.gridRows + length + randInt(2, 16);
			direction = { col: 0, row: -1 };
		} else if (side === 1) {
			startCol = -length - randInt(2, 16);
			direction = { col: 1, row: 0 };
		} else if (side === 2) {
			startRow = -length - randInt(2, 16);
			direction = { col: 0, row: 1 };
		} else {
			startCol = state.gridCols + length + randInt(2, 16);
			direction = { col: -1, row: 0 };
		}

		const roleRoll = Math.random();
		let role = "forager";
		if (roleRoll < 0.34) {
			role = "hunter";
		} else if (roleRoll < 0.67) {
			role = "wanderer";
		} else {
			role = "spinner";
		}

		const playerLength = state.player ? snakeLength(state.player) : 1;
		const actualLength = role === "hunter"
			? Math.max(length + randInt(2, 4), playerLength + 10)
			: length;
		const hunterLevelBoost = Math.pow(1.1, Math.max(0, state.level - 1));
		const speedBoost = role === "hunter"
			? 1.4 * hunterLevelBoost
			: role === "spinner"
				? 0.95
				: 1.12;

		return {
			snake: createSnake({
				startCol,
				startRow,
				length: actualLength,
				direction,
				speed: (5 + Math.random() * 5) * speedBoost,
			}),
			role,
			turnBias: Math.random() < 0.5 ? -1 : 1,
			wanderCooldown: rand(0.2, 1.6),
		};
	}

	function startIntro() {
		ensureAudio();
		startMusic();
		playStartSound();
		triggerSmash();
		resetGame();
		for (let index = 0; index < 14; index += 1) {
			state.rivals.push(createRival(randInt(2, 8), index));
		}
		state.introAt = performance.now();
		setPhase("intro");
	}

	function startCharge() {
		if (state.phase === "intro" || state.phase === "active") return;
		unlockAudio();
		state.chargeAt = performance.now();
		setPhase("charging");
	}

	function cancelCharge() {
		if (state.phase !== "charging") return;
		setPhase("idle");
	}

	function closeGame() {
		stopMusic();
		clearOverlay();
		state.player = null;
		state.rivals = [];
		state.food = [];
		state.pointerCell = null;
		setPhase("idle");
	}

	function updatePointer(event) {
		const col = Math.max(0, Math.min(state.gridCols - 1, Math.floor(event.clientX / CELL_SIZE)));
		const row = Math.max(0, Math.min(state.gridRows - 1, Math.floor(event.clientY / CELL_SIZE)));
		state.pointerCell = { col, row };
	}

	function steerPlayer() {
		if (!state.player || !state.pointerCell) return;

		const head = state.player.segments[0];
		const distanceCol = state.pointerCell.col - head.col;
		const distanceRow = state.pointerCell.row - head.row;
		const direction = normalizeDirection(
			distanceCol,
			distanceRow
		);

		const distance = Math.abs(distanceCol) + Math.abs(distanceRow);
		state.player.speed = Math.min(80, 20 + distance * 4.6);
		if (direction.col === 0 && direction.row === 0) return;
		state.player.direction = direction;
	}

	function updateSnakeMovement(snake, dt) {
		snake.moveBuffer += (snake.speed * dt) / 1000;
		while (snake.moveBuffer >= 1) {
			snake.moveBuffer -= 1;
			const head = snake.segments[0];
			const next = wrapCell({
				col: head.col + snake.direction.col,
				row: head.row + snake.direction.row,
			});
			snake.segments.unshift(next);
			if (snake.pendingGrowth > 0) {
				snake.pendingGrowth -= 1;
			} else {
				snake.segments.pop();
			}
		}
	}

	function chooseRivalDirection(rival, dt) {
		const head = rival.snake.segments[0];
		const playerHead = state.player.segments[0];
		const wantsFood = state.food[0];

		let target = wantsFood || randomCell();
		if (rival.role === "hunter") {
			target = playerHead;
		} else if (rival.role === "spinner") {
			target = {
				col: head.col + rival.turnBias * randInt(2, 8),
				row: head.row + randInt(-6, 6),
			};
		} else if (rival.role === "wanderer") {
			rival.wanderCooldown -= dt / 1000;
			if (rival.wanderCooldown <= 0) {
				rival.wanderCooldown = rand(0.35, 1.5);
				target = randomCell();
			} else {
				target = {
					col: head.col + rival.snake.direction.col * 6,
					row: head.row + rival.snake.direction.row * 6,
				};
			}
		} else if (wantsFood) {
			target = wantsFood;
		}

		const direction = normalizeDirection(target.col - head.col, target.row - head.row);
		if (direction.col !== 0 || direction.row !== 0) {
			rival.snake.direction = direction;
		}
	}

	function consumeFood(snake) {
		const head = snake.segments[0];
		const foodIndex = state.food.findIndex(item => item.col === head.col && item.row === head.row);
		if (foodIndex === -1) return false;
		state.food.splice(foodIndex, 1);
		snake.pendingGrowth += 1;
		if (snake === state.player) {
			playFoodSound();
		}
		return true;
	}

	function decayFood(dt) {
		state.foodSpawnCooldown -= dt / 1000;
		state.food.forEach(item => {
			item.life -= dt / 1000;
		});
		state.food = state.food.filter(item => item.life > 0);

		const desiredFood = Math.max(8, 16 - Math.min(6, state.level));
		if (state.foodSpawnCooldown <= 0 && state.food.length < desiredFood) {
			placeFood(desiredFood);
			state.foodSpawnCooldown = rand(0.25, 0.9);
		}
	}

	function handleAgentEats() {
		const playerHead = state.player.segments[0];

		for (let index = state.rivals.length - 1; index >= 0; index -= 1) {
			const rival = state.rivals[index];
			const rivalHead = rival.snake.segments[0];
			const sameCell = rivalHead.col === playerHead.col && rivalHead.row === playerHead.row;
			if (!sameCell) continue;

			const rivalLength = snakeLength(rival.snake);
			const playerLength = snakeLength(state.player);
			if (playerLength > rivalLength) {
				state.player.pendingGrowth += 1;
				state.rivals.splice(index, 1);
				placeFood(18);
				playAgentDeathSound();
				setScore(snakeLength(state.player) + state.player.pendingGrowth);
			} else {
				stopMusic();
				playLoseSound();
				setPhase("lost");
				return;
			}
		}
	}

	function replenishRivals() {
		const targetRivals = Math.min(14, 7 + state.level);
		while (state.rivals.length < targetRivals) {
			state.rivals.push(createRival(randInt(2, 10 + state.level), randInt(0, 3)));
		}
	}

	function drawGame() {
		if (!state.player) return;
		if (state.pointerCell) {
			showAt(state.pointerCell.col, state.pointerCell.row, "player-ghost");
		}

		state.food.forEach(item => {
			showAt(item.col, item.row, "food");
		});

		state.player.segments.forEach((segment, index) => {
			showAt(segment.col, segment.row, index === 0 ? "player-head" : "player-body");
		});

		state.rivals.forEach(rival => {
			rival.snake.segments.forEach((segment, index) => {
				const className = rival.role === "hunter"
					? (index === 0 ? "agent-head-hunter" : "agent-hunter")
					: (index === 0 ? "agent-head" : "agent");
				showAt(segment.col, segment.row, className);
			});
		});
	}

	function tick(now) {
		const dt = Math.min(40, now - state.lastTick);
		state.lastTick = now;

		if (state.phase === "charging" && now - state.chargeAt >= CHARGE_MS) {
			startIntro();
		}

		if (state.phase === "charging") {
			setChargeTimer(CHARGE_MS - (now - state.chargeAt));
		}

		if (state.phase === "intro" || state.phase === "active") {
			if (state.phase === "intro" && now - state.introAt >= INTRO_MS) {
				setPhase("active");
			}

			steerPlayer();
			updateSnakeMovement(state.player, dt);
			consumeFood(state.player);

			state.rivals.forEach(rival => {
				chooseRivalDirection(rival, dt);
				updateSnakeMovement(rival.snake, dt);
				if (consumeFood(rival.snake)) {
					rival.snake.pendingGrowth += 1;
				}
			});

			handleAgentEats();
			if (state.phase === "intro" || state.phase === "active") {
				updateLevel();
				decayFood(dt);
				replenishRivals();
				setScore(snakeLength(state.player));
				drawGame();
			}
		}

		requestAnimationFrame(tick);
	}

	function hookLogoHover() {
		const logoLinks = document.querySelectorAll("header a, .if-logo-link");
		logoLinks.forEach(link => {
			link.addEventListener("mouseenter", startCharge);
			link.addEventListener("mouseleave", cancelCharge);
		});
	}

	window.addEventListener("mousemove", updatePointer, { passive: true });
	window.addEventListener("pointerdown", unlockAudio, { passive: true });
	window.addEventListener("mouseleave", () => {
		state.pointerCell = null;
	});

	const HIDE_THRESHOLD = 75;
	setInterval(() => {
		const now = Date.now();
		active.forEach((entry, key) => {
			if (entry._removal) return;
			if (now - entry.lastSeen > HIDE_THRESHOLD) {
				hideKey(key);
			}
		});
	}, 50);

	window.addEventListener("resize", () => {
		updateGridSize();
		if (state.phase === "intro" || state.phase === "active") {
			resetGame();
			setPhase("active");
		} else {
			clearOverlay();
		}
	});

	updateGridSize();
	setPhase("idle");
	hookLogoHover();
	if (closeButtonEl) {
		closeButtonEl.addEventListener("click", closeGame);
	}
	if (restartButtonEl) {
		restartButtonEl.addEventListener("click", startIntro);
	}
	requestAnimationFrame(tick);
})();
