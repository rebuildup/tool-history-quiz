import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HistoryQuizApp from "./HistoryQuizApp";

// Standalone dev/preview mount point. The parent monorepo embeds
// `HistoryQuizApp` directly and does not consume this entry.
const container = document.getElementById("root");
if (!container) throw new Error("Root container #root not found");
createRoot(container).render(
	<StrictMode>
		<HistoryQuizApp />
	</StrictMode>,
);
