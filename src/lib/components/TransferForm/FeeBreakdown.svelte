<script lang="ts">
	import Tooltip from '../ui/Tooltip.svelte';
	import { fees } from '$lib/stores/derived';
	import { form } from '$lib/stores/form';

	$: tokenAmount = parseFloat($form.tokenAmount) || 0;
	$: decimals = $fees.decimals ?? 2;
	$: displayFee = tokenAmount > 0 ? $fees.feeUsd.toFixed(decimals) : '—';
	$: displayGasFee = !isNaN($fees.gasFeeUsd) ? $fees.gasFeeUsd.toFixed(decimals) : '—';
	$: displayTotal = tokenAmount > 0 ? $fees.totalUsd.toFixed(decimals) : '—';
	$: tooltipContent = `${$fees.gasPriceDisplay} × gas / 4500 USD/ETH`;
</script>

<div class="fee-breakdown">
	<div class="fee-row">
		<span class="fee-label">5% Fee</span>
		<span class="fee-value">{displayFee}</span>
	</div>

	<div class="fee-row">
		<Tooltip content={tooltipContent}>
			<span class="fee-label">Gas Fee</span>
		</Tooltip>
		<span class="fee-value">{displayGasFee}</span>
	</div>

	<div class="fee-row total">
		<span class="fee-label">Total</span>
		<span class="fee-value">{displayTotal}</span>
	</div>
</div>

<style>
	.fee-breakdown {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 20px 24px;
		border: 1px solid #393939;
		border-radius: 6px;
		background: #0b0b0b;
	}

	.fee-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
		color: #e0e0e0;
	}

	.fee-label {
		color: #a0a0a0;
	}

	.fee-value {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono',
			monospace;
		font-weight: 500;
	}

	.fee-row.total {
		margin-top: 4px;
		padding-top: 12px;
		border-top: 1px solid #262626;
		font-weight: 600;
		font-size: 16px;
	}
</style>
