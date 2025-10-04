<script lang="ts">
	export let content: string;
	let showTooltip = false;
</script>

<div
	class="tooltip-wrapper"
	role="tooltip"
	on:mouseenter={() => (showTooltip = true)}
	on:mouseleave={() => (showTooltip = false)}
>
	<slot />
	<i class="fas fa-info-circle icon"></i>
	{#if showTooltip}
		<div class="tooltip-content">
			{content}
		</div>
	{/if}
</div>

<style>
	.tooltip-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.icon {
		color: #6f6f6f;
		font-size: 12px;
		cursor: help;
	}

	.tooltip-content {
		visibility: visible;
		opacity: 1;
		position: absolute;
		bottom: 100%;
		left: 0;
		margin-bottom: 8px;
		background: #262626;
		color: #e0e0e0;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		white-space: nowrap;
		border: 1px solid #393939;
		z-index: 1000;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono',
			monospace;
	}
</style>
