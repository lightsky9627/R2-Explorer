import { Marked } from "marked";

const marked = new Marked({
	gfm: true,
	breaks: true,
});

// Light-weight defense in depth: strip <script> tags and inline event handlers
// after marked renders. We control the input (user's own R2 markdown files)
// so XSS risk is low, but better safe than sorry.
const SCRIPT_TAG = /<script[\s\S]*?<\/script>/gi;
const STYLE_TAG = /<style[\s\S]*?<\/style>/gi;
const EVENT_ATTR = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_HREF = /\shref\s*=\s*(["'])\s*javascript:[^"']*\1/gi;

function sanitize(html) {
	return html
		.replace(SCRIPT_TAG, "")
		.replace(STYLE_TAG, "")
		.replace(EVENT_ATTR, "")
		.replace(JAVASCRIPT_HREF, ' href="#"');
}

export const parseMarkdown = (str) => {
	if (typeof str !== "string") return "";
	const html = marked.parse(str);
	return sanitize(html);
};
