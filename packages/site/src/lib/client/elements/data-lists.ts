import { trpc } from '@/trpc/client';

export class DataLists extends HTMLElement {
	connectedCallback() {
		this.populateList('usernames', trpc.users.allUsernames.query());
	}

	async populateList(id: string, inputData: Array<string> | Promise<Array<string>>) {
		const datalist = document.createElement('datalist');
		datalist.id = id;

		const data = await inputData;

		for (const str of data) {
			const option = document.createElement('option');
			option.value = str;
			datalist.appendChild(option);
		}

		this.appendChild(datalist);
	}
}

customElements.define('data-lists', DataLists);
