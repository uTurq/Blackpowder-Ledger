import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import type { Plugin } from "vite";

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

/**
 * Writes `sw.js` into the build output with a precache list of every emitted
 * file and a version hash of their contents.
 */
export function serviceWorker(): Plugin {
  let outDir = "dist";
  let root = process.cwd();
  return {
    name: "blackpowder-service-worker",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const files = (await listFiles(outDir))
        .map((file) => relative(outDir, file).split(sep).join("/"))
        .filter((file) => file !== "sw.js" && !file.endsWith(".map"))
        .sort();
      const hash = createHash("sha256");
      for (const file of files) {
        hash.update(file);
        hash.update(await readFile(join(outDir, file)));
      }
      const precache = ["./", ...files.filter((file) => file !== "index.html")];
      const template = await readFile(resolve(root, "pwa/service-worker.js"), "utf8");
      await writeFile(
        join(outDir, "sw.js"),
        template
          .replace("__BUILD_VERSION__", hash.digest("hex").slice(0, 12))
          .replace("__PRECACHE_URLS__", JSON.stringify(precache, null, 2)),
      );
    },
  };
}
