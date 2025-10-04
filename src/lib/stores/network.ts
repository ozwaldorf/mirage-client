import { writable } from 'svelte/store';

export interface NetworkKeyStatus {
	chainId: number;
	prefix: string;
	attested: boolean;
	debug: boolean;
}

export const networkKey = writable<NetworkKeyStatus | null>(null);
