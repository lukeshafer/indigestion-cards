const css = String.raw;

const template = document.createElement('template');
template.innerHTML = `
	<div aria-hidden="true">
		<img src="/lilindPB.gif" />
		<span class="loading-text"></span>
	</div>
`;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css`
	form-indicator {
		display: flex;
		position: absolute;
		inset: 0;
		background-color: rgba(255, 255, 255, 0.5);
		justify-content: center;
		align-items: center;
		color: black;
	}
`);

document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet];

export class FormIndicator extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.ariaHidden = 'true';

		this.classList.add('htmx-indicator');
		const loadingText = this.getAttribute('loadingText') || 'Saving';
		const templateClone = template.content.cloneNode(true) as DocumentFragment;
		templateClone.querySelector('.loading-text')!.textContent = loadingText;
		this.append(templateClone);
	}
}

customElements.define('form-indicator', FormIndicator);
