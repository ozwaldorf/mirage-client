<script lang="ts">
  import type { ActionStatus } from "$lib/stores/transaction";
  import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
  import { faWallet } from "@fortawesome/free-solid-svg-icons";

  export let variant: "primary" | "wallet" | "reload" = "primary";
  export let status: ActionStatus = "available";
  export let disabled = false;
  export let title = "";
  export let onClick: (() => void) | undefined = undefined;
</script>

<button class="btn {variant} {status}" {disabled} {title} on:click={onClick}>
  {#if variant === "wallet"}
    <span class="wallet-icon">
      <FontAwesomeIcon icon={faWallet} size="sm" />
    </span>
  {/if}
  <slot />
</button>

<style>
  .btn {
    padding: 4px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 12px;
    border: 1px solid;
    transition: background-color 0.2s;
    min-width: 80px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn:disabled {
    cursor: not-allowed;
    background: #0b0b0b !important;
    color: #6f6f6f !important;
    border-color: #393939 !important;
  }

  /* Wallet variant */
  .btn.wallet {
    font-size: 14px;
    padding: 8px 12px;
    background: #0b0b0b;
    color: #4589ff;
    border-color: #4589ff;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
      "Liberation Mono", monospace;
  }

  .btn.wallet:hover:not(:disabled) {
    background: rgba(69, 137, 255, 0.1);
  }

  /* Reload variant */
  .btn.reload {
    background: #0b0b0b;
    color: #e0e0e0;
    border-color: #e0e0e0;
  }

  .btn.reload:hover:not(:disabled) {
    background: rgba(224, 224, 224, 0.1);
  }

  /* Primary variant - available status */
  .btn.primary.available {
    background: #0b0b0b;
    color: #4589ff;
    border-color: #4589ff;
  }

  .btn.primary.available:hover:not(:disabled) {
    background: rgba(69, 137, 255, 0.1);
  }

  /* Primary variant - pending status */
  .btn.primary.pending {
    background: #0b0b0b;
    color: #fddc69;
    border-color: #fddc69;
  }

  /* Primary variant - success status */
  .btn.primary.success {
    background: #0b0b0b;
    color: #42be65;
    border-color: #42be65;
  }

  /* Primary variant - error status */
  .btn.primary.error {
    background: #0b0b0b;
    color: #fa4d56;
    border-color: #fa4d56;
  }

  .wallet-icon {
    display: flex;
    align-items: center;
  }
</style>
