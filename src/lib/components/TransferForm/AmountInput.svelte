<script lang="ts">
	import { form } from '$lib/stores/form';
	import { transaction } from '$lib/stores/transaction';

	$: disabled = $transaction.approveClicked || $transaction.tokensApproved;

	function validateInput(event: Event) {
		const input = event.target as HTMLInputElement;
		let value = input.value;

		// Allow only digits, one decimal point, and remove other characters
		value = value.replace(/[^\d.]/g, '');

		// Ensure only one decimal point
		const parts = value.split('.');
		if (parts.length > 2) {
			value = parts[0] + '.' + parts.slice(1).join('');
		}

		$form.tokenAmount = value;
	}
</script>

<div class="amount-wrapper">
	<input
		type="text"
		bind:value={$form.tokenAmount}
		placeholder="100"
		{disabled}
		on:input={validateInput}
		class="amount-input"
	/>
</div>

<style>
	.amount-wrapper {
		flex: 1;
	}

	.amount-input {
		width: 100%;
		font-size: 32px;
		font-weight: 500;
		padding: 50px 24px;
		border: 1px solid #393939;
		border-radius: 6px;
		background: #0b0b0b;
		color: #e0e0e0;
		text-align: center;
	}

	.amount-input:focus {
		outline: none;
		border-color: #4589ff;
		box-shadow: 0 0 0 3px rgba(69, 137, 255, 0.3);
	}

	.amount-input:disabled {
		background: #161616;
		color: #e0e0e0;
		cursor: default;
	}
</style>
