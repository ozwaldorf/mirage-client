import { writable } from 'svelte/store';
import type { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface WalletState {
	provider: BrowserProvider | null;
	signer: JsonRpcSigner | null;
	account: string | null;
	chainId: number | null;
}

export const wallet = writable<WalletState>({
	provider: null,
	signer: null,
	account: null,
	chainId: null
});
