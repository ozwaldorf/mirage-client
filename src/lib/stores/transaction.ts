import { writable } from 'svelte/store';

export type ActionStatus = 'disabled' | 'available' | 'pending' | 'success' | 'error';

export interface TransactionState {
  tokensApproved: boolean;
  escrowAddress: string | null;
  approveStatus: ActionStatus;
  deployStatus: ActionStatus;
  executeStatus: ActionStatus;
  approveTxHash: string;
  deployTxHash: string;
  submitTxHash: string;
  chainId: number | null;
}

export const transaction = writable<TransactionState>({
  tokensApproved: false,
  escrowAddress: null,
  approveStatus: 'disabled',
  deployStatus: 'disabled',
  executeStatus: 'disabled',
  approveTxHash: '',
  deployTxHash: '',
  submitTxHash: '',
  chainId: null
});
