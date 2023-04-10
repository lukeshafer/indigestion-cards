import { For, JSX, createEffect, createSignal, useContext } from 'solid-js'
import { createContext, Show } from 'solid-js'
import { SetStoreFunction, reconcile, unwrap } from 'solid-js/store'
import { createStore } from 'solid-js/store'

interface FormData {
	[key: string]: string | number | string[]
}

const FormContext = createContext<[FormData, SetStoreFunction<FormData>]>()

export function Form(props: {
	action: string
	method?: 'get' | 'post'
	children: JSX.Element
	redirect?: string
}) {
	const [store, setStore] = createStore<FormData>({})
	const [isLoading, setIsLoading] = createSignal(false)
	const [errorText, setErrorText] = createSignal('')
	const [successText, setSuccessText] = createSignal('')

	const errorMessages: Record<number, string> = {
		409: 'An item with that ID already exists.',
	}
	async function handleError(res: Response) {
		console.log(res)
		const errorMessage =
			errorMessages[res.status] ?? (await res.text()) ?? 'An unknown error occurred.'

		setSuccessText('')
		setErrorText(errorMessage)
		alert(errorMessage)
	}

	async function submit() {
		const body = JSON.stringify(unwrap(store))

		console.log(body)
		setIsLoading(true)
		try {
			const result = await fetch(props.action, {
				method: props.method ?? 'post',
				body,
			}).finally(() => setIsLoading(false))

			if (!result.ok) {
				handleError(result)
				return
			}
			setErrorText('')
			setSuccessText('Success!')
			if (result.status >= 300 && result.status < 400) {
				const location = result.headers.get('Location')
				console.log(location)
				if (location) window.location.assign(location)
			}
		} catch {
			handleError(new Response('', { status: 500 }))
		}
	}

	return (
		<FormContext.Provider value={[store, setStore]}>
			<div class="relative">
				<form
					onSubmit={(e) => {
						e.preventDefault()
						submit()
					}}
					class="bg-sky-100 grid grid-cols-1 justify-center 
					justify-items-center gap-4 p-4 text-xl w-full"
					style={{ opacity: isLoading() ? 0.5 : 1 }}
					method={props.method ?? 'post'}
					action={props.action}>
					{props.children}
					<button type="submit" class="bg-white w-full p-4 mt-4 font-bold">
						Submit
					</button>
					<Show when={errorText()}>
						<p class="text-red-500">{errorText()}</p>
					</Show>
					<Show when={successText()}>
						<p class="text-green-500">{successText()}</p>
					</Show>
				</form>
				<div
					aria-hidden="true"
					class="absolute inset-0 h-full w-full justify-center items-center"
					style={{
						display: isLoading() ? 'flex' : 'none',
					}}>
					<div class="bg-white w-24 h-24 rounded-full border-8 border-black border-dotted spin" />
					<span class="absolute absolute-center">Loading</span>
				</div>
			</div>
		</FormContext.Provider>
	)
}

type EnumToObject<T extends readonly string[], R> = {
	[K in T[number]]: R
}

interface InputBinding<T extends readonly string[]> {
	id: T
	transform: (args: EnumToObject<T, string>) => string
}

interface BaseInputProps {
	required?: boolean
	id: string
	children: string
	readOnly?: true | undefined
}
interface NumberInputProps extends BaseInputProps {
	type: 'number'
	defaultValue?: number
}
interface StringInputProps extends BaseInputProps {
	type?: 'string'
	defaultValue?: string
}
type InputProps = NumberInputProps | StringInputProps

export function TextInput<T extends readonly string[]>(
	props: InputProps & { bind?: InputBinding<T> }
) {
	const [store, setStore] = useContext(FormContext) ?? []
	if (!store || !setStore) throw new Error('Input must be used within a Form')

	const initialValue = props.defaultValue ?? (props.type === 'number' ? 0 : '')
	setStore(props.id, initialValue)

	createEffect(() => {
		if (!props.bind || props.bind.id.length === 0) return
		const values = {} as EnumToObject<T, string>
		let id: T[number]
		for (id of props.bind.id) {
			values[id] = String(store[id] ?? '')
		}
		setStore(props.id, props.bind.transform?.(values))
	})

	return (
		<InputBase label={props.children} id={props.id}>
			{/*@ts-ignore*/}
			<input
				readOnly={props.readOnly}
				class="block w-3/5 px-2 py-1"
				classList={{ 'bg-gray-100': props.readOnly }}
				id={props.id}
				name={props.id}
				type={props.type ?? 'string'}
				value={store[props.id]!}
				onInput={(e) => {
					setStore(props.id, e.currentTarget.value)
				}}
				required={props.required ?? false}
			/>
		</InputBase>
	)
}

