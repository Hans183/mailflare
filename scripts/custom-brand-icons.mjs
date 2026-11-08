// Regenerates the app icons (public/icon-*.png, favicon.ico) from the
// BlackFire logo in public/brand. Run after changing the logo:
//   node scripts/custom-brand-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public/brand/blackfire-logo.png");

// The logo sits in a lot of transparent padding; trim it so the mark fills the icon.
const trimmed = await sharp(readFileSync(source)).trim({ threshold: 1 }).png().toBuffer();

async function square(size, padding = 0.06) {
	const inner = Math.round(size * (1 - padding * 2));
	const mark = await sharp(trimmed).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
	return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite([{ input: mark, gravity: "center" }])
		.png()
		.toBuffer();
}

for (const size of [48, 96, 192, 512]) {
	writeFileSync(join(root, `public/icon-${size}.png`), await square(size));
	console.log(`public/icon-${size}.png`);
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
