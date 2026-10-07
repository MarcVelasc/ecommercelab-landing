(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile nav toggle
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");

  if (toggle && menu) {
    var closeMenu = function () {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  // Signature motion: a slow swirling field of wavy concentric lines.
  // Used behind the hero stage and reprised, more subtly, on the closing
  // CTA band, so the page opens and closes on the same gesture.
  var initSwirl = function (canvasId, opts) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.getContext) return;

    var cyRatio = opts && opts.cyRatio !== undefined ? opts.cyRatio : 0.42;
    var maxAlpha = opts && opts.maxAlpha !== undefined ? opts.maxAlpha : 0.14;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var rings = [];
    var rafId = null;
    var running = false;

    var RING_COUNT = 9;
    var POINTS = 140;

    var buildRings = function () {
      rings = [];
      var maxR = Math.max(width, height) * 0.62;
      for (var i = 0; i < RING_COUNT; i++) {
        var t = i / (RING_COUNT - 1);
        rings.push({
          base: 40 + t * maxR,
          amp: 18 + Math.sin(i * 1.7) * 14 + t * 30,
          k: 3 + (i % 4),
          phase: i * 0.9,
          speed: (i % 2 === 0 ? 1 : -1) * (0.08 + t * 0.1),
          alpha: maxAlpha - t * (maxAlpha * 0.64)
        });
      }
    };

    var resize = function () {
      var rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildRings();
    };

    var draw = function (time) {
      ctx.clearRect(0, 0, width, height);
      var cx = width / 2;
      var cy = height * cyRatio;
      var scaleY = 0.62;

      for (var i = 0; i < rings.length; i++) {
        var ring = rings[i];
        var phase = ring.phase + (reduceMotion ? 0 : time * 0.00006 * ring.speed * 10);
        ctx.beginPath();
        for (var p = 0; p <= POINTS; p++) {
          var theta = (p / POINTS) * Math.PI * 2;
          var r = ring.base + ring.amp * Math.sin(ring.k * theta + phase);
          var x = cx + Math.cos(theta) * r;
          var y = cy + Math.sin(theta) * r * scaleY;
          if (p === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(255,255,255," + ring.alpha + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    var loop = function (time) {
      draw(time);
      if (!reduceMotion) rafId = requestAnimationFrame(loop);
    };

    var start = function () {
      if (running) return;
      running = true;
      if (reduceMotion) {
        draw(0);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    };

    var stop = function () {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    };

    resize();
    start();

    window.addEventListener("resize", resize);

    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0 }
      );
      obs.observe(canvas.parentElement);
    }
  };

  initSwirl("heroCanvas", { cyRatio: 0.42, maxAlpha: 0.14 });
  initSwirl("ctaCanvas", { cyRatio: 0.5, maxAlpha: 0.22 });
})();
