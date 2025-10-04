<script lang="ts">
	import Input from '../ui/Input.svelte';
	import { form } from '$lib/stores/form';
	import { wallet } from '$lib/stores/wallet';
	import { transaction } from '$lib/stores/transaction';

	$: disabled = !!$transaction.escrowAddress;
	$: placeholder = $wallet.account || '0x...';
</script>

<Input
	id="recipientAddress"
	label="Recipient Address"
	bind:value={$form.recipientAddress}
	{placeholder}
	{disabled}
/>
