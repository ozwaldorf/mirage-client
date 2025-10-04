<script lang="ts">
  import Input from "../ui/Input.svelte";
  import { form } from "$lib/stores/form";
  import { networkKey } from "$lib/stores/network";
  import { wallet } from "$lib/stores/wallet";
  import { CHAIN_NAMES } from "$lib/constants";

  $: chainName = $networkKey?.chainId
    ? CHAIN_NAMES[$networkKey.chainId] || "unknown"
    : "Offline";
  $: chainMismatch =
    $wallet.chainId &&
    $networkKey?.chainId &&
    $networkKey.chainId !== $wallet.chainId;
</script>

<div class="network-status">
  <div class="node-api-group">
    <Input
      id="nodeApiUrl"
      label="Network URL"
      bind:value={$form.nodeApiUrl}
      placeholder="http://localhost:8000"
    />
  </div>

  <div class="network-info-inputs">
    <Input
      id="chain"
      label="Chain"
      value={chainName}
      disabled={true}
      title={chainMismatch ? "Chain does not match wallet" : ""}
      warning={$networkKey ? false : true}
      width="100px"
    />

    <Input
      id="key"
      label="Key"
      value={$networkKey?.prefix || ""}
      disabled={true}
      placeholder="?"
      width="150px"
    />

    <Input
      id="attested"
      label="Attested"
      value={$networkKey ? ($networkKey.attested ? "yes" : "no") : ""}
      disabled={true}
      placeholder="?"
      warning={$networkKey ? $networkKey.attested : false}
      width="42px"
    />

    <Input
      id="debug"
      label="Debug"
      value={$networkKey ? ($networkKey.debug ? "yes" : "no") : ""}
      disabled={true}
      placeholder="?"
      warning={$networkKey?.debug || false}
      width="42px"
    />
  </div>
</div>

<style>
  .network-status {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }

  .node-api-group {
    flex: 2;
  }

  .network-info-inputs {
    display: flex;
    gap: 8px;
    flex: 1;
  }
</style>
