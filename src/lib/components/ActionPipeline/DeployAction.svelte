<script lang="ts">
	import ActionItem from './ActionItem.svelte';
	import { wallet } from '$lib/stores/wallet';
	import { form } from '$lib/stores/form';
	import { transaction } from '$lib/stores/transaction';
	import { fees } from '$lib/stores/derived';
	import { parseTokenAmount } from '$lib/services/ethereum/token';
	import { deployEscrow } from '$lib/services/ethereum/escrow';
	import { ESCROW_ABI, ESCROW_BYTECODE } from '$lib/services/ethereum/wallet';

	$: baseFieldsFilled =
		$form.tokenContract && $form.tokenAmount && $fees.totalUsd > 0 && $form.recipientAddress;
	$: deployDisabled =
		!baseFieldsFilled || !$transaction.tokensApproved || !!$transaction.escrowAddress;
	$: actionStatus = !deployDisabled && $transaction.deployStatus === 'disabled'
		? 'available'
		: !deployDisabled
			? $transaction.deployStatus
			: 'disabled';
	$: buttonTooltip = !$transaction.tokensApproved ? 'Tokens not approved yet' : '';

	async function handleDeploy() {
		if (!$wallet.signer || !$wallet.provider) return;

		$transaction.deployStatus = 'pending';

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

			const deployResult = await deployEscrow(
				{ ESCROW_ABI, ESCROW_BYTECODE },
				tokenAddress,
				recipientAddress,
				transferAmount,
				rewardAmountParsed,
				$wallet.signer
			);

			if (deployResult.deploymentHash) {
				$transaction.deployTxHash = deployResult.deploymentHash;
			}

			await deployResult.contract.waitForDeployment();
			$transaction.escrowAddress = deployResult.contract.target;
			$transaction.deployStatus = 'success';
		} catch (error: any) {
			console.error('Deploy error:', error);
			$transaction.deployStatus = 'error';
		}
	}
</script>

<ActionItem
	title="Deploy Escrow"
	status={actionStatus}
	buttonText={$transaction.deployStatus === 'success' ? 'Verified' : 'Deploy'}
	buttonTitle={buttonTooltip}
	onClick={handleDeploy}
	txHash={$transaction.deployTxHash}
/>
