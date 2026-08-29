import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Standalone Vite config for development / preview of the tool outside
// the parent monorepo embed. The parent monorepo consumes `src/index.ts`
// directly via Next.js and does not use this build artifact.
export default defineConfig({
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
