<script>
	import { version } from '$app/env';
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<a href="/changelog" target="_blank">changelog</a>
<p>build {version}</p>
