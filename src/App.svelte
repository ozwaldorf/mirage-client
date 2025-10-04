<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import TransferForm from '$lib/components/TransferForm/TransferForm.svelte';
	import ActionPipeline from '$lib/components/ActionPipeline/ActionPipeline.svelte';
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
	/>
</svelte:head>

<div class="container">
	<Header />

	<div class="main-content">
		<div class="section">
			<TransferForm />
		</div>

		<div class="sidebar">
			<ActionPipeline />
		</div>
	</div>
</div>

<style>
	.container {
		width: 100%;
		max-width: 1150px;
	}

	.main-content {
		display: flex;
		gap: 24px;
		margin: 0;
	}

	.section {
		flex: 1;
	}

	.sidebar {
		width: 450px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	@media (max-width: 1024px) {
		.main-content {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
		}
	}
</style>
