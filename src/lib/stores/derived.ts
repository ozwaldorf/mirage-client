import { derived } from 'svelte/store';
import { form } from './form';
import { gas } from './gas';

export const fees = derived([form, gas], ([$form, $gas]) => {
	const tokenAmount = parseFloat($form.tokenAmount) || 0;
	const ethToUsdRate = 4500;
	const decimals = $form.tokenDecimals ?? 2;

	// Calculate 5% fee
	const feeUsd = tokenAmount * 0.05;

	// Convert BigInt to number explicitly for gas calculations
	const gasPriceWeiNum = Number($gas.gasPriceWei);
	const gasCostEth = (gasPriceWeiNum * 1056000) / 1e18;

	// Convert gas cost to USD
	const gasFeeUsd = gasCostEth * ethToUsdRate;

	// Total reward is fee + gas
	const rewardUsd = feeUsd + gasFeeUsd;

	// Total amount
	const totalUsd = tokenAmount + rewardUsd;

	return {
		feeUsd: Number(feeUsd),
		gasFeeUsd: Number(gasFeeUsd),
		rewardUsd: Number(rewardUsd),
		totalUsd: Number(totalUsd),
		decimals: Number(decimals),
		gasPriceDisplay:
			$gas.gasPriceGwei < 0.01
				? `${($gas.gasPriceGwei * 1000).toFixed(2)} mwei`
				: `${$gas.gasPriceGwei.toFixed(1)} gwei`
	};
});
