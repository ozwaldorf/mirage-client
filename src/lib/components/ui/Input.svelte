<script lang="ts">
  export let value: string;
  export let placeholder = "";
  export let disabled = false;
  export let type = "text";
  export let className = "";
  export let width: string | null = null;
  export let warning = false;
  export let title = "";
  export let label = "";
  export let id = "";
</script>

{#if label}
  <div class="input-wrapper">
    <label for={id} class="label">{label}</label>
    <input
      {id}
      {type}
      bind:value
      {placeholder}
      {disabled}
      {title}
      class="input {warning === true ? 'warning' : ''} {className}"
      style="width: {!width ? '100%' : width}"
      on:input
    />
  </div>
{:else}
  <input
    {id}
    {type}
    bind:value
    {placeholder}
    {disabled}
    {title}
    class="input {warning === true ? 'warning' : ''} {className}"
    style="width: {!width ? '100%' : width}"
    on:input
  />
{/if}

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .label {
    font-size: 12px;
    color: #e0e0e0;
    margin-bottom: 2px;
    font-weight: 400;
    display: block;
  }

  .input {
    padding: 5px 12px;
    border: 1px solid #393939;
    border-radius: 6px;
    background: #0b0b0b;
    color: #e0e0e0;
    font-size: 14px;
    line-height: 20px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
      "Liberation Mono", monospace;
  }

  .input:focus {
    outline: none;
    border-color: #4589ff;
  }

  .input:disabled {
    background: #161616;
    color: #e0e0e0;
    cursor: default;
  }

  .input.warning {
    color: #fa4d56 !important;
  }
</style>
