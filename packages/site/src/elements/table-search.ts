class TableSearch extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const tableId = this.dataset.tableId;
		if (!tableId) return;
		const table = document.getElementById(tableId);
		if (!table || !(table instanceof HTMLTableElement)) return;

		const searchColumn = this.dataset.searchColumn;

		const tbody = table.querySelector('tbody')!;
		const rows = Array.from(tbody.querySelectorAll('tr'));
		const originalRows = rows.slice();

		const searchColumnIndex = searchColumn
			? Array.from(table.querySelectorAll('th')).findIndex(
				(th) => th.textContent === searchColumn
			) || 0
			: 0;

		const searchInput = this.querySelector('[data-table-search]') as HTMLInputElement;
		const doSearch = () => {
			const search = searchInput.value.toLowerCase();
			if (!search) {
				originalRows.forEach((row) => {
					tbody.appendChild(row);
				});
				return;
			}

			/*
				for (const row of rows) {
					const username = row.children[searchColumnIndex]?.textContent?.toLowerCase();
					if (!username) continue;
					if (!username.includes(search)) {
						if (row.parentElement) row.parentElement.removeChild(row);
						continue;
					}
					tbody.appendChild(row);
				}
				*/
			rows.slice()
				.filter((row) => {
					const username = row.children[searchColumnIndex]?.textContent?.toLowerCase();
					if (username?.includes(search)) return true;

					if (row.parentElement) row.parentElement.removeChild(row);
					return false;
				})
				.sort((a, b) => {
					const aUsername = a.children[searchColumnIndex]?.textContent
						?.toLowerCase()
						.trim();
					const bUsername = b.children[searchColumnIndex]?.textContent
						?.toLowerCase()
						.trim();
					if (!aUsername || !bUsername) return 0;

					// Sort by exact match first, then by starting with search, then by alphabetical
					if (aUsername === search) return -1;
					if (bUsername === search) return 1;

					if (aUsername.startsWith(search) && !bUsername.startsWith(search)) return -1;
					if (!aUsername.startsWith(search) && bUsername.startsWith(search)) return 1;

					if (aUsername < bUsername) return -1;
					if (aUsername > bUsername) return 1;
					return 0;
				})
				.forEach((row) => {
					tbody.appendChild(row);
				});
		};

		searchInput.addEventListener('input', doSearch);
		searchInput.addEventListener('load', doSearch);
		searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				const currentRows = tbody.querySelectorAll('tr');
				if (currentRows.length === 1) {
					const username = currentRows.item(0).children[0]!.textContent!;
					if (!username) return;

					window.location.href = `/user/${username}`;
				}
			}
		});
	}
}

customElements.define('table-search', TableSearch);
