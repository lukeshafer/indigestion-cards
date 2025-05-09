import {
	For,
	type JSX,
	type ParentComponent,
	type ParentProps,
	Show,
	createSignal,
} from 'solid-js';
import { setAlerts } from '@site/client/state';
import { ASSETS } from '@site/constants';
import { useViewTransition } from '@site/client/utils';
import { navigate } from 'astro:transitions/client';
import { twMerge } from 'tailwind-merge';

export function Form(props: {
	children: JSX.Element;
	method:
		| 'get'
		| 'post'
		| 'dialog'
		| 'put'
		| 'delete'
		| 'options'
		| 'head'
		| 'trace'
		| 'connect'
		| 'patch';
	action?: string;
	class?: string;
	enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
	confirm?: string;
	onsuccess?: () => void;
	onsubmit?: (e: SubmitEvent) => void;
	loadingText?: string;
	successRedirect?: string;
	errorRedirect?: string;
	successRefresh?: boolean;
	ref?: (el: HTMLFormElement) => void;
	noAlert?: boolean;
}) {
	const [isLoading, setIsLoading] = createSignal(false);

	const formAction = () => {
		// Forms support GET and POST methods, so no need to modify the method on the server
		if (props.method === 'get' || props.method === 'post') return props.action;

		let formURL: URL;
		let isLocal = false;
		try {
			formURL = new URL(props.action || window.location.pathname);
		} catch {
			isLocal = true;
			formURL = new URL(props.action || window.location.pathname, 'http://localhost');
		}

		formURL.searchParams.set('formmethod', props.method);
		return isLocal ? formURL.pathname + formURL.search : formURL.toString();
	};

	const handleSubmit = async (
		e: SubmitEvent & {
			currentTarget: HTMLFormElement;
			target: Element;
		}
	) => {
		e.preventDefault();
		if (props.onsubmit) props.onsubmit(e);
		if (props.confirm && !confirm(props.confirm)) return;
		const form = e.currentTarget;
		const formData = new FormData(form);
		const data = new URLSearchParams(formData as unknown as string);

		setIsLoading(true);
		const action =
			props.method.toUpperCase() === 'GET'
				? `${props.action || window.location.href}?${data}`
				: props.action || window.location.href;
		const body = props.method.toUpperCase() === 'GET' ? undefined : data;

		const response = await fetch(action, {
			method: props.method.toUpperCase(),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body,
		})
			.catch(err => {
				console.error(err);
				throw err;
			})
			.finally(() => setIsLoading(false));

		if (response.redirected) {
			try {
				await navigate(response.url);
			} catch {
				location.assign(response.url);
			}
		}

		const responseBody = await response.text();

		const contentType = response.headers.get('content-type');
		const isHTML = contentType?.startsWith('text/html');

		if (response.ok) {
			if (!props.noAlert)
				useViewTransition(() => {
					const alertMessage = isHTML ? 'Success!' : responseBody || 'Success!';
					setAlerts(alerts => [{ message: alertMessage, type: 'success' }, ...alerts]);
				});
			if (props.onsuccess) props.onsuccess();
			if (props.successRedirect) {
				const redirectURL = new URL(props.successRedirect, window.location.origin);
				if (responseBody) redirectURL.searchParams.set('alert', responseBody);
				location.assign(redirectURL.toString());
			}
			if (props.successRefresh) location.reload();
		} else {
			if (!props.noAlert)
				useViewTransition(() => {
					setAlerts(alerts => [
						{
							message: isHTML
								? 'There was an error'
								: responseBody || 'There was an error.',
							type: 'error',
						},
						...alerts,
					]);
				});
			if (props.errorRedirect) {
				const redirectURL = new URL(props.errorRedirect, window.location.origin);
				if (redirectURL.pathname !== location.pathname) {
					if (responseBody) {
						redirectURL.searchParams.set('alert', responseBody);
						redirectURL.searchParams.set('type', 'error');
					}
					location.assign(redirectURL.toString());
				}
			}
		}
	};

	return (
		<form
			ref={el => props.ref?.(el)}
			class={twMerge('relative flex w-full flex-col items-start gap-6', props.class)}
			method={props.method === 'get' ? 'get' : 'post'}
			action={formAction()}
			enctype={props.enctype}
			onSubmit={handleSubmit}>
			<Show when={isLoading()}>
				<Loading loadingText={props.loadingText} />
			</Show>
			{props.children}
		</form>
	);
}

export function Loading(props: { loadingText?: string }) {
	return (
		<div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/50 bg-opacity-50 dark:bg-gray-950/50">
			<img src={ASSETS.EMOTES.LILINDPB} alt="" />
			{props.loadingText ? (
				<p class="font-heading font-bold uppercase">{props.loadingText}</p>
			) : null}
		</div>
	);
}

