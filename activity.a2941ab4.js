// Activity panel: opens beside superbot's thread after "Look up videos about
// rock climbing" and plays one scripted run (thoughts, tool calls, videos).
// Each variant places those three event kinds differently. ?v=s1..s10|t1..t5.
(function () {
  // thought: feed | group | top | stream   tool: feed | group | ticker | nest | timeline | strip
  // video: feed | group | nest | slot | timeline   vtool (per-video fetch): none | row | overlay | scrim | line
  const VARIANTS = {
    s1: { name: "Inline trail", fam: "stack", thought: "feed", tool: "feed", video: "feed", vtool: "none" },
    s2: { name: "Reasoned cards", fam: "stack", thought: "group", tool: "group", video: "group", vtool: "row" },
    s3: { name: "Tool chips", fam: "stack", thought: "top", tool: "feed", video: "feed", vtool: "overlay" },
    s4: { name: "Collapsing steps", fam: "stack", thought: "group", tool: "group", video: "feed", vtool: "none", collapse: true },
    s5: { name: "Chat turns", fam: "stack", thought: "feed", tool: "feed", video: "feed", vtool: "none" },
    s6: { name: "Pinned thought + ticker", fam: "stack", thought: "top", tool: "ticker", video: "feed", vtool: "none" },
    s7: { name: "Skeleton fill", fam: "stack", thought: "top", tool: "feed", video: "slot", vtool: "overlay" },
    s8: { name: "Call blocks", fam: "stack", thought: "feed", tool: "feed", video: "feed", vtool: "row" },
    s9: { name: "Nested results", fam: "stack", thought: "feed", tool: "nest", video: "nest", vtool: "none" },
    s10: { name: "Scrim status", fam: "stack", thought: "feed", tool: "feed", video: "feed", vtool: "scrim" },
    t1: { name: "Stream + tool nodes", fam: "tl", thought: "stream", tool: "timeline", video: "timeline", vtool: "none" },
    t2: { name: "Tools inside entries", fam: "tl", thought: "stream", tool: "timeline", video: "timeline", vtool: "line" },
    t3: { name: "Wide thumbs", fam: "tl", thought: "stream", tool: "timeline", video: "timeline", vtool: "none", words: true },
    t4: { name: "Tool strip", fam: "tl", thought: "stream", tool: "strip", video: "timeline", vtool: "none" },
    t5: { name: "Compact", fam: "tl", thought: "stream", tool: "timeline", video: "timeline", vtool: "line" },
  };

  const VIDEOS = [
    ["Topping out above the Dordogne", "Crag Notes", "12:04", "1.2M"],
    ["Crack climbing Indian Creek, first lap", "Desert Tower", "18:37", "860K"],
    ["Sport routes on a limestone wall", "Falesia Films", "9:52", "412K"],
    ["El Cap by headlamp: a night on the wall", "Big Wall Weekly", "24:10", "2.4M"],
    ["Deep water cliffs at Phra Nang", "Tide & Chalk", "7:45", "980K"],
    ["Summit day on Island Peak", "High Camp", "31:02", "3.1M"],
    ["Frozen waterfall lead in Rjukan", "Ice Line", "14:18", "305K"],
    ["Scouting new lines on the Traindorfer Wand", "Alpine Crag", "11:26", "178K"],
  ].map(([title, channel, dur, views], i) => ({ title, channel, dur, views, id: `vid_0${i + 1}`, src: `hero-assets/climb/c${i + 1}.jpg` }));

  const FETCH_MS = [84, 112, 96, 140, 78, 122, 101, 90];
  const video = (i) => ({ t: "video", i, ms: FETCH_MS[i] });
  const SCRIPT = [
    { t: "thought", text: "They want rock climbing videos. I'll search YouTube first, then weed out the noise." },
    { t: "tool", name: "youtube.search", args: 'q: "rock climbing", max: 25', result: "24 results", ms: 900 },
    { t: "thought", text: "Lots of shorts and reposts. Keeping full climbs over five minutes, one per channel." },
    { t: "tool", name: "results.filter", args: "min: 5m, dedupe: channel", result: "8 kept", ms: 650, slots: 8 },
    { t: "tool", name: "youtube.videos", args: "ids: vid_01..vid_04", result: "4 videos", ms: 700 },
    video(0), video(1), video(2), video(3),
    { t: "thought", text: "El Cap by headlamp is the standout so far. Fetching four more, with ice and alpine in the mix." },
    { t: "tool", name: "youtube.videos", args: "ids: vid_05..vid_08", result: "4 videos", ms: 700 },
    video(4), video(5), video(6), video(7),
    { t: "tool", name: "results.rank", args: "by: views, recency", result: "sorted", ms: 520 },
    { t: "thought", text: "Eight solid picks across big wall, sport, ice and alpine. Handing them over." },
  ];

  const param = new URLSearchParams(location.search).get("v");
  const vid = VARIANTS[param] ? param : "s1";
  const cfg = VARIANTS[vid];

  // preload so a tile never lands blank
  VIDEOS.forEach((v) => { const im = new Image(); im.src = v.src; });

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  let ui = null;
  let R = null;

  function build() {
    const aside = el("aside", `act act--${cfg.fam} act--${vid}`);
    aside.setAttribute("aria-label", "Activity");
    const inner = el("div", "act-inner");
    const head = el("header", "act-head");
    const status = el("span", "act-status", "Starting");
    head.append(el("span", "act-dot"), el("span", "act-title", "Activity"), status);
    inner.append(head);
    const parts = { aside, status };
    if (cfg.thought === "top") inner.append((parts.top = el("div", "act-top")));
    if (cfg.thought === "stream") {
      parts.stream = el("div", "act-stream");
      parts.streamText = el("p");
      parts.stream.append(parts.streamText);
      inner.append(parts.stream);
    }
    if (cfg.tool === "strip") inner.append((parts.strip = el("div", "act-strip")));
    inner.append((parts.feed = el("div", "act-feed")));
    if (cfg.tool === "ticker") {
      parts.ticker = el("div", "act-ticker");
      parts.tickerRows = el("div", "act-trows");
      parts.tickerCount = el("span", "act-tcount", "0 calls");
      parts.ticker.append(parts.tickerRows, parts.tickerCount);
      inner.append(parts.ticker);
    }
    aside.append(inner);
    return parts;
  }

  // ---- primitives ----------------------------------------------------------
  function follow(smooth) {
    if (cfg.video === "slot") return;
    const f = ui.feed;
    f.scrollTo({ top: f.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  function put(parent, node) {
    parent.append(node);
    follow(true);
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add("in")));
    return node;
  }

  function stamp() {
    const s = Math.round((performance.now() - R.t0) / 1000);
    return `00:${String(s).padStart(2, "0")}`;
  }

  async function streamInto(node, text, live, inFeed) {
    if (cfg.words) {
      for (const w of text.split(/(\s+)/)) {
        if (!live()) return;
        if (!w.trim()) { if (w) node.append(document.createTextNode(w)); continue; }
        const s = el("span", "w", w);
        node.append(s);
        await nextFrame(); s.classList.add("in");
        await sleep(40);
      }
      return;
    }
    const txt = document.createTextNode("");
    const caret = el("span", "caret");
    node.append(txt, caret);
    for (let k = 2; k <= text.length + 1; k += 2) {
      if (!live()) return;
      txt.data = text.slice(0, k);
      if (inFeed) follow(false);
      await sleep(18);
    }
    caret.remove();
  }

  function toolRow(name, args, cls) {
    const row = el("div", `act-tool${cls ? " " + cls : ""}`);
    row.append(el("span", "act-ic"), el("code", "tn", name), el("span", "ta", args || ""), el("span", "tr"));
    return row;
  }

  function finishTool(row, result) {
    row.classList.add("done");
    row.querySelector(".tr").textContent = result;
  }

  function group() {
    if (!R.group) {
      const g = el("div", "act-group");
      const sum = el("div", "act-gsum");
      const label = el("span", "gl", "Working");
      sum.append(el("span", "act-ic"), label, el("span", "gchev"));
      const body = el("div", "act-gbody");
      const inner = el("div", "act-gin");
      body.append(inner);
      g.append(sum, body);
      put(ui.feed, g);
      R.group = { g, label, inner, t0: performance.now(), calls: 0 };
    }
    return R.group.inner;
  }

  function closeGroup() {
    const G = R.group;
    if (!G) return;
    R.group = null;
    if (!cfg.collapse) return;
    const secs = Math.max(1, Math.round((performance.now() - G.t0) / 1000));
    G.label.textContent = `Thought for ${secs}s` + (G.calls ? ` · ${G.calls} tool call${G.calls > 1 ? "s" : ""}` : "");
    G.g.classList.add("done", "collapsed");
  }

  function card(v, i) {
    const item = el("div", "act-item");
    const media = el("div", "act-img");
    const img = el("img");
    img.src = v.src; img.alt = v.title; img.draggable = false;
    media.append(img, el("span", "act-dur", v.dur));
    const cap = el("div", "act-cap");
    cap.append(el("b", null, v.title), el("span", null, `${v.channel} · ${v.views} views`));
    let vt = null;
    if (cfg.vtool === "overlay" || cfg.vtool === "scrim" || cfg.vtool === "line") {
      vt = el("span", "act-vt");
      vt.append(el("span", "act-ic"), el("code", "tn", "thumbnail.fetch"), el("span", "tr"));
      if (cfg.vtool === "overlay") media.append(vt);
      if (cfg.vtool === "scrim") { const s = el("div", "act-scrim"); s.append(vt); media.append(s); }
    }
    if (cfg.fam === "tl") {
      item.classList.add("act-node", "video");
      const when = el("em", "act-when");
      if (cfg.vtool === "line") when.append(vt); else when.textContent = stamp();
      cap.prepend(when);
    }
    item.append(media, cap);
    item._vt = vt;
    return item;
  }

  function makeSlots(n) {
    R.slots = [];
    for (let i = 0; i < n; i++) {
      const c = card(VIDEOS[i], i);
      c.classList.add("skel");
      const img = c.querySelector("img");
      img.dataset.src = img.getAttribute("src");
      img.removeAttribute("src");
      put(ui.feed, c);
      R.slots.push(c);
    }
  }

  // ---- event handlers --------------------------------------------------------
  async function onThought(ev, live) {
    ui.status.textContent = "Thinking";
    if (cfg.thought === "stream") {
      const p = ui.streamText;
      p.querySelectorAll(".seg.cur").forEach((s) => s.classList.remove("cur"));
      if (p.childNodes.length) p.append(document.createTextNode(" "));
      const seg = el("span", "seg cur");
      p.append(seg);
      await streamInto(seg, ev.text, live, false);
      await sleep(220);
      return;
    }
    if (cfg.thought === "top") {
      ui.top.querySelectorAll(".act-th").forEach((o) => { o.classList.remove("in"); o.classList.add("out"); setTimeout(() => o.remove(), 420); });
      const line = el("div", "act-th");
      ui.top.append(line);
      await nextFrame(); line.classList.add("in");
      await streamInto(line, ev.text, live, false);
      await sleep(220);
      return;
    }
    const th = el("div", "act-th");
    put(cfg.thought === "group" ? group() : ui.feed, th);
    await streamInto(th, ev.text, live, true);
    await sleep(200);
  }

  async function onTool(ev, live) {
    ui.status.textContent = `Calling ${ev.name}`;
    const row = toolRow(ev.name, ev.args);
    if (cfg.tool === "feed") put(ui.feed, row);
    else if (cfg.tool === "group") { put(group(), row); R.group.calls++; }
    else if (cfg.tool === "strip") put(ui.strip, row);
    else if (cfg.tool === "timeline") { const n = el("div", "act-node tool"); n.append(row); put(ui.feed, n); }
    else if (cfg.tool === "nest") {
      const n = el("div", "act-nest");
      const body = el("div", "act-nbody");
      n.append(row, body);
      put(ui.feed, n);
      R.nest = body;
    } else if (cfg.tool === "ticker") {
      ui.tickerRows.querySelectorAll(".act-tool").forEach((o) => { o.classList.remove("in"); o.classList.add("out"); setTimeout(() => o.remove(), 420); });
      R.calls++;
      ui.tickerCount.textContent = `${R.calls} call${R.calls > 1 ? "s" : ""}`;
      ui.tickerRows.append(row);
      await nextFrame(); row.classList.add("in");
    }
    await sleep(ev.ms); if (!live()) return;
    finishTool(row, ev.result);
    if (ev.slots && cfg.video === "slot") makeSlots(ev.slots);
    await sleep(200);
  }

  async function onVideo(ev, live) {
    const v = VIDEOS[ev.i];
    if (cfg.vtool === "row") {
      const row = toolRow("thumbnail.fetch", `id: ${v.id}`, "mini");
      if (cfg.video === "group") { put(group(), row); R.group.calls++; } else put(ui.feed, row);
      await sleep(ev.ms + 160); if (!live()) return;
      finishTool(row, `${ev.ms}ms`);
      await sleep(120); if (!live()) return;
    }
    let item;
    if (cfg.video === "slot" && R.slots && R.slots[ev.i]) {
      item = R.slots[ev.i];
      const img = item.querySelector("img");
      img.src = img.dataset.src;
      item.classList.remove("skel");
      ui.feed.scrollTo({ top: Math.max(0, item.offsetTop - 60), behavior: "smooth" });
    } else {
      item = card(v, ev.i);
      if (cfg.video === "group") { put(group(), item); R.group = null; }
      else if (cfg.video === "nest" && R.nest) put(R.nest, item);
      else { if (R.group) closeGroup(); put(ui.feed, item); }
    }
    if (item._vt) {
      item.classList.add("loading");
      await sleep(ev.ms + 360); if (!live()) return;
      item._vt.classList.add("done");
      item._vt.querySelector(".tr").textContent = cfg.vtool === "scrim" ? "ready" : `${ev.ms}ms`;
      item.classList.add("loaded");
    }
    R.count++;
    ui.status.textContent = `${R.count} of ${VIDEOS.length}`;
    await sleep(item._vt ? 180 : 360);
  }

  // ---- public ----------------------------------------------------------------
  async function run(live) {
    clear();
    const host = document.querySelector("#bloom-ui .bcs-main");
    if (!host) return;
    ui = build();
    R = { group: null, nest: null, slots: null, calls: 0, count: 0, t0: performance.now() };
    host.parentNode.append(ui.aside);
    await nextFrame();
    ui.aside.classList.add("open");
    await sleep(520); if (!live()) return;
    R.t0 = performance.now();
    for (const ev of SCRIPT) {
      if (!live()) return;
      if (ev.t === "thought") await onThought(ev, live);
      else if (ev.t === "tool") await onTool(ev, live);
      else await onVideo(ev, live);
    }
    if (!live()) return;
    closeGroup();
    const secs = Math.max(1, Math.round((performance.now() - R.t0) / 1000));
    ui.aside.classList.add("act--done");
    ui.status.textContent = `${VIDEOS.length} videos · ${secs}s`;
    if (ui.streamText) ui.streamText.querySelectorAll(".seg.cur").forEach((s) => s.classList.remove("cur"));
  }

  function clear() {
    document.querySelectorAll("aside.act").forEach((n) => n.remove());
  }

  window.ActivityPanel = { run, clear, variants: VARIANTS, current: vid };
})();
