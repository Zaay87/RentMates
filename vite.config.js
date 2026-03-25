import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
    plugins: [react(), cloudflare()],
    server: {
        host: true,
        allowedHosts: ["devserver-master--rentmatesbills.netlify.app"],
    },
    preview: {
        host: true,
        allowedHosts: ["devserver-master--rentmatesbills.netlify.app"],
    },
});