import { ethers } from 'ethers';
import { SEPOLIA_RPC_URL } from '../../constants';

const TRANSFER_EVENT_TOPIC = ethers.id('Transfer(address,address,uint256)');

export interface TransferData {
	transactionHash: string;
	blockNumber: number;
	amount: bigint;
	from: string;
	to: string;
}

export class TransferMonitor {
	private wsProvider: ethers.WebSocketProvider | null = null;
	private callbacks = new Map<
		string,
		{ onDetected: (data: TransferData) => void; onError: (error: Error) => void }
	>();

	async connect() {
		if (this.wsProvider) {
			return;
		}

		try {
			this.wsProvider = new ethers.WebSocketProvider(SEPOLIA_RPC_URL);
			await this.wsProvider._waitUntilReady();
			console.log('Connected to Sepolia WebSocket');
		} catch (error) {
			console.error('Failed to connect to WebSocket:', error);
			throw error;
		}
	}

	async watchTransfer(
		tokenAddress: string,
		toAddress: string,
		amount: bigint,
		onDetected: (data: TransferData) => void,
		onError: (error: Error) => void
	): Promise<string> {
		await this.connect();

		const watchKey = `${tokenAddress}-${toAddress}-${amount}`;

		if (this.callbacks.has(watchKey)) {
			console.log('Already watching this transfer');
			return watchKey;
		}

		this.callbacks.set(watchKey, { onDetected, onError });

		// Create filter for Transfer events to the specific address
		const filter = {
			address: tokenAddress,
			topics: [
				TRANSFER_EVENT_TOPIC,
				null, // from (any address)
				ethers.zeroPadValue(toAddress, 32) // to (specific address)
			]
		};

		try {
			// Listen for new Transfer events
			this.wsProvider!.on(filter, (log) => {
				try {
					// Decode the transfer amount from the log data
					const transferAmount = ethers.getBigInt(log.data);

					console.log(
						`Transfer detected: ${transferAmount} to ${toAddress} in tx ${log.transactionHash}`
					);

					// Check if amount matches
					if (transferAmount === amount) {
						const callback = this.callbacks.get(watchKey);
						if (callback && callback.onDetected) {
							callback.onDetected({
								transactionHash: log.transactionHash,
								blockNumber: log.blockNumber,
								amount: transferAmount,
								from: ethers.getAddress('0x' + log.topics[1].slice(26).toLowerCase()),
								to: toAddress
							});
						}
						// Clean up after successful detection
						this.stopWatching(watchKey);
					}
				} catch (error) {
					console.error('Error processing transfer event:', error);
					const callback = this.callbacks.get(watchKey);
					if (callback && callback.onError) {
						callback.onError(error as Error);
					}
				}
			});

			console.log(
				`Watching for transfer of ${amount} tokens to ${toAddress} on ${tokenAddress}`
			);

			return watchKey;
		} catch (error) {
			console.error('Failed to set up transfer watch:', error);
			this.callbacks.delete(watchKey);
			throw error;
		}
	}

	stopWatching(watchKey?: string) {
		if (watchKey && this.callbacks.has(watchKey)) {
			this.callbacks.delete(watchKey);
			console.log(`Stopped watching transfer: ${watchKey}`);
		}
	}

	disconnect() {
		if (this.wsProvider) {
			// Remove all listeners
			this.wsProvider.removeAllListeners();
			this.wsProvider.destroy();
			this.wsProvider = null;
			this.callbacks.clear();
			console.log('Disconnected from WebSocket');
		}
	}
}

// Singleton instance
export const transferMonitor = new TransferMonitor();
