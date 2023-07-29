class SortTable extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const headings = Array.from(this.querySelectorAll('th'));
		const body = this.querySelector('tbody')!;
		const rows = Array.from(body.querySelectorAll('tr'));
		const originalRows = rows.slice();
		let currentHeading: HTMLTableCellElement | null = null;
		headings.forEach((th, index) => {
			if (th.dataset.noSort === '') return;
			th.addEventListener('click', () => {
				if (currentHeading && currentHeading !== th) {
					currentHeading.dataset.mode = 'none';
				}
				currentHeading = th;
				const currentMode = th.dataset.mode || 'none';
				const startDescending = th.dataset.startDescending === '';
				const modes = ['none', 'ascending', 'descending'];
				const currentModeIndex = modes.indexOf(currentMode);
				const newMode = modes.at(
					((startDescending ? modes.length - 1 : 1) + currentModeIndex) % modes.length
				);
				th.dataset.mode = newMode;
				if (newMode === 'none') {
					originalRows.forEach((row) => {
						body.appendChild(row);
					});
					return;
				}

				const dataType = th.dataset.type || 'string';
				const isAscending = newMode === 'ascending';
				const sortedRows = rows.sort((a, b) => {
					const aVal = a.children[index]!.textContent!.toLowerCase();
					const bVal = b.children[index]!.textContent!.toLowerCase();
					if (dataType === 'number') {
						return isAscending
							? Number(aVal) - Number(bVal)
							: Number(bVal) - Number(aVal);
					}
					if (aVal < bVal) {
						return isAscending ? -1 : 1;
					}
					if (aVal > bVal) {
						return isAscending ? 1 : -1;
					}
					return 0;
				});
				sortedRows.forEach((row) => {
					body.appendChild(row);
				});
			});
		});
	}
}

customElements.define('sort-table', SortTable);