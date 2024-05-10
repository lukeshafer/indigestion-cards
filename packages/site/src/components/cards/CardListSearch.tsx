import { TextInput } from '../form/Form';

export default function CardListSearch(props: { setSearchText: (text: string) => void }) {
	let timeout: NodeJS.Timeout

	return (
		<TextInput
			class="h-8 self-end"
			name="search"
			label="Search cards"
			type="text"
			setValue={text => {
				if (timeout) {
					clearTimeout(timeout);
				}
        timeout = setTimeout(props.setSearchText, 200, text)
			}}
		/>
	);
}
