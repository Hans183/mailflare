"use client";

import { LanguageSelector } from "@/components/language-selector";
import type { AuthShellProps } from "@/components/auth/types";
import { customBrand } from "./brand";
import { EmberBackground } from "./ember-background";
import "./auth-theme.css";

/**
 * BlackFire sign-in layout: one centered column over a black-to-ember
 * gradient with animated embers, matching blackfire.cl. Same props as the
 * stock AuthShell, which delegates here when customBrand.enabled is set.
 */
export function BrandAuthShell({ title, description, children, footer, steps }: AuthShellProps) {
	return (
		<div className="dark bf-auth relative min-h-dvh overflow-hidden text-neutral-100">
			<div aria-hidden="true" className="bf-auth-glow pointer-events-none fixed inset-0 z-0" />
			<EmberBackground />

			<main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 sm:pt-12">
				<header className="flex flex-col items-center text-center">
					<div className="bf-auth-logo relative h-52 w-52 sm:h-64 sm:w-64">
						<img
							src={customBrand.logoUrl}
							alt={`${customBrand.name} ${customBrand.tagline}`}
							className="relative h-full w-full select-none object-contain"
							draggable={false}
						/>
					</div>
					<h1 className="mt-4 text-base font-medium text-neutral-400">{title}</h1>
					{description && <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">{description}</p>}
				</header>

				<section className="mt-8 w-full">
					{steps && (
						<div className="mb-6 flex flex-wrap justify-center gap-2 text-xs font-semibold">
							{steps.map((step, index) => (
								<span key={step.label} className="flex items-center gap-2">
									<span className={step.active ? "text-orange-400" : "text-neutral-500"}>
										{index + 1} {step.label}
									</span>
									{index < steps.length - 1 && <span className="text-neutral-600">/</span>}
								</span>
							))}
						</div>
					)}
					{children}
					{footer && <div className="mt-8 text-center text-sm font-medium text-orange-400">{footer}</div>}
				</section>

				<footer className="mt-auto flex items-center justify-center pt-10 text-neutral-500">
					<LanguageSelector variant="text" />
				</footer>
			</main>
		</div>
	);
}
