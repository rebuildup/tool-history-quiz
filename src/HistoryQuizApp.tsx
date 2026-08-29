"use client";

import { useEffect, useRef } from "react";

export default function HistoryQuizApp() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const controller = new AbortController();
		let styleElement: HTMLStyleElement | null = null;
		let scriptElement: HTMLScriptElement | null = null;
		let inputListeners: Array<{
			input: HTMLInputElement;
			keydown: (e: KeyboardEvent) => void;
			inputListener: () => void;
		}> = [];

		const setupInputListeners = () => {
			if (!containerRef.current) return;
			const inputs = Array.from(
				containerRef.current.querySelectorAll("input.blank"),
			) as HTMLInputElement[];
			inputs.forEach((input) => {
				const wrapper = document.createElement("span");
				wrapper.className = "input-wrapper";
				const parent = input.parentNode;
				if (!parent) return;
				parent.insertBefore(wrapper, input);
				wrapper.appendChild(input);

				const tooltip = document.createElement("div");
				tooltip.className = "ans-tooltip";
				const ans = input.getAttribute("data-ans");
				if (ans) {
					tooltip.innerText = ans.split("|")[0] ?? "";
				}
				wrapper.appendChild(tooltip);

				input.setAttribute("aria-label", "答えを入力");

				const keydown = (e: KeyboardEvent) => {
					if (e.key === "Enter") {
						e.preventDefault();
						const currentSection = input.closest(".quiz-section");
						if (currentSection) {
							const sectionInputs = Array.from(
								currentSection.querySelectorAll("input.blank"),
							) as HTMLInputElement[];
							const idx = sectionInputs.indexOf(input);
							if (idx >= 0 && idx < sectionInputs.length - 1) {
								sectionInputs[idx + 1]?.focus();
							}
						}
					}
				};
				input.addEventListener("keydown", keydown);

				const inputListener = () => {
					input.classList.remove("correct", "incorrect");
					wrapper.classList.remove("show-ans");
				};
				input.addEventListener("input", inputListener);
				inputListeners.push({ input, keydown, inputListener });
			});
		};

		const applyHtml = (html: string) => {
			if (controller.signal.aborted || !containerRef.current) return;

			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");
			const body = doc.body.innerHTML;
			const style = doc.querySelector("style")?.innerHTML || "";
			const script = doc.querySelector("script")?.innerHTML || "";

			styleElement = document.createElement("style");
			styleElement.textContent = style;
			document.head.appendChild(styleElement);

			if (containerRef.current) {
				containerRef.current.innerHTML = body;
			}

			scriptElement = document.createElement("script");
			scriptElement.textContent = script;
			document.body.appendChild(scriptElement);

			// Inputs are inside container — schedule on the next tick so the
			// dynamically inserted DOM is queryable.
			setTimeout(() => {
				if (!controller.signal.aborted) setupInputListeners();
			}, 0);
		};

		(async () => {
			try {
				const res = await fetch("/history-quiz.html", {
					signal: controller.signal,
				});
				const html = await res.text();
				if (controller.signal.aborted) return;
				applyHtml(html);
			} catch (err) {
				if ((err as Error).name === "AbortError") return;
				console.error("Failed to load HTML:", err);
			}
		})();

		return () => {
			controller.abort();
			inputListeners.forEach(({ input, keydown, inputListener }) => {
				input.removeEventListener("keydown", keydown);
				input.removeEventListener("input", inputListener);
			});
			inputListeners = [];
			styleElement?.remove();
			scriptElement?.remove();
		};
	}, []);

	return (
		<div
			ref={containerRef}
			style={{
				minHeight: "100vh",
			}}
		/>
	);
}