export function Select<T extends { value: string; name: string }[]>(props: {
	id: string
	children: string
	options: T
	required?: boolean
	defaultValue?: T[number]['value']
}) {
	const [store, setStore] = useContext(FormContext) ?? []
	if (!store || !setStore) throw new Error('Select must be used within a Form')

	const initialValue = props.defaultValue ?? props.options[0]?.value ?? ''
	setStore(props.id, initialValue)

	return (
		<InputBase label={props.children} id={props.id}>
			<select
				class="block w-3/5 bg-white px-2 py-1"
				name={props.id}
				id={props.id}
				value={store[props.id]!}
				required
				onInput={(e) => setStore(props.id, e.currentTarget.value)}>
				{props.options.map((option) => (
					<option value={option.value}>{option.name}</option>
				))}
			</select>
		</InputBase>
	)
}

export function HiddenInput(props: { id: string; value: string }) {
	const [store, setStore] = useContext(FormContext) ?? []
	if (!store || !setStore) throw new Error('Input must be used within a Form')
	setStore(props.id, props.value)
	return <input type="hidden" id={props.id} name={props.id} value={props.value} />
}

function InputBase(props: { label: string; id: string; children: JSX.Element }) {
	return (
		<div class="flex gap-3 justify-end w-full">
			<label for={props.id}>{props.label}</label>
			{props.children}
		</div>
	)
}

type InputStore<T extends readonly InputProps[]> = {
	[key in T[number] as key['id']]: key['type'] extends 'number' ? number : string
}

function getDefaultInputProps<T extends readonly InputProps[]>(inputs: T) {
	const defaults = {} as InputStore<T>
	inputs.forEach((input) => {
		// @ts-expect-error
		defaults[input.id] = input.defaultValue ?? (input.type === 'number' ? 0 : '')
	})
	return defaults
}

const FieldSetContext =
	createContext<[InputStore<any>[], SetStoreFunction<InputStore<any>[]>, string]>()

export function DynamicFieldSet<T extends readonly InputProps[]>(props: {
	id: string
	inputs: T
	children: string
	addButtonLabel?: string
}) {
	const [inputList, setInputList] = createStore<InputStore<T>[]>([])
	const defaultProps = getDefaultInputProps(props.inputs)
	const [store, setStore] = useContext(FormContext) ?? []
	if (!store || !setStore) throw new Error('DynamicFieldSet must be used within a Form')

	createEffect(() => {
		setStore(props.id, inputList)
	})

	return (
		<FieldSetContext.Provider value={[inputList, setInputList, props.id]}>
			<fieldset class="border border-gray-300 p-4 w-full grid gap-8">
				<legend>{props.children}</legend>
				<button
					class="p-2"
					onClick={(e) => {
						e.preventDefault()
						setInputList([...inputList, { ...defaultProps }])
					}}>
					Add {props.addButtonLabel ?? 'Item'}
				</button>
				<For each={inputList}>
					{(_, index) => <FieldSetItem inputs={props.inputs} index={index()} />}
				</For>
			</fieldset>
		</FieldSetContext.Provider>
	)
}

function FieldSetItem<T extends readonly InputProps[]>(props: { inputs: T; index: number }) {
	const [list, setList, parentId] = useContext(FieldSetContext) ?? []
	if (!list || !setList) throw new Error('FieldSetItem must be used within a DynamicFieldSet')

	return (
		<div class="grid gap-4 justify-items-end border border-gray-300 p-4">
			{props.inputs.map((input) => {
				const id = `${parentId}-${input.id}-${props.index}`
				const coerce = (value: string) => (input.type === 'number' ? Number(value) : value)
				return (
					<InputBase label={input.children} id={id}>
						<input
							class="block w-3/5 bg-white px-2"
							id={id}
							name={id}
							type={input.type ?? 'string'}
							value={list[props.index]?.[input.id]!}
							onInput={(e) => {
								const current = list[props.index]
								console.log(props.index)
								setList(props.index, {
									...current,
									[input.id]: coerce(e.currentTarget.value),
								})
							}}
							required
						/>
					</InputBase>
				)
			})}
			<button
				onClick={(e) => {
					e.preventDefault()
					const newList = list.slice()
					newList.splice(props.index, 1)
					setList(reconcile(newList))
				}}>
				Remove
			</button>
		</div>
	)
}
