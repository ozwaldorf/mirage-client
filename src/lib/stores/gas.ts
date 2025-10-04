import { writable } from 'svelte/store';

export interface GasState {
	gasPriceWei: bigint;
	gasPriceGwei: number;
}

export const gas = writable<GasState>({
	gasPriceWei: BigInt(Math.round(1.6 * 1e9)),
	gasPriceGwei: 1.6
});
