declare namespace astroHTML.JSX {
	interface HTMLAttributes {
		_?: string;
		preload?: string | boolean;
	}
	interface HTMLButtonAttributes {
		'data-type'?: 'success' | 'submit' | 'delete';
	}
}
