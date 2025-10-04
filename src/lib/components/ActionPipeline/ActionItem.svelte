<script lang="ts">
  import type { ActionStatus } from "$lib/stores/transaction";
  import { transaction } from "$lib/stores/transaction";
  import { wallet } from "$lib/stores/wallet";
  import { getEtherscanUrl } from "$lib/constants";
  import StatusIndicator from "./StatusIndicator.svelte";
  import Button from "../ui/Button.svelte";

  export let title: string;
  export let status: ActionStatus = "available";
  export let buttonText: string;
  export let buttonVariant: "primary" | "wallet" | "reload" = "primary";
  export let buttonTitle = "";
  export let onClick: (() => void) | undefined = undefined;
  export let txHash = "";
  export let isLast = false;
  export let isReloadAction = false;

  $: hashLink = txHash
    ? `${getEtherscanUrl($transaction.chainId!)}/tx/${txHash}`
    : "";
</script>

<div class="action-item">
  {#if !isLast}
    <div class="connector" class:success={status === "success"}></div>
  {/if}

  <StatusIndicator {status} isReload={isReloadAction} />

  <div class="action-content">
    <div class="action-title" class:disabled={status === "disabled"}>
      {title}
    </div>

    <div class="action-meta">
      <div class="button-wrapper">
        <Button
          variant={buttonVariant}
          disabled={status === "disabled"}
          title={buttonTitle}
          {status}
          {onClick}
        >
          {buttonText}
        </Button>
      </div>

      {#if hashLink}
        <div class="action-hash">
          <a href={hashLink} target="_blank" rel="noopener noreferrer"
            >{txHash.slice(0, 10)}</a
          >
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .action-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 8px 16px;
    gap: 8px;
    min-height: 48px;
  }

  .connector {
    content: "";
    position: absolute;
    left: 23px;
    bottom: -11px;
    top: 36px;
    width: 2px;
    background: #262626;
  }

  .connector.success {
    background: #393939;
  }

  .action-content {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-title {
    position: relative;
    bottom: 1px;
    margin-left: 8px;
    font-size: 14px;
    font-weight: 400;
    color: #e0e0e0;
  }

  .action-title.disabled {
    color: #6f6f6f;
  }

  .action-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .button-wrapper {
    position: relative;
    bottom: 1px;
  }

  .action-hash {
    font-size: 12px;
    color: #e0e0e0;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
      "Liberation Mono", monospace;
    min-height: 20px;
    display: flex;
    align-items: center;
  }

  .action-hash a {
    color: #e0e0e0;
    text-decoration: none;
  }

  .action-hash a:hover {
    color: #82cfff;
  }
</style>
