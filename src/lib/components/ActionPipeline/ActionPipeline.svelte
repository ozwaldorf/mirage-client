<script lang="ts">
	import ApproveAction from './ApproveAction.svelte';
	import DeployAction from './DeployAction.svelte';
	import ExecuteAction from './ExecuteAction.svelte';
	import ResetAction from './ResetAction.svelte';
</script>

<div class="actions-container">
	<ApproveAction />
	<DeployAction />
	<ExecuteAction />
	<ResetAction />
</div>

<style>
	.actions-container {
		border: 1px solid #262626;
		border-radius: 6px;
		background: #161616;
		display: flex;
		flex-direction: column;
		gap: 0;
		padding: 0;
	}
</style>
