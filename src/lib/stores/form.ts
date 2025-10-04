import { writable } from 'svelte/store';

export interface FormState {
	tokenContract: string;
	tokenSymbol: string;
	tokenDecimals: number | null;
	tokenAmount: string;
	recipientAddress: string;
	nodeApiUrl: string;
}

export const form = writable<FormState>({
	tokenContract: '0xd402cE7dfd5F84d33d123A9D6078DF4096239c86',
	tokenSymbol: '',
	tokenDecimals: null,
	tokenAmount: '',
	recipientAddress: '',
	nodeApiUrl: 'http://localhost:8000'
});
