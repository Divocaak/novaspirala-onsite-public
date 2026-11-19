<script>
	import favicon from '#lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Nová Spirála</title>
</svelte:head>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		font-family: sans-serif;

		background: #000;
		color: #fff;
	}

	:global(main) {
		max-width: 640px;
		margin: 0 auto;
		padding: 2rem 1.25rem;
	}

	:global(button) {
		padding: 0.9rem 1.2rem;
		border: 0;
		border-radius: 0.4rem;
		font: inherit;
		cursor: pointer;

		transition: all .15s ease-in-out;
	}

	:global(button:hover) {
		background: #444;
	}
</style>