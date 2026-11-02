import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Standalone Vite config for development / preview of the tool outside
// the parent monorepo embed. The parent monorepo consumes `src/index.ts`
// directly via Next.js and does not use this build artifact.
export default defineConfig({
	// The artifact is served from a sub-path by the host
	// (`/tools/history-quiz/app/`), so every asset reference in
	// `dist/index.html` has to stay relative. The default (`/`) would
	// point at the host root and 404.
	base: "./",
	plugins: [react()],
	server: {
		port: 5173,
		host: true,
	},
	preview: {
		port: 4173,
		host: true,
	},
});
