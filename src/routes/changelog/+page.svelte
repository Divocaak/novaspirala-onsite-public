<script>
	import { version } from '$app/env';
	import MarkdownIt from 'markdown-it';

	const md = new MarkdownIt();
	const source = `
### build 0.0.1, release 15. 10. 2025
#### 1) přidáno
- zobrazování titulky
    `;

	let html = $derived(md.render(source));
</script>

<h2>Changelog</h2>
<p>build:&nbsp;{version}<br /></p>
<div class="markdown">{@html html}</div>
