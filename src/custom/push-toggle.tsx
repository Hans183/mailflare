"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { enablePushNotifications, getPushState } from "@/lib/push/client";

type Status = "loading" | "hidden" | "off" | "on" | "blocked";

function Bell({ className, active }: { className?: string; active?: boolean }) {
	return (
		<svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
			<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
			<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
		</svg>
	);
}

function BellOff({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
			<path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
			<path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
			<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
			<path d="m2 2 20 20" />
		</svg>
	);
}

/**
 * Header bell for new-mail push notifications. One tap asks for permission and
 * subscribes this device; once on, it opens Settings → Inbox to manage it.
 * Hidden where Web Push cannot work (unsupported browser, iPhone outside the
 * installed app, or a server without VAPID keys).
 */
export function PushToggle() {
	const router = useRouter();
	const [status, setStatus] = useState<Status>("loading");
	const [message, setMessage] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			const state = await getPushState();
			if (!state.supported || !state.configured) setStatus("hidden");
			else if (state.subscribed) setStatus("on");
			else if (state.permission === "denied") setStatus("blocked");
			else setStatus("off");
		} catch {
			setStatus("hidden");
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	useEffect(() => {
		if (!message) return;
		const timer = setTimeout(() => setMessage(null), 4000);
		return () => clearTimeout(timer);
	}, [message]);

	if (status === "hidden") return null;
	if (status === "loading") return <span className="h-10 w-10" aria-hidden="true" />;

	const label =
		status === "on"
			? "Notificaciones activadas en este dispositivo"
			: status === "blocked"
				? "Notificaciones bloqueadas en el navegador"
				: "Activar notificaciones de correos nuevos";

	async function onClick() {
		if (status === "on") {
			router.push("/settings/inbox");
			return;
		}
		if (status === "blocked") {
			setMessage("Están bloqueadas: permítelas en los ajustes del navegador para este sitio.");
			return;
		}
		setStatus("loading");
		try {
			await enablePushNotifications();
			setMessage("Listo: te avisaremos cuando llegue un correo.");
		} catch (error) {
			const denied = typeof Notification !== "undefined" && Notification.permission === "denied";
			setMessage(denied ? "No se dio permiso para las notificaciones." : error instanceof Error ? error.message : "No se pudieron activar.");
		}
		await refresh();
	}

	return (
		<span className="relative">
			<button
				type="button"
				onClick={() => void onClick()}
				aria-label={label}
				title={label}
				className={
					"relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors " +
					(status === "on"
						? "border-orange-400/60 text-orange-500"
						: "border-neutral-200 text-neutral-700 hover:border-orange-400 hover:text-orange-500")
				}
			>
				{status === "blocked" ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" active={status === "on"} />}
				{status === "off" && (
					<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" aria-hidden="true" />
				)}
			</button>
			{message && (
				<span role="status" className="absolute right-0 top-12 z-50 w-64 rounded-xl bg-neutral-900 px-3 py-2 text-xs leading-5 text-white shadow-lg">
					{message}
				</span>
			)}
		</span>
	);
}
