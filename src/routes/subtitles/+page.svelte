<script>
	import { onMount } from 'svelte';

	let { data } = $props();

	let activeLine = $state(null);
	let connectionStatus = $state('Connecting…');
	let languages = $state([]);
	let selectedLanguage = $state('');
	let lines = $state([]);
	let loadingSubtitles = $state(false);
	let subtitleError = $state('');

	async function loadLanguage(language) {
		if (!data.event?.subtitles_name || !language) return;

		loadingSubtitles = true;
		subtitleError = '';

		try {
			const params = new URLSearchParams({ folder: data.event.subtitles_name, lang: language });
			const response = await fetch(`/api/subtitles?${params}`);

			if (!response.ok) throw new Error('Could not load this language.');
			const result = await response.json();
			languages = result.languages;
			selectedLanguage = result.language;
			lines = result.lines;
		} catch (error) {
			subtitleError = error.message;
		} finally {
			loadingSubtitles = false;
		}
	}

	onMount(() => {
		let socket;

		async function initialize() {
			if (!data.event) return;

			try {
				const response = await fetch(
					`/api/subtitles/getAvailable?folder=${encodeURIComponent(data.event.subtitles_name)}&lang=cs`
				);

				if (response.ok) {
					const result = await response.json();
					languages = result.languages;
					await loadLanguage(languages.includes('cs') ? 'cs' : languages[0]);
				} else {
					const fallback = await fetch(
						`/api/subtitles/getAvailable?folder=${encodeURIComponent(data.event.subtitles_name)}&lang=en`
					);

					if (fallback.ok) {
						const result = await fallback.json();
						languages = result.languages;
						await loadLanguage(languages[0]);
					} else subtitleError = 'No subtitle languages found.';
				}
			} catch {
				subtitleError = 'Failed to load subtitles.';
			}

			if (!data.wsUrl) {
				connectionStatus = 'WebSocket URL not configured';
				return;
			}

			socket = new WebSocket(data.wsUrl);

			socket.addEventListener('open', () => {
				connectionStatus = 'Connected';
				socket.send(JSON.stringify({ type: 'viewer', eventId: data.event.id }));
			});

			socket.addEventListener('message', (event) => {
				let message;

				try {
					message = JSON.parse(event.data);
				} catch {
					return;
				}

				if (message.type === 'activate') activeLine = message.line;
			});

			socket.addEventListener('error', () => {
				connectionStatus = 'Connection error';
			});

			socket.addEventListener('close', () => {
				connectionStatus = 'Disconnected';
			});
		}

		initialize();

		return () => socket?.close();
	});

	let displayedSubtitle = $derived(
		Number.isInteger(activeLine) && activeLine >= 0 ? (lines[activeLine] ?? '') : ''
	);
</script>

<svelte:head>
	<title>
		{data.venueLabel ? `${data.venueLabel} — Titulky` : 'Titulky'}
	</title>
</svelte:head>

{#if data.event}
	<main style:color={data.event.text_color} style:background-color={data.event.background_color}>
		<p class="venue">{data.venueLabel}</p>
		<p class="event">{data.event.label}</p>

		{#if languages.length > 0}
			<label class="language-picker">
				Language
				<select
					value={selectedLanguage}
					onchange={(event) => loadLanguage(event.currentTarget.value)}
					disabled={loadingSubtitles}
				>
					{#each languages as language}
						<option value={language}>{language.toUpperCase()}</option>
					{/each}
				</select>
			</label>
		{/if}

		{#if subtitleError}
			<p>{subtitleError}</p>
		{:else if loadingSubtitles}
			<p>Loading subtitles…</p>
		{:else}
			<div class="subtitle" aria-live="polite">
				{displayedSubtitle}
			</div>
		{/if}

		<p class="status">{connectionStatus}</p>
	</main>
{:else}
	<main>
		<p class="venue">{data.venueLabel}</p>
		<h1>No event is currently running at this venue.</h1>
	</main>
{/if}

<style>
	main {
		min-height: 100vh;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
	}

	.venue,
	.status {
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.event {
		font-size: 1rem;
		opacity: 0.8;
	}

	.language-picker {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	select {
		font: inherit;
		padding: 0.5rem;
	}

	.subtitle {
		width: 100%;
		font-size: clamp(2rem, 7vw, 5rem);
		font-weight: 600;
		line-height: 1.2;
		overflow-wrap: anywhere;
		white-space: pre-wrap;
	}
</style>
