import { USER_API } from '@/constants';
import { DeleteButton, Form, } from '../form/Form';

export default function CancelTradeButton(props: { tradeId: string }) {
	return (
		<Form action={USER_API.TRADE} method="patch">
			<input type="hidden" name="tradeId" value={props.tradeId} />
			<input type="hidden" name="action" value="cancel" />
			<DeleteButton>Cancel request</DeleteButton>
		</Form>
	);
}
