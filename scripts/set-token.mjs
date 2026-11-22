import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const tokenArg = process.argv[2];
if (!tokenArg) {
  console.log('Usage: npm run set-token "<WorkosCursorSessionToken>"');
  console.log("Or edit src/config.ts directly and run: npm run build && npm run app:install");
  process.exit(1);
}

const token = tokenArg.trim().replace(/^WorkosCursorSessionToken=/, "");
const configPath = path.resolve("src/config.ts");
let content = fs.readFileSync(configPath, "utf-8");
content = content.replace(/sessionToken:\s*".*?"/, `sessionToken: "${token}"`);
fs.writeFileSync(configPath, content, "utf-8");

console.log(`\n✓ Token successfully saved to src/config.ts (${token.length} chars)`);
console.log("Building and deploying app to BUSY Bar...\n");

try {
  execSync("npm run build && npm run app:install && npm run app:run", { stdio: "inherit" });
  console.log("\n✓ Success! Cursor Limits is now running on your BUSY Bar.\n");
} catch (err) {
  console.error("\nNote: Make sure your BUSY Bar is connected via USB.");
}
