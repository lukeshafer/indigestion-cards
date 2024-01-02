import { get } from '../data';

export class DataLists extends HTMLElement {
	connectedCallback() {
		this.populateList('usernames', get('usernames'));
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
