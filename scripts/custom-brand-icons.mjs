// Regenerates the app icons (public/icon-*.png, favicon.ico) from the vector
// BlackFire logo, public/brand/blackfire.svg (CorelDRAW export: ring, flame
// with the skull cut out, then the "BlackFire Systems" lettering).
// Run after changing the logo:
//   node scripts/custom-brand-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/brand/blackfire.svg"), "utf8");

// Keep only the mark: drop the lettering (white and #CCCCCC shapes), and
// either drop the hairline ring or thicken it so it survives at icon sizes.
function markSvg({ ring }) {
	let out = svg.replace(/<(path|polygon)\b[^>]*fill="(white|#CCCCCC)"[^>]*\/>/g, "");
	out = ring
		? out.replace(/stroke-width="[^"]+"/, `stroke-width="${ring}"`)
		: out.replace(/<path\b[^>]*fill="none"[^>]*\/>/, "");
	return Buffer.from(out);
}

// Render well above the largest icon (1024 viewBox × 3), then trim the empty
// canvas so the mark fills each icon; every size is a downscale, never blurry.
async function renderMark(options) {
	return sharp(markSvg(options), { density: 216 }).trim({ threshold: 1 }).png().toBuffer();
}
const flameOnly = await renderMark({ ring: 0 });
const withRing = await renderMark({ ring: 16 });

async function square(size, padding = 0.06) {
	const inner = Math.round(size * (1 - padding * 2));
	const mark = await sharp(flameOnly).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
	return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite([{ input: mark, gravity: "center" }])
		.png()
		.toBuffer();
}

// Small transparent icons: sidebar, notifications, favicon fallback.
for (const size of [48, 96]) {
	writeFileSync(join(root, `public/icon-${size}.png`), await square(size));
	console.log(`public/icon-${size}.png`);
}

// Installed-app icons sit on black with an ember glow, so the skull reads
// black like on blackfire.cl instead of the launcher's white backing.
// `scale` is how much of the square the mark fills: maskable icons must keep
// it inside the central 80% safe zone that launchers may crop to.
async function onBlack(size, scale) {
	const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
		<defs>
			<radialGradient id="g" cx="50%" cy="100%" r="75%">
				<stop offset="0" stop-color="#7c2d12" stop-opacity="0.85"/>
				<stop offset="0.45" stop-color="#3b0d0b" stop-opacity="0.6"/>
				<stop offset="1" stop-color="#000" stop-opacity="0"/>
			</radialGradient>
		</defs>
		<rect width="100%" height="100%" fill="#050505"/>
		<rect width="100%" height="100%" fill="url(#g)"/>
	</svg>`);
	const inner = Math.round(size * scale);
	const mark = await sharp(withRing).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
	return sharp(background).composite([{ input: mark, gravity: "center" }]).png().toBuffer();
}

for (const size of [192, 512]) {
	writeFileSync(join(root, `public/icon-${size}.png`), await onBlack(size, 0.66));
	writeFileSync(join(root, `public/icon-maskable-${size}.png`), await onBlack(size, 0.52));
	console.log(`public/icon-${size}.png, public/icon-maskable-${size}.png`);
}

// favicon.ico with PNG-encoded 16, 32 and 48 px images.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((size) => square(size, 0.02)));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, i) => {
	const entry = 6 + i * 16;
	header.writeUInt8(sizes[i] % 256, entry);
	header.writeUInt8(sizes[i] % 256, entry + 1);
	header.writeUInt8(0, entry + 2);
	header.writeUInt8(0, entry + 3);
	header.writeUInt16LE(1, entry + 4);
	header.writeUInt16LE(32, entry + 6);
	header.writeUInt32LE(image.length, entry + 8);
	header.writeUInt32LE(offset, entry + 12);
	offset += image.length;
});
writeFileSync(join(root, "public/favicon.ico"), Buffer.concat([header, ...images]));
console.log("public/favicon.ico");
