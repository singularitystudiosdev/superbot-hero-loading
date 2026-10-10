/* Reopen variant 'Peek' (see peek.css). Plain browser JS, no deps. */
(function () {
  const R = (window.SBReopen = window.SBReopen || { variants: {} });
  R.variants["peek"] = { label: "Peek", mount };

  const reduced = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function mount(anchor, opts) {
    const o = opts || {};
    const question = String(o.question == null ? "" : o.question);

    anchor.classList.add("sbr-peek-host");

    const el = document.createElement("div");
    el.className = "sbr-peek" + (o.phone ? " _ph" : "");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sbr-peek-btn";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Reopen question: " + question);

    const q = document.createElement("span");
    q.className = "sbr-peek-q";
    q.textContent = question;

    // the card's own fold chevron, pointing up (as the Reopen chip's)
    const chev = document.createElement("span");
    chev.className = "sbr-peek-chev";
    chev.setAttribute("aria-hidden", "true");
    chev.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 12 12"><path d="m3 7.4 3-3 3 3"/></svg>');

    btn.appendChild(q);
    btn.appendChild(chev);
    el.appendChild(btn);

    btn.addEventListener("click", () => { if (typeof o.onReopen === "function") o.onReopen(); });

    anchor.appendChild(el);

    let timer = 0;
    let gone = false;

    // enter: commit the hidden state, then let the transition run
    if (reduced()) {
      el.classList.add("_on");
    } else {
      void el.offsetWidth;
      requestAnimationFrame(() => { if (!gone) el.classList.add("_on"); });
    }

    function remove(done) {
      clearTimeout(timer);
      if (el.parentNode) el.parentNode.removeChild(el);
      anchor.classList.remove("sbr-peek-host");
      if (typeof done === "function") done();
    }

    function unmount(done) {
      if (gone) { if (typeof done === "function") done(); return; }
      gone = true;
      if (reduced()) { remove(done); return; }
      el.classList.remove("_on");
      el.classList.add("_off");
      timer = setTimeout(() => remove(done), 280);
    }

    return { el, unmount };
  }
})();
