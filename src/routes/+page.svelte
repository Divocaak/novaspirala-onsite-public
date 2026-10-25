<script>
	import { onMount } from 'svelte';

	let venueLabel = $state('');
	let event = $state(null);
	let languages = $state([]);
	let loading = $state(true);
	let error = $state('');

	function getBrowserDateTime() {
		const now = new Date();
		const pad = (value) => String(value).padStart(2, '0');

		return (
			`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
			`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
		);
	}

	async function checkEvent() {
		loading = true;
		error = '';

		try {
			const params = new URLSearchParams({ now: getBrowserDateTime() });
			const response = await fetch(`/api/subtitles/getAvailable?${params.toString()}`);
			if (!response.ok) throw new Error(`Request failed: ${response.status}`);

			const result = await response.json();
			event = result.event ?? null;
			languages = result.languages ?? [];
		} catch (err) {
			console.error('Could not check available subtitles:', err);
			error = 'Could not check for a running event. Please try again.';
		} finally {
			loading = false;
		}
	}

	function openSubtitles() {
		if (!event || languages.length === 0) return;

		sessionStorage.setItem(
			'subtitleEvent',
			JSON.stringify({
				event,
				languages,
				venueLabel
			})
		);

		window.location.href = '/subtitles';
	}

	onMount(() => {
		checkEvent();
		const interval = setInterval(checkEvent, 30000);
		return () => clearInterval(interval);
	});
</script>

<main>
	<h1>Nová Spirála</h1>
	<p>Na Výstavišti</p>

	{#if event && languages.length > 0}
		<button onclick={openSubtitles}>Open subtitles for {event.label}</button>
	{/if}
</main>

<style>
	main {
		max-width: 640px;
		margin: 0 auto;
		padding: 2rem 1.25rem;
	}

	button {
		padding: 0.9rem 1.2rem;
		border: 0;
		border-radius: 0.4rem;
		background: #222;
		color: #fff;
		font: inherit;
		cursor: pointer;
	}

	button:hover {
		background: #444;
	}
</style>
