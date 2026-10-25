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
	}
</style>