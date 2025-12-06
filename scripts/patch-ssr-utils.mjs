import fs from "node:fs";
import path from "node:path";

const chunksRoot = ".output/server/chunks";

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (!full.endsWith(".mjs")) continue;

    let code = fs.readFileSync(full, "utf8");

    // This is the buggy import the Discord folks were seeing:
    //   import "@tanstack/router-core/ssr/server";
    //
    // We want to replace it with a proper named import:
    //   import { attachRouterServerSsrUtils } from "@tanstack/router-core/ssr/server";
    const bareImport = 'import "@tanstack/router-core/ssr/server";';
    const fixedImport =
      'import { attachRouterServerSsrUtils } from "@tanstack/router-core/ssr/server";';

    if (code.includes(bareImport) && !code.includes(fixedImport)) {
      console.log(`Patching SSR utils import in: ${full}`);
      code = code.replace(bareImport, fixedImport);
      fs.writeFileSync(full, code, "utf8");
    }
  }
}

walk(chunksRoot);
