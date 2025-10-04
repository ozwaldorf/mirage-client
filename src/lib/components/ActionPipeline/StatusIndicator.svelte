<script lang="ts">
  import type { ActionStatus } from "$lib/stores/transaction";
  import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
  import {
    faRotate,
    faChevronRight,
    faCheck,
    faXmark,
  } from "@fortawesome/free-solid-svg-icons";

  export let status: ActionStatus = "disabled";
  export let isReload = false;
</script>

<div class="indicator {status}" class:reload={isReload}>
  {#if status === "pending"}
    <div class="pulse"></div>
  {:else if isReload && status === "available"}
    <FontAwesomeIcon icon={faRotate} size="xs" />
  {:else if status === "available"}
    <FontAwesomeIcon icon={faChevronRight} size="xs" />
  {:else if status === "success"}
    <FontAwesomeIcon icon={faCheck} size="xs" />
  {:else if status === "error"}
    <FontAwesomeIcon icon={faXmark} size="xs" />
  {/if}
</div>

<style>
  .indicator {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    z-index: 1;
    flex-shrink: 0;
    position: relative;
    background: #0b0b0b;
  }

  .indicator.disabled {
    width: 10px;
    height: 10px;
    margin: 3px;
    border-color: #393939;
  }

  .indicator.available {
    border-color: #4589ff;
    color: #4589ff;
  }

  .indicator.available.reload {
    border-color: #e0e0e0;
    color: #e0e0e0;
  }

  .indicator.pending {
    border-color: #fddc69;
    color: #fddc69;
  }

  .indicator.success {
    border-color: #42be65;
    color: #42be65;
  }

  .indicator.error {
    border-color: #fa4d56;
    color: #fa4d56;
  }

  .pulse {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fddc69;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      background-color: #fddc69;
    }
    50% {
      background-color: #0b0b0b;
    }
  }
</style>
