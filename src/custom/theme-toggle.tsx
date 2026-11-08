"use client";

import { useEffect, useState } from "react";
import { readThemePreference, resolveTheme, saveThemePreference, THEME_CHANGED_EVENT } from "@/components/theme-utils";

function Sun({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className={className} aria-hidden="true">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
		</svg>
	);
}

function Moon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
			<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
		</svg>
	);
}

/**
 * Header button that flips between light and dark. It takes the place of the
 * "Upgrade" chip (see LicenseIndicator) and stays in sync with Settings →
 * Appearance through the shared theme event.
 */
export function ThemeToggle() {
	const [theme, setTheme] = useState<"light" | "dark" | null>(null);

	useEffect(() => {
		const sync = () => setTheme(resolveTheme(readThemePreference()));
		sync();
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		window.addEventListener(THEME_CHANGED_EVENT, sync);
		media.addEventListener("change", sync);
		return () => {
			window.removeEventListener(THEME_CHANGED_EVENT, sync);
			media.removeEventListener("change", sync);
		};
	}, []);

	// Render nothing until mounted so the server and client markup agree.
	if (!theme) return <span className="h-10 w-10" aria-hidden="true" />;

	const next = theme === "dark" ? "light" : "dark";
	const label = next === "dark" ? "Cambiar a tema oscuro" : "Cambiar a tema claro";

	return (
		<button
			type="button"
			onClick={() => saveThemePreference(next)}
			aria-label={label}
			title={label}
			className="bf-theme-toggle flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:border-orange-400 hover:text-orange-500"
		>
			{theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
		</button>
	);
}