const BASE_INPUT_CLASS =
	'focus:border-brand-main focus:ring-brand-main block w-full rounded-none bg-white dark:bg-black p-1 text-black dark:text-gray-50 outline outline-2 outline-gray-300 dark:outline-gray-700 focus:outline-brand-main focus:ring-4';

function InputGroup(props: ParentProps) {
	return <div class="flex w-full flex-col items-start">{props.children}</div>;
}

function Label(props: { label: string; name: string; required?: boolean }) {
	return (
		<label
			for={props.name}
			class="font-heading block font-semibold"
			classList={{ required: props.required }}>
			{props.label}
		</label>
	);
}

interface InputProps<T extends number | string> extends JSX.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	name: string;
	value?: T;
	required?: boolean;
	placeholder?: string;
	readOnly?: boolean;
	setValue?: (value: string) => void;
	children?: JSX.Element;
	inputOnly?: boolean;
}

export function TextInput(props: InputProps<string>) {
	return (
		<>
			{props.inputOnly ? (
				<>
					<label class="sr-only" for={props.name}>
						{props.label}
					</label>
					<input
						{...props}
						id={props.name}
						name={props.name}
						type="text"
						class={twMerge(BASE_INPUT_CLASS, props.class ?? '')}
						classList={{ 'bg-gray-100': props.readOnly, 'bg-white': !props.readOnly }}
						required={props.required}
						placeholder={props.placeholder ?? props.label}
						readOnly={props.readOnly}
						value={props.value ?? ''}
						onInput={e => props.setValue?.(e.target.value ?? '')}
					/>
				</>
			) : (
				<InputGroup>
					<Label {...props} />
					{props.children}
					<input
						{...props}
						id={props.name}
						name={props.name}
						type="text"
						class={twMerge(BASE_INPUT_CLASS, props.class ?? '')}
						classList={{ 'bg-gray-100': props.readOnly, 'bg-white': !props.readOnly }}
						required={props.required}
						placeholder={props.placeholder}
						readOnly={props.readOnly}
						value={props.value ?? ''}
						onInput={e => props.setValue?.(e.target.value ?? '')}
					/>
				</InputGroup>
			)}
		</>
	);
}

export function TextArea(
	props: InputProps<string> & { height?: string; maxLength?: string | number }
) {
	return (
		<InputGroup>
			<Show
				when={!props.inputOnly}
				fallback={
					<label class="sr-only" for={props.name}>
						{props.label}
					</label>
				}>
				<Label {...props} />
			</Show>
			<textarea
				maxLength={props.maxLength}
				id={props.name}
				name={props.name}
				class={BASE_INPUT_CLASS + ' h-32'}
				classList={{ 'bg-gray-100': props.readOnly, 'bg-white': !props.readOnly }}
				style={{ height: props.height || '8rem' }}
				required={props.required}
				placeholder={props.placeholder}
				readOnly={props.readOnly}
				value={props.value ?? ''}
				onInput={e => props.setValue?.(e.target.value ?? '')}
			/>
		</InputGroup>
	);
}

export function NumberInput(props: InputProps<number>) {
	return (
		<InputGroup>
			<Show
				when={!props.inputOnly}
				fallback={
					<label class="sr-only" for={props.name}>
						{props.label}
					</label>
				}>
				<Label {...props} />
			</Show>
			<input
        {...props}
				id={props.name}
				name={props.name}
        disabled={props.disabled}
				type="number"
				class={BASE_INPUT_CLASS}
				classList={{ 'bg-gray-100': props.readOnly, 'bg-white': !props.readOnly }}
				required={props.required}
				placeholder={props.placeholder}
				readOnly={props.readOnly}
				value={props.value ?? ''}
				onInput={e => props.setValue?.(e.target.value ?? '')}
			/>
		</InputGroup>
	);
}

export function IdInput(props: InputProps<string> & { from: string }) {
	const [isReadOnly, setIsReadOnly] = createSignal(true);
	const handleEditClick = (e: MouseEvent) => {
		e.preventDefault();
		setIsReadOnly(false);
	};

	return (
		<div class="relative w-full">
			<TextInput
				{...props}
				value={props.from.toLowerCase().replace(/[^a-z0-9]/g, '-')}
				readOnly={isReadOnly()}
			/>
			<button
				hidden={!isReadOnly()}
				class="absolute bottom-0 right-0 bg-none p-2 leading-none text-black opacity-50 hover:opacity-100"
				onClick={handleEditClick}>
				Edit
			</button>
		</div>
	);
}

