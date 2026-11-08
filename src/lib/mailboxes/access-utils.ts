import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { licenseSettings } from "@/db/schema";
import { customLicense } from "@/custom/license";

export async function isTeamMailboxSharingEnabled(db: AppDatabase): Promise<boolean> {
	if (customLicense.enabled) return true;
	try {
		const [license] = await db
			.select({ plan: licenseSettings.plan, state: licenseSettings.state })
			.from(licenseSettings)
			.where(eq(licenseSettings.id, "default"))
			.limit(1);

		return license?.plan === "team" && license.state === "active";
	} catch {
		return false;
	}
}
