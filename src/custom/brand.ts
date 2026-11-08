/**
 * BlackFire customizations for the sign-in screens.
 *
 * Kept in its own folder so upstream updates rarely conflict: the shared
 * components only read these values. Set `enabled` to false to fall back to
 * the stock Mailflare look.
 */
export const customBrand = {
	enabled: true,
	name: "BlackFire",
	tagline: "Systems",
	/**
	 * Full vector logo (mark + "BlackFire Systems" lettering, white text for
	 * dark backgrounds). App icons are generated from it by
	 * scripts/custom-brand-icons.mjs.
	 */
	logoUrl: "/brand/blackfire.svg",
	login: {
		title: "Ingresa tus credenciales para acceder",
	},
};
