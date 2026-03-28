const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

const SPONSORS_QUERY = `
	query Sponsors($login: String!) {
		organization(login: $login) {
			publicSponsors: sponsorshipsAsMaintainer(first: 100, activeOnly: true, includePrivate: false) {
				nodes {
					sponsorEntity {
						__typename
						... on User {
							login
							name
							url
						}
						... on Organization {
							login
							name
							url
						}
					}
				}
				totalCount
			}
			allSponsors: sponsorshipsAsMaintainer(first: 1, activeOnly: true, includePrivate: true) {
				totalCount
			}
		}
	}
`;

function pickSponsors(payload) {
	const orgSponsors = payload?.data?.organization?.publicSponsors?.nodes || [];

	return orgSponsors
		.map(node => node?.sponsorEntity)
		.filter(Boolean)
		.map(entity => ({
			name: entity.name || entity.login,
			login: entity.login,
			url: entity.url,
			type: entity.__typename,
		}));
}

module.exports = async (_req, res) => {
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");

	const login = process.env.GITHUB_SPONSORS_LOGIN || "minesa-org";
	const token = process.env.GITHUB_TOKEN;

	if (!token) {
		res.status(500).json({
			error: "Missing GitHub Sponsors configuration",
			items: [],
		});
		return;
	}

	try {
		const response = await fetch(GITHUB_GRAPHQL_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				"User-Agent": "minesa-website",
			},
			body: JSON.stringify({
				query: SPONSORS_QUERY,
				variables: { login },
			}),
		});

		const payload = await response.json();
		if (!response.ok || payload.errors) {
			res.status(502).json({
				error: "Failed to fetch sponsor data from GitHub",
				details: payload.errors || payload,
				items: [],
			});
			return;
		}

		const publicCount = payload?.data?.organization?.publicSponsors?.totalCount || 0;
		const totalCount = payload?.data?.organization?.allSponsors?.totalCount || publicCount;

		res.status(200).json({
			items: pickSponsors(payload),
			publicCount,
			totalCount,
		});
	} catch (error) {
		res.status(500).json({
			error: "Unexpected error while loading sponsor data",
			details: error instanceof Error ? error.message : String(error),
			items: [],
		});
	}
};
