import { ParentProps } from 'solid-js';
import Nav from './Nav';

export default function Layout(props: ParentProps) {
	return (
		<>
			<Nav />
      {props.children}
		</>
	);
}
