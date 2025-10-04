<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '../ui/Button.svelte';
	import NetworkStatus from './NetworkStatus.svelte';
	import { wallet } from '$lib/stores/wallet';
	import { gas } from '$lib/stores/gas';
	import { networkKey } from '$lib/stores/network';
	import { form } from '$lib/stores/form';
	import { connectWallet, loadArtifacts } from '$lib/services/ethereum/wallet';
	import { fetchNetworkKey } from '$lib/services/mirage/nomad';

	let networkInterval: ReturnType<typeof setInterval> | null = null;
	let gasInterval: ReturnType<typeof setInterval> | null = null;

	$: buttonText = $wallet.account
		? `${$wallet.account.slice(0, 6)}...${$wallet.account.slice(-4)}`
		: 'Connect Wallet';

	async function handleConnectWallet() {
		if ($wallet.account) {
			// Copy address to clipboard
			try {
				await navigator.clipboard.writeText($wallet.account);
				// Could add a toast notification here
			} catch (error) {
				console.error('Failed to copy:', error);
			}
		} else {
			try {
				await loadArtifacts();
				const walletData = await connectWallet();

				wallet.set({
					provider: walletData.provider,
					signer: walletData.signer,
					account: walletData.account,
					chainId: (await walletData.provider.getNetwork()).chainId
						? Number((await walletData.provider.getNetwork()).chainId)
						: null
				});

				// Fetch initial gas price
				const gasPriceHex = await walletData.provider.send('eth_gasPrice', []);
				const gasPriceWei = BigInt(gasPriceHex);
				const gasPriceGwei = Number(gasPriceWei) / 1e9;
				gas.set({ gasPriceWei, gasPriceGwei });

				// Setup gas price interval
				if (gasInterval) clearInterval(gasInterval);
				gasInterval = setInterval(fetchGasPrice, 12000); // Every 12 seconds
			} catch (error: any) {
				console.error('Wallet connection error:', error);
			}
		}
	}

	async function fetchNetworkKeyStatus() {
		if (!$form.nodeApiUrl) return;

		try {
			const status = await fetchNetworkKey($form.nodeApiUrl);
			networkKey.set(status);
		} catch (error) {
			console.error('Failed to fetch network key:', error);
			networkKey.set(null);
		}
	}

	async function fetchGasPrice() {
		if (!$wallet.provider) return;

		try {
			const gasPriceHex = await $wallet.provider.send('eth_gasPrice', []);
			const gasPriceWei = BigInt(gasPriceHex);
			const gasPriceGwei = Number(gasPriceWei) / 1e9;
			gas.set({ gasPriceWei, gasPriceGwei });
		} catch (error) {
			console.error('Failed to fetch gas price:', error);
		}
	}

	onMount(async () => {
		// Try to reconnect on mount
		if (typeof globalThis.ethereum !== 'undefined') {
			try {
				const accounts = await globalThis.ethereum.request({ method: 'eth_accounts' });
				if (accounts.length > 0) {
					await handleConnectWallet();
				}
			} catch (error) {
				console.error('Reconnection failed:', error);
			}
		}

		// Setup listeners for account/chain changes
		if (typeof globalThis.ethereum !== 'undefined') {
			globalThis.ethereum.on('accountsChanged', async (accounts: string[]) => {
				if (accounts.length === 0) {
					wallet.set({ provider: null, signer: null, account: null, chainId: null });
				} else {
					await handleConnectWallet();
				}
			});

			globalThis.ethereum.on('chainChanged', () => {
				globalThis.location.reload();
			});
		}

		// Fetch network key on mount and setup interval
		await fetchNetworkKeyStatus();
		networkInterval = setInterval(fetchNetworkKeyStatus, 5000);

		// Setup gas price interval if wallet is connected
		if ($wallet.provider) {
			gasInterval = setInterval(fetchGasPrice, 12000); // Every 12 seconds
		}

		return () => {
			if (networkInterval) clearInterval(networkInterval);
			if (gasInterval) clearInterval(gasInterval);
		};
	});
</script>

<div class="header">
	<div class="header-top">
		<h1>
			<img src="/logo.png" alt="Mirage" />
			Mirage SGX Client
		</h1>
		<Button variant="wallet" onClick={handleConnectWallet}>{buttonText}</Button>
	</div>

	<NetworkStatus />
</div>

<style>
	.header {
		margin-bottom: 24px;
		padding: 16px;
		border: 1px solid #262626;
		border-radius: 6px;
		background: #161616;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		margin-right: -5px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		color: #e0e0e0;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	h1 img {
		height: 32px;
		width: 32px;
		border-radius: 6px;
	}
</style>
