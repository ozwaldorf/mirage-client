<script lang="ts">
	import ActionItem from './ActionItem.svelte';
	import { form } from '$lib/stores/form';
	import { transaction } from '$lib/stores/transaction';

	$: resetDisabled = !(
		$transaction.approveStatus !== 'disabled' ||
		$transaction.tokensApproved ||
		$transaction.escrowAddress
	);
	$: actionStatus = !resetDisabled ? 'available' : 'disabled';

	function handleReset() {
		// Reset transaction state
		$transaction.escrowAddress = null;
		$transaction.tokensApproved = false;
		$transaction.approveStatus = 'disabled';
		$transaction.deployStatus = 'disabled';
		$transaction.executeStatus = 'disabled';
		$transaction.approveHash = '';
		$transaction.deployHash = '';
		$transaction.submitHash = '';

		// Reset form values
		$form.tokenAmount = '';
		$form.recipientAddress = '';
	}
</script>

<ActionItem
	title="New Transaction"
	status={actionStatus}
	buttonText="Reset"
	buttonVariant="reload"
	buttonDisabled={resetDisabled}
	onClick={handleReset}
	isLast={true}
	isReloadAction={true}
/>
