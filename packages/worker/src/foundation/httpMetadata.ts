// R2 only accepts these specific camelCase keys for httpMetadata. Anything
// else (e.g. the on-the-wire HTTP header names "Content-Type",
// "content-type") is silently dropped by the SDK, so we normalize incoming
// payloads from the dashboard before forwarding them to `bucket.put`.
const KNOWN_KEYS = [
	"contentType",
	"contentLanguage",
	"contentDisposition",
	"contentEncoding",
	"cacheControl",
	"cacheExpiry",
] as const;

type KnownKey = (typeof KNOWN_KEYS)[number];

const ALIASES: Record<string, KnownKey> = {
	"content-type": "contentType",
	contenttype: "contentType",
	"content-language": "contentLanguage",
	contentlanguage: "contentLanguage",
	"content-disposition": "contentDisposition",
	contentdisposition: "contentDisposition",
	"content-encoding": "contentEncoding",
	contentencoding: "contentEncoding",
	"cache-control": "cacheControl",
	cachecontrol: "cacheControl",
	"cache-expiry": "cacheExpiry",
	"cache-expires": "cacheExpiry",
	expires: "cacheExpiry",
	cacheexpiry: "cacheExpiry",
};

export function normalizeHttpMetadata(
	input: Record<string, unknown> | null | undefined,
): R2HTTPMetadata | undefined {
	if (!input || typeof input !== "object") return undefined;

	const out: Record<string, unknown> = {};
	for (const [rawKey, rawValue] of Object.entries(input)) {
		if (rawValue === undefined || rawValue === null || rawValue === "")
			continue;

		const lower = rawKey.toLowerCase();
		let target: KnownKey | undefined;
		if ((KNOWN_KEYS as readonly string[]).includes(rawKey)) {
			target = rawKey as KnownKey;
		} else if (ALIASES[lower]) {
			target = ALIASES[lower];
		}
		if (!target) continue;

		if (target === "cacheExpiry") {
			const date =
				rawValue instanceof Date ? rawValue : new Date(String(rawValue));
			if (!Number.isNaN(date.getTime())) {
				out[target] = date;
			}
			continue;
		}

		out[target] = String(rawValue);
	}

	return Object.keys(out).length > 0 ? (out as R2HTTPMetadata) : undefined;
}
