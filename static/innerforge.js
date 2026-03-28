(function () {
	const list = document.getElementById("github-sponsors-list");
	const empty = document.getElementById("github-sponsors-empty");
	if (!list || !empty) return;

	function setEmptyState(message) {
		empty.textContent = message;
		empty.hidden = false;
		list.innerHTML = "";
	}

	async function fetchPayload(url) {
		const response = await fetch(url);
		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.error || `Failed to load ${url}`);
		}
		return payload;
	}

	function renderSponsors(items, publicCount, totalCount) {
		if (totalCount > publicCount) {
			empty.textContent = `Showing ${publicCount} public sponsors out of ${totalCount} total.`;
			empty.hidden = false;
		}

		if (!items.length) {
			setEmptyState("No public sponsors found.");
			return;
		}

		if (totalCount <= publicCount) {
			empty.hidden = true;
		}

		list.innerHTML = items.map(item => `
			<li>
				<a class="if-sponsor-link" href="${item.url}" target="_blank" rel="noreferrer">
					<span class="if-sponsor-name">${item.name}</span>
					<span class="if-sponsor-login">@${item.login}</span>
				</a>
			</li>
		`).join("");
	}

	async function loadSponsors() {
		try {
			let payload;
			try {
				payload = await fetchPayload("../api/github-sponsors");
			} catch (_apiError) {
				payload = await fetchPayload("../data/github-sponsors.json");
			}
			renderSponsors(
				Array.isArray(payload.items) ? payload.items : [],
				Number(payload.publicCount || 0),
				Number(payload.totalCount || 0),
			);
		} catch (_error) {
			setEmptyState("GitHub sponsors are unavailable right now.");
		}
	}

	loadSponsors();
})();
