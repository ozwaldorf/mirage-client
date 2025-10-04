<script lang="ts">
	import { onMount } from 'svelte';
	import Input from '../ui/Input.svelte';
	import { form } from '$lib/stores/form';
	import { wallet } from '$lib/stores/wallet';
	import { transaction } from '$lib/stores/transaction';
	import { getTokenInfo } from '$lib/services/ethereum/token';

	$: disabled = $transaction.approveClicked || $transaction.tokensApproved;

	let previousContract = '';
	let previousSigner = $wallet.signer;

	onMount(() => {
		if ($form.tokenContract && $wallet.signer) {
			previousContract = $form.tokenContract;
			fetchTokenInfo();
		}
	});

	// Fetch token info when wallet connects or contract address changes
	$: if ($wallet.signer !== previousSigner || $form.tokenContract !== previousContract) {
		previousSigner = $wallet.signer;
		previousContract = $form.tokenContract;

		if ($form.tokenContract && $wallet.signer) {
			fetchTokenInfo();
		} else {
			$form.tokenSymbol = '';
			$form.tokenDecimals = null;
		}
	}

	async function fetchTokenInfo() {
		if (!$form.tokenContract || !$wallet.signer) return;

		try {
			const info = await getTokenInfo($form.tokenContract, $wallet.signer);
			$form.tokenSymbol = info.symbol;
			$form.tokenDecimals = info.decimals;
		} catch (error) {
			console.error('Failed to fetch token info:', error);
			$form.tokenSymbol = '';
			$form.tokenDecimals = null;
		}
	}
</script>

<div class="token-inputs">
	<div class="flex-1">
		<Input
			id="tokenContract"
			label="Token Contract Address"
			bind:value={$form.tokenContract}
			placeholder="0xd402cE7dfd5F84d33d123A9D6078DF4096239c86"
			{disabled}
		/>
	</div>
	<div>
		<Input
			id="tokenSymbol"
			label="Symbol"
			bind:value={$form.tokenSymbol}
			placeholder="..."
			disabled={true}
			width="100px"
		/>
	</div>
</div>

<style>
	.token-inputs {
		display: flex;
		gap: 8px;
		align-items: flex-end;
	}

	.flex-1 {
		flex: 1;
	}
</style>
