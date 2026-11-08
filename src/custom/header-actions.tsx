"use client";

import { PushToggle } from "./push-toggle";
import { ThemeToggle } from "./theme-toggle";

/** Replaces the "Upgrade" chip in every header (see LicenseIndicator). */
export function HeaderActions() {
	return (
		<span className="flex items-center gap-2">
			<PushToggle />
			<ThemeToggle />
		</span>
	);
}
