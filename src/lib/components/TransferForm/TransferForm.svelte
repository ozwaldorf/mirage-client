<script lang="ts">
	import TokenInputs from './TokenInputs.svelte';
	import RecipientInput from './RecipientInput.svelte';
	import AmountInput from './AmountInput.svelte';
	import FeeBreakdown from './FeeBreakdown.svelte';
</script>

<div class="section">
	<div class="form-content">
		<TokenInputs />
		<RecipientInput />
		<div class="amount-row">
			<AmountInput />
			<FeeBreakdown />
		</div>
	</div>
</div>

<style>
	.section {
		padding: 16px;
		border: 1px solid #262626;
		border-radius: 6px;
		background: #161616;
	}

	.form-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.amount-row {
		display: flex;
		gap: 16px;
		align-items: stretch;
		margin-top: 8px;
	}
</style>
