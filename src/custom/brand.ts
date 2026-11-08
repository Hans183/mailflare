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
	/** Transparent PNG in /public (taken from blackfire.cl). */
	logoUrl: "/brand/blackfire-logo.png",
	login: {
		title: "Ingresa tus credenciales para acceder",
	},
};
