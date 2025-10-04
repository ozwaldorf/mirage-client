<script lang="ts">
	import ActionItem from './ActionItem.svelte';
	import { wallet } from '$lib/stores/wallet';
	import { form } from '$lib/stores/form';
	import { transaction } from '$lib/stores/transaction';
	import { networkKey } from '$lib/stores/network';
	import { fees } from '$lib/stores/derived';
	import { parseTokenAmount } from '$lib/services/ethereum/token';
	import { encryptAndSubmitSignal } from '$lib/services/mirage/nomad';
	import { transferMonitor } from '$lib/services/ethereum/monitor';

	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	$: signalFieldsFilled =
		$form.tokenContract &&
		$form.tokenAmount &&
		$fees.totalUsd > 0 &&
		$form.recipientAddress &&
		$form.nodeApiUrl;
	$: networkOnline = $networkKey && $networkKey.prefix !== 'Error';
	$: chainMatch =
		!$wallet.chainId || !$networkKey || !$networkKey.chainId || $wallet.chainId === $networkKey.chainId;
	$: submitDisabled =
		!signalFieldsFilled || !$transaction.escrowAddress || !networkOnline || !chainMatch;
	$: actionStatus = !submitDisabled && $transaction.executeStatus === 'disabled'
		? 'available'
		: !submitDisabled
			? $transaction.executeStatus
			: 'disabled';
	$: buttonTooltip = !$transaction.escrowAddress
		? 'Contract not deployed'
		: !networkOnline
			? 'Network offline'
			: !chainMatch
				? 'Chain mismatch'
				: '';

	async function handleExecute() {
		if (!$wallet.signer || !$transaction.escrowAddress) return;

		$transaction.executeStatus = 'pending';

		try {
			const tokenAddress = $form.tokenContract;
			const tokenAmount = $form.tokenAmount;
			const recipientAddress = $form.recipientAddress;
			const rewardAmount = $fees.rewardUsd;
			const decimals = $form.tokenDecimals ?? 18;

			const transferAmount = parseTokenAmount(tokenAmount, decimals);
			const rewardAmountParsed = parseTokenAmount(
				Number(rewardAmount).toFixed(decimals),
				decimals
			);

			await encryptAndSubmitSignal(
				$form.nodeApiUrl,
				$transaction.escrowAddress,
				tokenAddress,
				recipientAddress,
				transferAmount,
				rewardAmountParsed
			);

			// Set 2 minute timeout
			timeoutId = setTimeout(() => {
				$transaction.executeStatus = 'error';
				transferMonitor.stopWatching();
			}, 120000);

			// Start monitoring for the transfer
			await transferMonitor.watchTransfer(
				tokenAddress,
				recipientAddress,
				transferAmount,
				(transferData) => {
					// Transfer detected - clear timeout
					if (timeoutId) clearTimeout(timeoutId);
					$transaction.executeStatus = 'success';

					// Display transaction hash
					$transaction.submitTxHash = transferData.transactionHash;
				},
				(error) => {
					// Error during monitoring - clear timeout
					if (timeoutId) clearTimeout(timeoutId);
					$transaction.executeStatus = 'error';
					console.error('Monitoring error:', error);
				}
			);
		} catch (error: any) {
			if (timeoutId) clearTimeout(timeoutId);
			$transaction.executeStatus = 'error';
			console.error('Execute error:', error);
		}
	}
</script>

<ActionItem
	title="Execute Signal on Mirage"
	status={actionStatus}
	buttonText={$transaction.executeStatus === 'success' ? 'Verified' : 'Execute'}
	buttonTitle={buttonTooltip}
	onClick={handleExecute}
	txHash={$transaction.submitTxHash}
/>
