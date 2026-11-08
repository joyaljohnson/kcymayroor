/* Synced lyrics for the KCYM Anthem.
   Any element with [data-lyrics] holds the lyrics as <p> stanzas whose lines are
   separated by <br>. They are split into line spans, timed from LYRIC_TIMES and
   highlighted as the nearest <audio> inside the same panel plays. */
(function () {
  // Start time (seconds) of each lyric line, from KCYM_Anthem.lrc
  var LYRIC_TIMES = [
    7.48, 10.84, 14.34, 17.81,
    21.21, 28.08, 31.48, 34.73,
    38.26, 41.81, 45.09, 48.51,
    52.00, 55.31, 58.74, 61.97,
    65.82, 72.53, 76.01, 79.40
  ];

  function init(box) {
    var audio = null, node = box.parentElement;
    while (node && !(audio = node.querySelector("audio"))) node = node.parentElement;
    if (!audio) return;

    var lines = [];
    box.querySelectorAll("p").forEach(function (p) {
      var parts = p.innerHTML.split(/<br\s*\/?>/i);
      p.innerHTML = "";
      parts.forEach(function (txt) {
        var s = document.createElement("span");
        s.className = "lyric-line";
        s.innerHTML = txt.trim();
        p.appendChild(s);
        lines.push(s);
      });
    });
    if (lines.length !== LYRIC_TIMES.length) return; // lyrics changed: leave plain text

    lines.forEach(function (el, i) {
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      function seek() { audio.currentTime = LYRIC_TIMES[i]; audio.play(); }
      el.addEventListener("click", seek);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seek(); }
      });
    });

    var current = -1, userScrollUntil = 0;
    ["wheel", "touchmove"].forEach(function (ev) {
      box.addEventListener(ev, function () { userScrollUntil = Date.now() + 3000; }, { passive: true });
    });

    function indexAt(t) {
      var idx = -1;
      for (var i = 0; i < LYRIC_TIMES.length; i++) if (t >= LYRIC_TIMES[i]) idx = i;
      return idx;
    }

    function update() {
      var idx = indexAt(audio.currentTime);
      if (idx === current) return;
      current = idx;
      box.classList.toggle("lyrics-live", idx >= 0);
      lines.forEach(function (el, i) { el.classList.toggle("active", i === idx); });
      if (idx < 0 || box.scrollHeight <= box.clientHeight + 2 || Date.now() < userScrollUntil) return;
      var b = box.getBoundingClientRect(), l = lines[idx].getBoundingClientRect();
      if (!b.height) return; // panel closed
      box.scrollTo({
        top: box.scrollTop + (l.top - b.top) - (b.height - l.height) / 2,
        behavior: "smooth"
      });
    }

    audio.addEventListener("timeupdate", update);
    audio.addEventListener("seeked", update);
    audio.addEventListener("play", update);
    audio.addEventListener("ended", function () {
      current = -1;
      box.classList.remove("lyrics-live");
      lines.forEach(function (el) { el.classList.remove("active"); });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-lyrics]").forEach(init);
  });
})();
