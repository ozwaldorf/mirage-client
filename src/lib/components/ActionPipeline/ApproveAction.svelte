<script lang="ts">
  import ActionItem from "./ActionItem.svelte";
  import { wallet } from "$lib/stores/wallet";
  import { form } from "$lib/stores/form";
  import { transaction } from "$lib/stores/transaction";
  import { fees } from "$lib/stores/derived";
  import { approveTokens, parseTokenAmount } from "$lib/services/ethereum/token";
  import { predictNextContractAddress } from "$lib/services/ethereum/wallet";

  $: approveTitle = getApproveTitle(
    $form.tokenSymbol,
    $form.tokenAmount,
    $fees.totalUsd,
    $fees.decimals,
  );
  $: baseFieldsFilled =
    $form.tokenContract &&
    $form.tokenAmount &&
    $fees.totalUsd > 0 &&
    $form.recipientAddress;
  $: actionStatus = baseFieldsFilled && $transaction.approveStatus === "disabled"
    ? "available"
    : baseFieldsFilled
      ? $transaction.approveStatus
      : "disabled";
  $: buttonText =
    $transaction.approveStatus === "pending"
      ? "Confirming..."
      : $transaction.approveStatus === "success"
        ? "Verified"
        : "Approve";

  function getApproveTitle(
    symbol: string,
    amount: string,
    total: number,
    decimals: number,
  ): string {
    if (!symbol) return "Approve Tokens";
    if (!amount || total === 0) return `Approve ${symbol}`;
    return `Approve ${Number(total).toFixed(decimals)} ${symbol}`;
  }

  async function handleApprove() {
    if (!$wallet.signer || !$wallet.provider || !$wallet.account) return;

    $transaction.chainId = $wallet.chainId;
    $transaction.approveStatus = "pending";

    try {
      const tokenAddress = $form.tokenContract;
      const decimals = $form.tokenDecimals ?? 18;

      const totalAmount = parseTokenAmount(
        Number($fees.totalUsd).toFixed(decimals),
        decimals,
      );

      const nonce = await $wallet.provider.getTransactionCount($wallet.account);
      const predictedEscrowAddress = predictNextContractAddress(
        $wallet.account,
        nonce + 1,
      );

      const tx = await approveTokens(
        tokenAddress,
        predictedEscrowAddress,
        totalAmount,
        $wallet.signer,
      );

      $transaction.approveTxHash = tx.hash;

      await tx.wait(1);
      $transaction.tokensApproved = true;
      $transaction.approveStatus = "success";
    } catch (error: any) {
      console.error("Approve error:", error);
      $transaction.approveStatus = "error";
    }
  }
</script>

<ActionItem
  title={approveTitle}
  {buttonText}
  status={actionStatus}
  onClick={handleApprove}
  txHash={$transaction.approveTxHash}
/>