export function FileInput(props: {
	label: string;
	name: string;
	required?: boolean;
	accept?: string;
}) {
	const [preview, setPreview] = createSignal<string | null>(null);

	const showPreview = (el: HTMLInputElement) => {
		el.addEventListener('change', () => {
			const file = el.files?.[0];
			if (!file || !file.type.startsWith('image/')) {
				setPreview(null);
				return;
			}

			setPreview(URL.createObjectURL(file));
		});
	};

	return (
		<InputGroup>
			<Label {...props} />
			<input
				ref={showPreview}
				id={props.name}
				name={props.name}
				type="file"
				class="focus:border-accent-light focus:ring-accent-light file:text-shadow file:bg-brand-light file:hover:bg-brand-main file:dark:bg-brand-main file:dark:hover:bg-brand-dark file:brand-shadow file:text-outline block w-full rounded-none p-1 text-black file:cursor-pointer file:rounded-full file:border-none file:px-4 file:py-2 file:font-bold file:uppercase file:text-white file:transition-colors focus:outline-none focus:ring-4"
				required={props.required}
				accept={props.accept}
			/>
			<Show when={preview()}>
				<img src={preview()!} class="my-4 max-w-xs object-contain" />
			</Show>
		</InputGroup>
	);
}

type SelectOptions = ReadonlyArray<{ value: string; label: string }>;
type Value<O extends SelectOptions> = O[number]['value'];

export function Select<Options extends ReadonlyArray<{ value: string; label: string }>>(props: {
	label?: string;
	name: string;
	value?: Value<Options>;
	required?: boolean;
	setValue?: (value: Value<Options>) => void;
	options: Options;
	class?: string;
}) {
	return (
		<InputGroup>
			{props.label ? <Label {...props} label={props.label} /> : null}
			<select
				id={props.name}
				name={props.name}
				class={twMerge(BASE_INPUT_CLASS, 'bg-white', props.class)}
				required={props.required}
				value={props.value ?? props.options[0]?.value}
				onInput={e => props.setValue?.(e.target.value ?? '')}>
				<For each={props.options}>
					{option => (
						<option value={option.value} selected={option.value === props.value}>
							{option.label}
						</option>
					)}
				</For>
			</select>
		</InputGroup>
	);
}

export function Checkbox(props: {
	label: string;
	name: string;
	value?: boolean;
	required?: boolean;
	setValue?: (value: boolean) => void;
}) {
	return (
		<div class="flex gap-2">
			<input
				id={props.name}
				name={props.name}
				type="checkbox"
				class="focus:border-brand-main focus:ring-brand-main inline-block w-auto rounded-none bg-white p-1 text-black focus:outline-none focus:ring-4"
				required={props.required}
				checked={props.value ?? false}
				onInput={e => props.setValue?.(e.target.checked)}
			/>
			<label
				for={props.name}
				class="inline-block flex-1 font-normal"
				classList={{ required: props.required }}>
				{props.label}
			</label>
		</div>
	);
}

export function Fieldset(props: { children?: JSX.Element; legend?: string }) {
	return (
		<fieldset class="grid w-full gap-4 border border-gray-300 p-4">
			<legend class="font-semibold">{props.legend}</legend>
			{props.children}
		</fieldset>
	);
}

const BrandButtonWrapper: ParentComponent<{ color?: 'default' | 'red' }> = props => (
	<div
		class="font-heading block w-fit rounded px-2 py-[0.3rem] text-center text-sm font-semibold transition-colors hover:brightness-75 dark:font-bold"
		classList={{
			'bg-brand-light dark:bg-brand-dark text-brand-950 dark:text-brand-100':
				props.color === 'default' || !props.color,
			'bg-red-300 dark:bg-red-800 text-red-900 dark:text-red-100': props.color === 'red',
		}}>
		{props.children}
	</div>
);

export function Anchor(props: { children: string; href: string }) {
	return (
		<a href={props.href}>
			<BrandButtonWrapper>{props.children}</BrandButtonWrapper>
		</a>
	);
}

export function SubmitButton(props: {
	children?: JSX.Element;
	onClick?: () => void;
	disabled?: boolean;
	transitionId?: string;
	confirm?: string;
	name?: string;
}) {
	return (
		<button
			name={props.name}
			type="submit"
			disabled={props.disabled}
			style={props.transitionId ? { 'view-transition-name': props.transitionId } : undefined}
			class="group w-fit"
			classList={{ 'cursor-not-allowed opacity-50': props.disabled }}
			onClick={e => {
				if (props.confirm !== undefined && !confirm(props.confirm ?? undefined)) {
					e.preventDefault();
				}
				props.onClick?.();
			}}>
			<BrandButtonWrapper>{props.children ?? 'Submit'}</BrandButtonWrapper>
		</button>
	);
}

export function DeleteButton(props: {
	children?: JSX.Element;
	onClick?: () => void;
	confirm?: string;
}) {
	return (
		<button
			type="submit"
			class="group w-fit"
			onClick={e => {
				if (props.confirm !== undefined && !confirm(props.confirm ?? undefined)) {
					e.preventDefault();
				}
				props.onClick?.();
			}}>
			<BrandButtonWrapper color="red">{props.children ?? 'Delete'}</BrandButtonWrapper>
		</button>
	);
}
