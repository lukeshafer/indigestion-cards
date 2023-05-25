class MyForm extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const hasForm = this.querySelector('form') !== null;
		const formElement =
			this.querySelector<HTMLFormElement>('form') ?? document.createElement('form');

		if (!hasForm) {
			// place all children of this element inside the form
			// and then place the form inside this element
			while (this.firstChild) {
				formElement.append(this.firstChild);
			}
			this.append(formElement);
		}

		const method = this.getAttribute('method');
		formElement.method = method || 'post';

		const action = this.getAttribute('action');
		formElement.action = action || formElement.action || window.location.href;

		const enctype = this.getAttribute('enctype');
		if (enctype) formElement.enctype = enctype;

		// relative flex flex-col items-start gap-6 w-full
		formElement.classList.add('relative', 'flex', 'flex-col', 'items-start', 'gap-6', 'w-full');

		formElement.append(document.createElement('form-indicator'));

		const url = new URL(window.location.href);
		const params = new URLSearchParams(url.search);
		params.forEach((value, key) => {
			// if key is 'form-xxx', we want to query for 'input[name="xxx"]'
			const inputName = key === 'form' ? 'form' : key.replace(/^form-/, '');
			if (!inputName) return;
			const input = this.querySelector(
				`input[name="${inputName}"]`
			) as HTMLInputElement | null;
			if (!input) return;
			input.value = value;
		});

		const idInputs = this.querySelectorAll('[data-id-from]');
		idInputs.forEach((input) => {
			if (!(input instanceof HTMLInputElement)) return;

			const bindId = input.getAttribute('data-id-from');
			if (!bindId) return;

			const idInput = this.querySelector(`[name="${bindId}"]`) as HTMLInputElement | null;
			if (!idInput) return;

			idInput.addEventListener('change', () => {
				input.value = idInput.value.toLowerCase().replace(/[^a-z0-9]/g, '-');
			});
		});

		const fileInputs = this.querySelectorAll('input[type="file"]');
		fileInputs.forEach((input) => {
			if (!(input instanceof HTMLInputElement)) return;
			const preview = document.createElement('img');
			preview.classList.add('preview');
			input.after(preview);

			const addPreview = () => {
				const file = input.files?.[0];
				if (!file || !file.type.startsWith('image/')) {
					preview.src = '';
					return;
				}
				preview.src = URL.createObjectURL(file);
			};

			addPreview();
			input.addEventListener('change', addPreview);
		});

		const readonlyWithEditButton = this.querySelectorAll('[data-edit-button]');

		readonlyWithEditButton.forEach((input) => {
			if (!(input instanceof HTMLInputElement)) return;

			const wrapper = document.createElement('div');
			wrapper.style.position = 'relative';
			wrapper.style.width = '100%';
			input.after(wrapper);
			wrapper.append(input);

			const editButton = document.createElement('button');
			editButton.type = 'button';
			editButton.textContent = 'Edit';
			editButton.classList.add('edit-readonly');

			editButton.addEventListener('click', (e) => {
				e.preventDefault();
				if (!input.readOnly) return;
				input.readOnly = false;
				input.focus();
				editButton.style.display = 'none';
			});
			wrapper.append(editButton);
		});

		this.querySelectorAll('.input-group').forEach((group) => {
			const label = group.querySelector<HTMLLabelElement>('label');
			const inputs = group.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
				'input, textarea, select'
			);
			inputs.forEach((input) => {
				if (input.required) {
					label?.classList.add('required');
				}
			});
		});
	}
}

customElements.define('my-form', MyForm);
