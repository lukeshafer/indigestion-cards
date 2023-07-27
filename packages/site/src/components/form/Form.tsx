import { For, JSX, ParentProps, createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { setAlerts } from '@/lib/client/state';

export function Form(props: {
	children: JSX.Element;
	method: 'get' | 'post' | 'dialog' | 'put' | 'delete' | 'options' | 'head' | 'trace' | 'connect';
	action: string;
	enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
	confirm?: string;
	onsuccess?: () => void;
}) {
	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		if (props.confirm && !confirm(props.confirm)) return;
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const data = new URLSearchParams(formData as unknown as string);

		const response = await fetch(props.action, {
			method: props.method.toUpperCase(),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: data,
		});

		if (response.redirected) {
			location.assign(response.url);
			return;
		}

		const responseBody = await response.text();

		if (response.ok) {
			setAlerts((alerts) => [
				...alerts,
				{ text: responseBody || 'Success!', type: 'success' },
			]);
			if (props.onsuccess) props.onsuccess();
		} else {
			setAlerts((alerts) => [
				...alerts,
				{ text: responseBody || 'There was an error.', type: 'error' },
			]);
		}
	};

	return (
		<form
			class="relative flex w-full flex-col items-start gap-6"
			method={props.method === 'get' ? 'get' : 'post'}
			action={props.action}
			enctype={props.enctype}
			onsubmit={handleSubmit}>
			{props.children}
		</form>
	);
}

// TODO: form-indicator

const BASE_INPUT_CLASS =
	'focus:border-brand-main focus:ring-brand-main block w-full rounded-none bg-white p-1 text-black outline outline-2 outline-gray-300 focus:outline-none focus:ring-4';

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

interface InputProps<T extends number | string> {
	label: string;
	name: string;
	value?: T;
	required?: boolean;
	placeholder?: string;
	readOnly?: boolean;
	setValue?: (value: string) => void;
	children?: JSX.Element;
}

export function TextInput(props: InputProps<string>) {
	return (
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
	);
}

export function TextArea(props: InputProps<string>) {
	return (
		<InputGroup>
			<Label {...props} />
			<textarea
				id={props.name}
				name={props.name}
				class={BASE_INPUT_CLASS + ' h-32'}
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
				onclick={handleEditClick}>
				Edit
			</button>
		</div>
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
			{props.label ? <Label {...props} /> : null}
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
	'text-shadow font-heading rounded border border-gray-300 px-4 py-2 font-bold uppercase text-white transition-colors';

export function SubmitButton(props: { children?: string }) {
	return (
		<button type="submit" class={`${BUTTON_CLASS} bg-brand-main hover:bg-brand-dark`}>
			{props.children ?? 'Submit'}
		</button>
	);
}

export function DeleteButton(props: { children?: string }) {
	return (
		<button type="submit" class={`${BUTTON_CLASS} bg-red-500 hover:bg-red-800`}>
			{props.children ?? 'Delete'}
		</button>
	);
}
