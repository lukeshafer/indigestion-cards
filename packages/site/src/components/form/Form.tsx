import { For, type JSX, type ParentProps, Show, createSignal } from 'solid-js';
import { setAlerts } from '@/lib/client/state';
import { ASSETS } from '@/constants';
import { useViewTransition } from '@/lib/client/utils';

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
	action: string;
	enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
	confirm?: string;
	onsuccess?: () => void;
	onsubmit?: () => void;
	loadingText?: string;
	successRedirect?: string;
	errorRedirect?: string;
	successRefresh?: boolean;
}) {
	const [isLoading, setIsLoading] = createSignal(false);

	const formAction = () => {
		// Forms support GET and POST methods, so no need to modify the method on the server
		if (props.method === 'get' || props.method === 'post') return props.action;

		let formURL: URL;
		let isLocal = false;
		try {
			formURL = new URL(props.action);
		} catch {
			isLocal = true;
			formURL = new URL(props.action, 'http://localhost');
		}

		formURL.searchParams.set('formmethod', props.method);
		return isLocal ? formURL.pathname + formURL.search : formURL.toString();
	};

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		if (props.onsubmit) props.onsubmit();
		if (props.confirm && !confirm(props.confirm)) return;
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const data = new URLSearchParams(formData as unknown as string);

		setIsLoading(true);
		const action =
			props.method.toUpperCase() === 'GET' ? `${props.action}?${data}` : props.action;
		const body = props.method.toUpperCase() === 'GET' ? undefined : data;

		const auth_token = localStorage.getItem('auth_token');
		const response = await fetch(action, {
			method: props.method.toUpperCase(),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: auth_token ? `Bearer ${auth_token}` : '',
			},
			body,
		})
			.catch((err) => {
				console.error(err);
				throw err;
			})
			.finally(() => setIsLoading(false));

		if (response.redirected) {
			return location.assign(response.url);
		}

		const responseBody = await response.text();

		if (response.ok) {
			useViewTransition(() => {
				setAlerts((alerts) => [
					...alerts,
					{ message: responseBody || 'Success!', type: 'success' },
				]);
			});
			if (props.onsuccess) props.onsuccess();
			if (props.successRedirect) {
				const redirectURL = new URL(props.successRedirect, window.location.origin);
				if (responseBody) redirectURL.searchParams.set('alert', responseBody);
				location.assign(redirectURL.toString());
			}
			if (props.successRefresh) location.reload();
		} else {
			const contentType = response.headers.get('content-type');
			const isHTML = contentType?.startsWith('text/html');

			useViewTransition(() => {
				setAlerts((alerts) => [
					...alerts,
					{
						message: isHTML
							? 'There was an error'
							: responseBody || 'There was an error.',
						type: 'error',
					},
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
			class="relative flex w-full flex-col items-start gap-6"
			method={props.method === 'get' ? 'get' : 'post'}
			action={formAction()}
			enctype={props.enctype}
			onSubmit={handleSubmit}>
			<Show when={isLoading()}>
				<div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/50 bg-opacity-50 dark:bg-black/50">
					<img src={ASSETS.EMOTES.LILINDPB} alt="" />
					{props.loadingText ? (
						<p class="font-heading font-bold uppercase">{props.loadingText}</p>
					) : null}
				</div>
			</Show>
			{props.children}
		</form>
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
				<input
					{...props}
					id={props.name}
					name={props.name}
					type="text"
					class={BASE_INPUT_CLASS}
					classList={{ 'bg-gray-100': props.readOnly, 'bg-white': !props.readOnly }}
					required={props.required}
					placeholder={props.placeholder ?? props.label}
					readOnly={props.readOnly}
					value={props.value ?? ''}
					onInput={(e) => props.setValue?.(e.target.value ?? '')}
				/>
			) : (
				<InputGroup>
					<Label {...props} />
					{props.children}
					<input
						id={props.name}
						name={props.name}
						type="text"
						class={BASE_INPUT_CLASS}
						classList={{ 'bg-gray-100': props.readOnly, 'bg-white': !props.readOnly }}
						required={props.required}
						placeholder={props.placeholder}
						readOnly={props.readOnly}
						value={props.value ?? ''}
						onInput={(e) => props.setValue?.(e.target.value ?? '')}
					/>
				</InputGroup>
			)}
		</>
	);
}

export function TextArea(props: InputProps<string> & { height?: string }) {
	return (
		<InputGroup>
			<Label {...props} />
			<textarea
				id={props.name}
				name={props.name}
				class={BASE_INPUT_CLASS + ' h-32'}
				classList={{ 'bg-gray-100': props.readOnly, 'bg-white': !props.readOnly }}
				style={{ height: props.height || '8rem' }}
				required={props.required}
				placeholder={props.placeholder}
				readOnly={props.readOnly}
				value={props.value ?? ''}
				onInput={(e) => props.setValue?.(e.target.value ?? '')}
			/>
		</InputGroup>
	);
}

export function NumberInput(props: InputProps<number>) {
	return (
		<InputGroup>
			<Label {...props} />
			<input
				id={props.name}
				name={props.name}
				type="number"
				class={BASE_INPUT_CLASS}
				classList={{ 'bg-gray-100': props.readOnly, 'bg-white': !props.readOnly }}
				required={props.required}
				placeholder={props.placeholder}
				readOnly={props.readOnly}
				value={props.value ?? ''}
				onInput={(e) => props.setValue?.(e.target.value ?? '')}
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

	// @ts-expect-error Solid directive
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
				use:showPreview
				id={props.name}
				name={props.name}
				type="file"
				class="focus:border-accent-light focus:ring-accent-light file:text-shadow file:bg-brand-main 
				file:hover:bg-brand-dark file:brand-shadow block w-full rounded-none p-1 text-black 
				file:cursor-pointer file:rounded file:border-none file:px-4 file:py-2 file:font-bold 
				file:uppercase file:text-white file:transition-colors focus:outline-none focus:ring-4"
				required={props.required}
				accept={props.accept}
			/>
			<Show when={preview()}>
				<img src={preview()!} class="my-4 max-w-xs object-contain" />
			</Show>
		</InputGroup>
	);
}

export function Select(props: {
	label?: string;
	name: string;
	value?: string;
	required?: boolean;
	setValue?: (value: string) => void;
	options: { value: string; label: string }[];
}) {
	return (
		<InputGroup>
			{props.label ? <Label {...props} label={props.label} /> : null}
			<select
				id={props.name}
				name={props.name}
				class={BASE_INPUT_CLASS + ' bg-white'}
				required={props.required}
				value={props.value ?? props.options[0]?.value}
				onInput={(e) => props.setValue?.(e.target.value ?? '')}>
				<For each={props.options}>
					{(option) => (
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
				class="focus:border-brand-main focus:ring-brand-main inline-block w-auto 
				rounded-none bg-white p-1 text-black focus:outline-none focus:ring-4"
				required={props.required}
				checked={props.value ?? false}
				onInput={(e) => props.setValue?.(e.target.checked)}
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

const BUTTON_CLASS =
	'text-shadow font-heading rounded border border-gray-300 dark:border-gray-800 px-4 py-2 font-bold uppercase text-white transition-colors';

export function Anchor(props: { children: string; href: string; type?: 'submit' | 'delete' }) {
	return (
		<a
			href={props.href}
			class={BUTTON_CLASS}
			classList={{
				'bg-brand-main hover:bg-brand-dark dark:bg-brand-dark':
					!props.type || props.type === 'submit',
				'bg-red-500 hover:bg-red-800': props.type === 'delete',
			}}>
			{props.children}
		</a>
	);
}

export function SubmitButton(props: {
	children?: JSX.Element;
	onClick?: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="submit"
			disabled={props.disabled}
			classList={{ 'cursor-not-allowed opacity-50': props.disabled }}
			class={`${BUTTON_CLASS} bg-brand-main hover:bg-brand-dark dark:bg-brand-dark dark:hover:brightness-90`}
			onClick={() => props.onClick?.()}>
			{props.children ?? 'Submit'}
		</button>
	);
}

export function DeleteButton(props: { children?: string; onClick?: () => void }) {
	return (
		<button
			type="submit"
			class={`${BUTTON_CLASS} bg-red-500 hover:bg-red-800 dark:bg-red-700 `}
			onClick={() => props.onClick?.()}>
			{props.children ?? 'Delete'}
		</button>
	);
}
