import type { MetadataRoute } from "next";
import { customBrand } from "@/custom/brand";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: customBrand.enabled ? `${customBrand.name} Mail` : "Mailflare",
		short_name: customBrand.enabled ? customBrand.name : "Mailflare",
		description: "Email, anywhere.",
		id: "/",
		scope: "/",
		start_url: "/inbox",
		display: "standalone",
		background_color: customBrand.enabled ? "#050505" : "#ffffff",
		theme_color: customBrand.enabled ? "#050505" : "#ffffff",
		icons: [
			{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
			...(customBrand.enabled
				? [
					{ src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" as const },
					{ src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" as const },
				]
				: []),
		],
	};
}
