<script>
	import { version } from '$app/env';
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<footer>
	<p class="signature">
		Designed, coded & maintained by
		<a href="https://divokyvojtech.cz/" target="_blank">Vojtěch Divoký</a><br />
		build:&nbsp;{version} <br />
		<a href="/changelog">Changelog</a>
	</p>
</footer>

<style>
	footer {
		margin-top: 200px;
		text-align: end;
		font-size: xx-small;
	}
</style>
