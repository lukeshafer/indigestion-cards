/// <reference types="@solidjs/start/env" />

declare interface Document {
	/** @see https://drafts.csswg.org/css-view-transitions/#additions-to-document-api */
	startViewTransition?(updateCallback?: () => Promise<void> | void): {
		readonly updateCallbackDone: Promise<void>;
		readonly ready: Promise<void>;
		readonly finished: Promise<void>;

		skipTransition(): void;
	};
}
