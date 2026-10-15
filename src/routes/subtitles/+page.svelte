<script>
	import { onMount } from 'svelte';
	import { PUBLIC_SUBTITLES_WS_URL, PUBLIC_SUBTITLES_URL } from '$app/env/public';

	let event = $state(null);
	let languages = $state([]);
	let selectedLanguage = $state('');
	let venueLabel = $state('');
	let lines = $state([]);
	let activeLine = $state(0);
	let loading = $state(true);
	let error = $state('');
	let socket;

	async function loadLanguage(language) {
		if (!event || !language) return;

		selectedLanguage = language;
		error = '';

		try {
			const params = new URLSearchParams({
				folder: event.subtitles_name,
				lang: language
			});

			const response = await fetch(`/api/subtitles/getFile?${params}`);

			if (!response.ok) {
				throw new Error(`Subtitle request failed: ${response.status}`);
			}

			const content = await response.text();
			lines = content.split(/\r?\n/);
		} catch (err) {
			console.error('Could not load subtitle file:', err);
			lines = [];
			error = 'Could not load this language.';
		}
	}

	function connectWebSocket(eventId) {
		if (socket) {
			socket.close();
		}

		if (!PUBLIC_SUBTITLES_WS_URL) {
			error = 'The WebSocket URL is not configured.';
			console.error('PUBLIC_SUBTITLES_WS_URL is empty.');
			return;
		}

		socket = new WebSocket(PUBLIC_SUBTITLES_WS_URL);

		socket.addEventListener('open', () => {
			socket.send(
				JSON.stringify({
					type: 'viewer',
					eventId
				})
			);
		});

		socket.addEventListener('message', (message) => {
			try {
				const data = JSON.parse(message.data);

				if (data.type === 'activate') {
					activeLine = Number(data.line) || 0;
				}
			} catch (err) {
				console.error('Invalid WebSocket message:', err);
			}
		});

		socket.addEventListener('error', (err) => {
			console.error('Subtitle WebSocket error:', err);
			error = 'Could not connect to the live subtitles.';
		});

		socket.addEventListener('close', (closeEvent) => {
			console.info('Subtitle WebSocket closed:', {
				code: closeEvent.code,
				reason: closeEvent.reason,
				wasClean: closeEvent.wasClean
			});
		});
	}

	function handleLanguageChange(event) {
		loadLanguage(event.currentTarget.value);
	}

	onMount(() => {
		const saved = sessionStorage.getItem('subtitleEvent');

		if (!saved) {
			window.location.replace('/');
			return;
		}

		try {
			const result = JSON.parse(saved);

			event = result.event ?? null;
			languages = result.languages ?? [];
			venueLabel = result.venueLabel ?? '';

			if (!event || !event.id || !event.subtitles_name || languages.length === 0) {
				window.location.replace('/');
				return;
			}

			const defaultLanguage = languages.includes('cs') ? 'cs' : languages[0];

			selectedLanguage = defaultLanguage;

			// Fetch only the selected TXT file.
			loadLanguage(defaultLanguage);

			// Join the existing event room on the WebSocket server.
			connectWebSocket(event.id);
		} catch (err) {
			console.error('Could not initialize subtitles:', err);
			window.location.replace('/');
		} finally {
			loading = false;
		}

		return () => {
			if (socket) {
				socket.close();
			}
		};
	});

	let currentText = $derived(activeLine > 0 ? (lines[activeLine] ?? '') : '');
</script>

<svelte:head>
	<title>Live subtitles</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{#if loading}
	<main>
		<p>Loading subtitles…</p>
	</main>
{:else if event}
	<main>
		<header>
			<a href="/">Back</a>

			<div class="event-info">
				{#if venueLabel}
					<p class="venue">{venueLabel}</p>
				{/if}

				<h1>{event.label}</h1>
			</div>

			{#if languages.length > 1}
				<label>
					Language

					<select value={selectedLanguage} onchange={handleLanguageChange}>
						{#each languages as language}
							<option value={language}>
								{language.toUpperCase()}
							</option>
						{/each}
					</select>
				</label>
			{/if}
		</header>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<section aria-live="polite" aria-atomic="true">
			{#if currentText}
				<p>{currentText}</p>
			{/if}
		</section>
	</main>
{/if}

<style>
	:global(body) {
		margin: 0;
		font-family: sans-serif;
	}

	main {
		min-height: 100vh;
		box-sizing: border-box;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
        color: white;
        background-color: black;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.event-info {
		flex: 1;
		min-width: 160px;
	}

	.venue {
		margin: 0 0 0.3rem;
		opacity: 0.7;
	}

	h1 {
		margin: 0;
		font-size: 1.25rem;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	select {
		max-width: 100%;
		font: inherit;
		padding: 0.4rem;
	}

	section {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	section p {
		max-width: 1100px;
		font-size: clamp(1.8rem, 5vw, 4rem);
		line-height: 1.35;
		white-space: pre-wrap;
	}

	a {
		color: inherit;
	}

	.error {
		text-align: center;
	}
</style>
