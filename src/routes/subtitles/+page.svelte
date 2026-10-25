<script>
	import { onMount, tick } from 'svelte';
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
	let subtitleSection = $state();
	let subtitleElement = $state();

	let fitRequest = 0;

	const MAX_FONT_SIZE = 40;
	const MIN_FONT_SIZE = 1;
	const FONT_FIT_ITERATIONS = 14;

	let currentText = $derived(activeLine > 0 ? (lines[activeLine] ?? '') : '');

	async function loadLanguage(language) {
		if (!event || !language) return;

		selectedLanguage = language;
		error = '';

		try {
			const params = new URLSearchParams({ folder: event.subtitles_name, lang: language });
			const response = await fetch(`/api/subtitles/getFile?${params}`);
			if (!response.ok) throw new Error(`Subtitle request failed: ${response.status}`);
			lines = (await response.text()).split(/\r?\n/);
		} catch (err) {
			console.error('Could not load subtitle file:', err);
			lines = [];
			error = 'Could not load this language.';
		}
	}

	function connectWebSocket(eventId) {
		if (socket) socket.close();

		if (!PUBLIC_SUBTITLES_WS_URL) {
			error = 'The WebSocket URL is not configured.';
			console.error('PUBLIC_SUBTITLES_WS_URL is empty.');
			return;
		}

		socket = new WebSocket(PUBLIC_SUBTITLES_WS_URL);
		socket.addEventListener('open', () => {
			socket.send(JSON.stringify({ type: 'viewer', eventId }));
		});

		socket.addEventListener('message', (message) => {
			try {
				const data = JSON.parse(message.data);
				if (data.type === 'activate') activeLine = Number(data.line) || 0;
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

			loadLanguage(defaultLanguage);
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
				socket = undefined;
			}
		};
	});

	async function fitSubtitle() {
		const request = ++fitRequest;
		await tick();

		if (request !== fitRequest) return;
		const section = subtitleSection;
		const element = subtitleElement;

		if (!section || !element) return;
		const availableHeight = section.clientHeight;
		const availableWidth = element.clientWidth;

		if (!availableWidth || !availableHeight) return;
		let low = MIN_FONT_SIZE;
		let high = MAX_FONT_SIZE;
		let best = MIN_FONT_SIZE;

		for (let i = 0; i < FONT_FIT_ITERATIONS; i++) {
			const middle = (low + high) / 2;
			element.style.fontSize = `${middle}px`;

			const fits =
				element.scrollWidth <= element.clientWidth && element.scrollHeight <= availableHeight;
			if (fits) {
				best = middle;
				low = middle;
			} else {
				high = middle;
			}
		}

		element.style.fontSize = `${best}px`;
	}

	// Refit when the subtitle or its rendered element changes.
	$effect(() => {
		currentText;
		subtitleSection;
		subtitleElement;

		fitSubtitle();
	});

	// Handle viewport changes, including device rotation.
	$effect(() => {
		const section = subtitleSection;
		if (!section) return;
		const observer = new ResizeObserver(fitSubtitle);
		observer.observe(section);

		window.addEventListener('resize', fitSubtitle);
		window.addEventListener('orientationchange', fitSubtitle);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', fitSubtitle);
			window.removeEventListener('orientationchange', fitSubtitle);
		};
	});
</script>

{#if loading}
	<main>
		<p>Loading subtitles…</p>
	</main>
{:else if event}
	<main>
		<header>
			<a href="/">Back</a>

			{#if languages.length > 1}
				<select value={selectedLanguage} onchange={handleLanguageChange}>
					{#each languages as language}
						<option value={language}>
							{language.toUpperCase()}
						</option>
					{/each}
				</select>
			{/if}
		</header>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<section bind:this={subtitleSection} aria-live="polite" aria-atomic="true">
			{#if currentText}
				<p bind:this={subtitleElement}>{currentText}</p>
			{/if}
		</section>
	</main>
{/if}

<style>
	:global(html),
	:global(body) {
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		background: black;
		overflow: hidden;
	}

	:global(body) {
		position: fixed;
		inset: 0;
	}

	:global(*) {
		box-sizing: border-box;
	}

	main {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		padding: 1.25rem;
		overflow: hidden;
		color: white;
		background: black;
	}

	header {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
	}

	select {
		max-width: 100%;
		padding: 0.4rem;
		font: inherit;
	}

	section {
		display: flex;
		flex: 1 1 0;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		text-align: center;
	}

	section p {
		width: 100%;
		max-width: 1100px;
		margin: 0;
		font-size: 1px;
		line-height: 1.15;
		white-space: pre-wrap;
		overflow-wrap: normal;
		word-break: keep-all;
		hyphens: none;
	}

	a {
		color: inherit;
	}

	.error {
		flex: 0 0 auto;
		text-align: center;
	}
</style>
