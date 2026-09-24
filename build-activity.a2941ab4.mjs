// Builds activity.a2941ab4.html from the deployed index.html: swaps the demo ask
// to the rock-climbing video search, drops the question card and file card,
// and mounts the Activity panel (activity.a2941ab4.js/.css) on send.
import { readFileSync, writeFileSync } from "node:fs";

const [src, out] = process.argv.slice(2);
let html = readFileSync(src, "utf8");

function swap(from, to) {
  if (!html.includes(from)) throw new Error("anchor not found: " + from.slice(0, 80));
  html = html.replace(from, to);
}

swap("</head>", '<link rel="stylesheet" href="activity.a2941ab4.css" />\n<script src="activity.a2941ab4.js"></script>\n</head>');
swap('const ASK = "Make me a HTML file";', 'const ASK = "Look up videos about rock climbing";');
swap('const SB_OPEN = "Write a single-file HTML page and hand it over";', 'const SB_OPEN = "Find rock climbing videos worth watching";');
html = html.replace(/const SB_STEPS = \[[\s\S]*?\n  \];/, `const SB_STEPS = [
    ["search", "Searching **YouTube**", "**24 results** for rock climbing", "Searching YouTube"],
    ["tag", "Filtering **full climbs**", "Kept **8**, dropped shorts and reposts", "Filtering results"],
    ["file", "Pulling **thumbnails**", "**8 videos** in Activity", "Pulling thumbnails"],
  ];`);
swap(
  'const SB_REPLY = "Done. One index.html, plain HTML and CSS, no build step. Open it in any browser and it renders as-is.";',
  'const SB_REPLY = "Here are 8 rock climbing videos, from big-wall nights on El Cap to ice and bouldering. They are lined up in Activity on the right.";'
);
html = html.replace(
  /    const pick = await askContents\(th2, gen\); if \(!alive\(gen\)\) return;\n    FILE_TITLE = [^\n]*\n/,
  "    if (window.ActivityPanel) window.ActivityPanel.run(() => alive(gen)); // the Activity panel opens and fills alongside the thread\n"
);
swap("    showFileCard(th2, gen);\n  }", "  }");
swap(
  "    if (window.closeFile) window.closeFile(); // a file popup left open from the last run",
  "    if (window.closeFile) window.closeFile(); // a file popup left open from the last run\n    if (window.ActivityPanel) window.ActivityPanel.clear();"
);
if (html.includes("askContents(th2")) throw new Error("question card still wired");
writeFileSync(out, html);
console.log("wrote", out, html.length);
