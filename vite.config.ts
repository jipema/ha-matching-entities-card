import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(() => {
  // @ts-expect-error process env
  const isDev = !!process.env.IS_DEV;

  return {
    plugins: [react()],
    build: {
      sourcemap: false,
      rollupOptions: {
        input: isDev ? "./src/index.dev.ts" : "./src/index.build.ts",
        output: {
          entryFileNames: "ha-matching-entities.js",
        },
      },
    },
  };
});
