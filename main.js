(function () {
	const overlay = document.getElementById("grid-overlay");
	if (!overlay) return;

	const CELL_SIZE = 10;
	overlay.style.setProperty("--cell-size", CELL_SIZE + "px");

	const active = new Map();

	let prevMouse = null;

	function makeCell(x, y, isAgent) {
		const el = document.createElement("div");
		el.className = "cell-instance" + (isAgent ? " agent" : "");

		el.style.left = x + "px";
		el.style.top = y + "px";
		el.style.width = CELL_SIZE + "px";
		el.style.height = CELL_SIZE + "px";
		return el;
	}

	function showAt(col, row, opts = {}) {
		const key = row + ":" + col;
		const now = Date.now();
		if (active.has(key)) {
			const entry = active.get(key);

			if (entry._removal) {
				clearTimeout(entry._removal);
				entry._removal = null;
				entry.el.classList.remove("fade");
				entry.el.classList.add("show");
			}
			entry.lastSeen = now;
			return key;
		}

		const x = col * CELL_SIZE;
		const y = row * CELL_SIZE;
		const el = makeCell(x, y, !!opts.agent);
		overlay.appendChild(el);

		const entry = { el, lastSeen: now, _removal: null };
		active.set(key, entry);

		requestAnimationFrame(() => {
			el.classList.add("show");
		});

		return key;
	}

	function hideKey(key) {
		const entry = active.get(key);
		if (!entry) return;
		const el = entry.el;
		el.classList.remove("show");
		el.classList.add("fade");

		const t = setTimeout(() => {
			if (el.parentNode) el.parentNode.removeChild(el);
			active.delete(key);
		}, 1100);
		entry._removal = t;
	}

	function drawLine(prevCol, prevRow, col, row, opts) {
		const dx = col - prevCol;
		const dy = row - prevRow;
		const steps = Math.max(Math.abs(dx), Math.abs(dy));
		if (steps === 0) {
			showAt(col, row, opts);
			return;
		}
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const cx = Math.round(prevCol + dx * t);
			const cy = Math.round(prevRow + dy * t);
			showAt(cx, cy, opts);
		}
	}

	function onMove(e) {
		const col = Math.floor(e.clientX / CELL_SIZE);
		const row = Math.floor(e.clientY / CELL_SIZE);

		if (prevMouse) {
			drawLine(prevMouse.col, prevMouse.row, col, row, { agent: false });
		} else {
			showAt(col, row, { agent: false });
		}
		prevMouse = { col, row };
	}

	function onLeave() {
		prevMouse = null;
	}

	window.addEventListener("mousemove", onMove, { passive: true });
	window.addEventListener("mouseout", (ev) => {
		if (!ev.relatedTarget) onLeave();
	});
	window.addEventListener("mouseleave", onLeave);

	const HIDE_THRESHOLD = 60;
	setInterval(() => {
		const now = Date.now();
		active.forEach((entry, key) => {
			if (entry._removal) return;
			if (now - entry.lastSeen > HIDE_THRESHOLD) {
				hideKey(key);
			}
		});
	}, 40);

	const AGENT_COUNT = 3;
	const agents = [];

	function rand(min, max) {
		return Math.random() * (max - min) + min;
	}

	function spawnAgent() {
		const w = window.innerWidth;
		const h = window.innerHeight;
		const agent = {
			x: rand(0, w),
			y: rand(0, h),
			tx: rand(0, w),
			ty: rand(0, h),
			speed: rand(40, 160),
			pause: 0,
		};
		agents.push(agent);
		return agent;
	}

	function stepAgents(dt) {
		const w = window.innerWidth;
		const h = window.innerHeight;
		for (let i = 0; i < agents.length; i++) {
			const a = agents[i];
			if (a.pause > 0) {
				a.pause -= dt;
				if (a.pause <= 0) {
					a.tx = rand(0, w);
					a.ty = rand(0, h);
				}
				continue;
			}
			const dx = a.tx - a.x;
			const dy = a.ty - a.y;
			const dist = Math.hypot(dx, dy) || 1;
			const travel = a.speed * (dt / 1000);
			if (travel >= dist) {
				a.x = a.tx;
				a.y = a.ty;
				a.pause = rand(300, 1200);
			} else {
				a.x += (dx / dist) * travel;
				a.y += (dy / dist) * travel;
			}

			const col = Math.floor(a.x / CELL_SIZE);
			const row = Math.floor(a.y / CELL_SIZE);
			showAt(col, row, { agent: true });
		}
	}

	for (let i = 0; i < AGENT_COUNT; i++) spawnAgent();

	let lastFrame = performance.now();
	function raf(now) {
		const dt = now - lastFrame;
		lastFrame = now;
		stepAgents(dt);
		requestAnimationFrame(raf);
	}
	requestAnimationFrame(raf);

	let resizeTimer = null;
	window.addEventListener("resize", () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			overlay.style.setProperty("--cell-size", CELL_SIZE + "px");

			overlay.style.backgroundSize = `${CELL_SIZE}px ${CELL_SIZE}px`;

			active.forEach((entry, k) => {
				if (entry._removal) clearTimeout(entry._removal);
				if (entry.el.parentNode)
					entry.el.parentNode.removeChild(entry.el);
			});
			active.clear();
			prevMouse = null;
			agents.length = 0;
			for (let i = 0; i < AGENT_COUNT; i++) spawnAgent();
		}, 120);
	});
})();
