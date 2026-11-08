/* Synced lyrics for the KCYM Anthem (timings from KCYM_Anthem.lrc).

   [data-lyrics]          lyrics box: filled from LYRICS when empty (or parsed from
                          its <p>/<br> markup), one highlighted line as the song plays.
   [data-lyrics-audio]    CSS selector of the <audio> to follow; defaults to the
                          nearest <audio> inside an ancestor.
   [data-lyrics-current]  button showing the active line ([data-lyrics-line]) while
                          playing, [data-lyrics-idle] otherwise.
   [data-lyrics-open]     opens #lyrics-modal; [data-lyrics-close] / Esc / backdrop closes.
   [data-lyrics-toggle]   play/pause button for the followed audio. */
(function () {
  var LYRICS = [["ക്രൈസ്തവ ധര്‍മ്മ പതാകയതെന്തി", "സ്നേഹത്തിന്‍ പുതു കാഹളമൂതി", "മോചകനെശുവിന്‍ അണികളില്‍ ഉയരും", "ശക്തി തരംഗം കെ സി വൈ എം"], ["യുവശക്തി ഇതു യുഗശക്തി", "മാനവമോചന രണശക്തി", "മനുഷ്യ മനസ്സില്‍ ഉറങ്ങും ദൈവ", "മഹത്വ മുനര്‍ത്തും പുതുശക്തി"], ["വില ഇടിയാതൊരു വിജ്ഞാനത്താല്‍", "അടി പതറാതൊരു വിശ്വാസത്താല്‍", "പൂര്‍ണ മനുഷ്യന്‍ പൂര്‍ണ സമൂഹം", "പടുതുയര്‍ത്തും യുവശക്തി"], ["അധര്‍മ്മമെന്നും അമര്ത്തിടാന്‍", "സമ്രുദി എങ്ങും ഉണര്‍ത്തിടാന്‍", "സാഹോദര്യം സഹകരണം", "പടവാളാകു യുവശക്തി"], ["യുവശക്തി ഇതു യുഗശക്തി", "കെ സി വൈ എം യുവശക്തി", "കെ സി വൈ എം യുവശക്തി", "കെ സി വൈ എം യുവശക്തി"]];
  var TIMES = [7.48, 10.84, 14.34, 17.81, 21.21, 28.08, 31.48, 34.73, 38.26, 41.81, 45.09, 48.51, 52.0, 55.31, 58.74, 61.97, 65.82, 72.53, 76.01, 79.4];
  var LINES = [].concat.apply([], LYRICS);

  var registry = []; // {audio, ctrls[]}

  function entryFor(audio) {
    for (var i = 0; i < registry.length; i++) if (registry[i].audio === audio) return registry[i];
    var e = { audio: audio, ctrls: [], current: -2 };
    registry.push(e);
    function update() {
      var t = audio.currentTime, idx = -1;
      for (var i = 0; i < TIMES.length; i++) if (t >= TIMES[i]) idx = i;
      if (idx === e.current) return;
      e.current = idx;
      e.ctrls.forEach(function (c) { c.set(idx); });
    }
    function icons() {
      e.ctrls.forEach(function (c) { if (c.playing) c.playing(!audio.paused); });
    }
    ["timeupdate", "seeked", "play"].forEach(function (ev) { audio.addEventListener(ev, update); });
    audio.addEventListener("play", icons);
    audio.addEventListener("pause", icons);
    audio.addEventListener("ended", function () { e.current = -2; e.ctrls.forEach(function (c) { c.set(-1); }); icons(); });
    return e;
  }

  function findAudio(el) {
    var sel = el.getAttribute("data-lyrics-audio");
    if (sel) return document.querySelector(sel);
    var n = el.parentElement, a = null;
    while (n && !(a = n.querySelector("audio"))) n = n.parentElement;
    return a;
  }

  function initBox(box) {
    var audio = findAudio(box);
    if (!audio) return;
    var lines = [];
    var ps = box.querySelectorAll("p");
    if (ps.length) {
      ps.forEach(function (p) {
        var parts = p.innerHTML.split(/<br\s*\/?>/i);
        p.innerHTML = "";
        parts.forEach(function (txt) { var s = document.createElement("span"); s.className = "lyric-line"; s.innerHTML = txt.trim(); p.appendChild(s); lines.push(s); });
      });
    } else {
      LYRICS.forEach(function (st) {
        var p = document.createElement("p");
        st.forEach(function (txt) { var s = document.createElement("span"); s.className = "lyric-line"; s.textContent = txt; p.appendChild(s); lines.push(s); });
        box.appendChild(p);
      });
    }
    if (lines.length !== TIMES.length) return;
    lines.forEach(function (el, i) {
      el.tabIndex = 0; el.setAttribute("role", "button");
      function seek() { audio.currentTime = TIMES[i]; audio.play(); }
      el.addEventListener("click", seek);
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seek(); } });
    });
    var userScrollUntil = 0;
    ["wheel", "touchmove"].forEach(function (ev) { box.addEventListener(ev, function () { userScrollUntil = Date.now() + 3000; }, { passive: true }); });
    entryFor(audio).ctrls.push({
      set: function (idx) {
        box.classList.toggle("lyrics-live", idx >= 0);
        lines.forEach(function (el, i) { el.classList.toggle("active", i === idx); });
        if (idx < 0 || box.scrollHeight <= box.clientHeight + 2 || Date.now() < userScrollUntil) return;
        var b = box.getBoundingClientRect(), l = lines[idx].getBoundingClientRect();
        if (!b.height) return;
        box.scrollTo({ top: box.scrollTop + (l.top - b.top) - (b.height - l.height) / 2, behavior: "smooth" });
      }
    });
  }

  function initCurrent(btn) {
    var audio = findAudio(btn); if (!audio) return;
    var line = btn.querySelector("[data-lyrics-line]"), idle = btn.querySelector("[data-lyrics-idle]");
    entryFor(audio).ctrls.push({
      set: function (idx) {
        var on = idx >= 0;
        if (on) line.textContent = LINES[idx];
        line.classList.toggle("hidden", !on);
        idle.classList.toggle("hidden", on);
      }
    });
  }

  function initToggle(btn) {
    var audio = findAudio(btn); if (!audio) return;
    var play = btn.querySelector("[data-icon-play]"), pause = btn.querySelector("[data-icon-pause]");
    btn.addEventListener("click", function () { if (audio.paused) audio.play(); else audio.pause(); });
    entryFor(audio).ctrls.push({
      set: function () {},
      playing: function (p) {
        play.classList.toggle("hidden", p); pause.classList.toggle("hidden", !p);
        btn.setAttribute("aria-label", p ? "Pause" : "Play");
      }
    });
  }

  function initModal() {
    var modal = document.getElementById("lyrics-modal"); if (!modal) return;
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      modal.classList.remove("hidden"); modal.classList.add("flex");
      document.body.style.overflow = "hidden";
      var active = modal.querySelector(".lyric-line.active"), box = modal.querySelector("[data-lyrics]");
      if (active && box) {
        var b = box.getBoundingClientRect(), l = active.getBoundingClientRect();
        box.scrollTop += (l.top - b.top) - (b.height - l.height) / 2;
      }
      var c = modal.querySelector("[data-lyrics-close]"); if (c) c.focus();
    }
    function close() {
      modal.classList.add("hidden"); modal.classList.remove("flex");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.querySelectorAll("[data-lyrics-open]").forEach(function (b) { b.addEventListener("click", open); });
    modal.querySelectorAll("[data-lyrics-close]").forEach(function (b) { b.addEventListener("click", close); });
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.classList.contains("hidden")) close(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-lyrics]").forEach(initBox);
    document.querySelectorAll("[data-lyrics-current]").forEach(initCurrent);
    document.querySelectorAll("[data-lyrics-toggle]").forEach(initToggle);
    initModal();
  });
})();
