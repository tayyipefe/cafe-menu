/* ==========================================================================
   La'mondes Cafe & Bakery — Ortak JavaScript (Vanilla JS)
   Tüm sayfalar bu dosyayı kullanır. Her modül, ilgili HTML elemanı sayfada
   yoksa sessizce atlanır. Böylece tek dosya 6 sayfada da hatasız çalışır.
   ========================================================================== */

(function () {
  "use strict";

  /* JS aktif işareti — CSS animasyonları yalnızca JS varken uygulanır. */
  document.documentElement.classList.add("js");

  /* ======================================================================
     YARDIMCILAR
     ====================================================================== */
  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* ======================================================================
     1. MOBİL HAMBURGER MENÜ
     ====================================================================== */
  function initNav() {
    var toggle = $(".nav__toggle");
    var menu = $("#navMenu");
    if (!toggle || !menu) return;

    var backdrop = $(".nav-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      document.body.appendChild(backdrop);
    }

    function openMenu() {
      menu.classList.add("is-open");
      toggle.classList.add("is-open");
      backdrop.classList.add("is-visible");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Menüyü kapat");
      document.body.classList.add("no-scroll");
    }

    function closeMenu() {
      menu.classList.remove("is-open");
      toggle.classList.remove("is-open");
      backdrop.classList.remove("is-visible");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Menüyü aç");
      document.body.classList.remove("no-scroll");
    }

    toggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    backdrop.addEventListener("click", closeMenu);

    /* Menüden bir linke tıklanınca kapansın (sayfa geçişi sırasında görsel takılma olmasın) */
    $$(".nav__menu a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    /* ESC ile kapat */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });

    /* Masaüstüne geçişte menüyü sıfırla */
    window.addEventListener("resize", function () {
      if (window.innerWidth > 920 && menu.classList.contains("is-open")) {
        closeMenu();
      }
    });
  }

  /* ======================================================================
     2. AKTİF SAYFA LİNKİNİ İŞARETLE
     ====================================================================== */
  function initActiveLink() {
    var path = window.location.pathname.split("/").pop().toLowerCase();
    if (!path) path = "index.html";

    $$(".nav__link").forEach(function (link) {
      var href = (link.getAttribute("href") || "").split("/").pop().toLowerCase();
      if (href === path) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /* ======================================================================
     3. HEADER GÖLGESİ + YUKARI ÇIK BUTONU
     ====================================================================== */
  function initScrollUI() {
    var header = $(".site-header");
    var toTop = $(".to-top");

    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (header) header.classList.toggle("is-scrolled", y > 20);
      if (toTop) toTop.classList.toggle("is-visible", y > 420);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  /* ======================================================================
     4. SCROLL REVEAL ANİMASYONU
     ====================================================================== */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 90 + "ms";
      observer.observe(el);
    });
  }

  /* ======================================================================
     5. MENÜ FİLTRELEME (menu.html)
     ====================================================================== */
  function initMenuFilter() {
    var bar = $("#filterBar");
    var grid = $("#menuGrid");
    if (!bar || !grid) return;

    var buttons = $$(".filter-btn", bar);
    var cards = $$(".product-card", grid);
    var empty = $("#menuEmpty");
    var resultInfo = $("#filterResult");

    /* Her butona ait ürün sayısını otomatik yaz */
    buttons.forEach(function (btn) {
      var cat = btn.dataset.filter;
      var total =
        cat === "tumu"
          ? cards.length
          : cards.filter(function (c) {
              return c.dataset.category === cat;
            }).length;
      var counter = $(".count", btn);
      if (counter) counter.textContent = "(" + total + ")";
    });

    function applyFilter(category) {
      var shown = 0;

      cards.forEach(function (card) {
        var match = category === "tumu" || card.dataset.category === category;
        if (match) {
          card.classList.remove("is-hidden");
          /* Animasyonu yeniden tetikle */
          card.style.animation = "none";
          void card.offsetWidth;
          card.style.animation = "";
          shown++;
        } else {
          card.classList.add("is-hidden");
        }
      });

      if (empty) empty.style.display = shown === 0 ? "block" : "none";

      if (resultInfo) {
        var label = category === "tumu" ? "tüm kategoriler" : categoryLabel(category);
        resultInfo.textContent = shown + " ürün gösteriliyor — " + label;
      }
    }

    function categoryLabel(cat) {
      var found = buttons.filter(function (b) {
        return b.dataset.filter === cat;
      })[0];
      if (!found) return cat;
      var clone = found.cloneNode(true);
      var c = $(".count", clone);
      if (c) c.remove();
      return clone.textContent.trim();
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");

        var cat = btn.dataset.filter;
        applyFilter(cat);

        /* Seçim adres çubuğuna yazılır: menu.html#kahve gibi paylaşılabilir.
           Hash kullanıyoruz çünkü file:// ve statik sunucularda her zaman korunur. */
        if (window.history && window.history.replaceState) {
          var url =
            window.location.pathname +
            window.location.search +
            (cat === "tumu" ? "" : "#" + cat);
          window.history.replaceState(null, "", url);
        }
      });
    });

    /* Sayfa menu.html#kahve veya menu.html?kategori=kahve ile açıldıysa
       o filtreyi otomatik uygula (ör. footer'daki "Kahveler" linki). */
    var initial = (window.location.hash || "").replace("#", "");
    if (!initial) {
      initial = new URLSearchParams(window.location.search).get("kategori") || "";
    }
    var startBtn = buttons.filter(function (b) {
      return b.dataset.filter === initial;
    })[0];

    if (startBtn) {
      startBtn.click();
    } else {
      applyFilter("tumu");
    }
  }

  /* ======================================================================
     6. MÜŞTERİ YORUMLARI KAYDIRICI (index.html)
     ====================================================================== */
  function initSlider() {
    var slider = $("#testimonialSlider");
    if (!slider) return;

    var track = $(".slider__track", slider);
    var prev = $(".slider__btn--prev", slider);
    var next = $(".slider__btn--next", slider);
    var dotsWrap = $(".slider__dots", slider);
    var slides = $$(".testimonial", track);
    if (!track || !slides.length) return;

    var autoTimer = null;

    function step() {
      var first = slides[0];
      var gap = parseFloat(getComputedStyle(track).columnGap || "24") || 24;
      return first.getBoundingClientRect().width + gap;
    }

    function perView() {
      return Math.max(1, Math.round(track.clientWidth / step()));
    }

    function pageCount() {
      return Math.max(1, slides.length - perView() + 1);
    }

    function currentIndex() {
      return Math.round(track.scrollLeft / step());
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for (var i = 0; i < pageCount(); i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slider__dot";
        dot.setAttribute("aria-label", i + 1 + ". yoruma git");
        dot.dataset.index = i;
        dot.addEventListener("click", function () {
          stopAuto();
          goTo(parseInt(this.dataset.index, 10));
        });
        dotsWrap.appendChild(dot);
      }
      syncUI();
    }

    function goTo(index) {
      var max = pageCount() - 1;
      if (index < 0) index = max;
      if (index > max) index = 0;
      track.scrollTo({ left: index * step(), behavior: "smooth" });
    }

    function syncUI() {
      var idx = currentIndex();
      if (dotsWrap) {
        $$(".slider__dot", dotsWrap).forEach(function (d, i) {
          d.classList.toggle("is-active", i === idx);
        });
      }
    }

    if (next) {
      next.addEventListener("click", function () {
        stopAuto();
        goTo(currentIndex() + 1);
      });
    }
    if (prev) {
      prev.addEventListener("click", function () {
        stopAuto();
        goTo(currentIndex() - 1);
      });
    }

    var scrollTick;
    track.addEventListener(
      "scroll",
      function () {
        window.clearTimeout(scrollTick);
        scrollTick = window.setTimeout(syncUI, 90);
      },
      { passive: true }
    );

    /* Klavye ile gezinme */
    track.setAttribute("tabindex", "0");
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stopAuto();
        goTo(currentIndex() + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stopAuto();
        goTo(currentIndex() - 1);
      }
    });

    /* Otomatik kaydırma — fare üzerine gelince durur */
    function startAuto() {
      stopAuto();
      autoTimer = window.setInterval(function () {
        goTo(currentIndex() + 1);
      }, 5200);
    }
    function stopAuto() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", startAuto);
    slider.addEventListener("focusin", stopAuto);

    var resizeTick;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTick);
      resizeTick = window.setTimeout(buildDots, 180);
    });

    buildDots();
    startAuto();
  }

  /* ======================================================================
     7. GALERİ LIGHTBOX (galeri.html)
     ====================================================================== */
  function initLightbox() {
    var items = $$(".gallery-item");
    var box = $("#lightbox");
    if (!items.length || !box) return;

    var img = $(".lightbox__img", box);
    var capTitle = $("#lightboxTitle", box);
    var capMeta = $("#lightboxMeta", box);
    var counter = $("#lightboxCounter", box);
    var btnClose = $(".lightbox__btn--close", box);
    var btnPrev = $(".lightbox__btn--prev", box);
    var btnNext = $(".lightbox__btn--next", box);
    var current = 0;
    var lastFocused = null;

    function render(index) {
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;
      current = index;

      var item = items[current];
      var thumb = $("img", item);
      var full = item.dataset.full || (thumb ? thumb.src : "");

      img.src = full;
      img.alt = item.dataset.title || (thumb ? thumb.alt : "Galeri görseli");
      if (capTitle) capTitle.textContent = item.dataset.title || "";
      if (capMeta) capMeta.textContent = item.dataset.meta || "";
      if (counter) counter.textContent = current + 1 + " / " + items.length;
    }

    function open(index) {
      lastFocused = document.activeElement;
      render(index);
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      if (btnClose) btnClose.focus();
    }

    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      if (lastFocused) lastFocused.focus();
    }

    items.forEach(function (item, i) {
      item.addEventListener("click", function () {
        open(i);
      });
    });

    if (btnClose) btnClose.addEventListener("click", close);
    if (btnNext)
      btnNext.addEventListener("click", function () {
        render(current + 1);
      });
    if (btnPrev)
      btnPrev.addEventListener("click", function () {
        render(current - 1);
      });

    /* Boşluğa tıklayınca kapansın (resmin kendisi hariç) */
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("lightbox__figure")) {
        close();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") render(current + 1);
      if (e.key === "ArrowLeft") render(current - 1);
    });

    /* Mobilde parmakla kaydırma */
    var touchX = null;
    box.addEventListener(
      "touchstart",
      function (e) {
        touchX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    box.addEventListener(
      "touchend",
      function (e) {
        if (touchX === null) return;
        var diff = e.changedTouches[0].clientX - touchX;
        if (Math.abs(diff) > 55) render(diff < 0 ? current + 1 : current - 1);
        touchX = null;
      },
      { passive: true }
    );
  }

  /* ======================================================================
     8. FORM DOĞRULAMA + BAŞARI MESAJI (quiz.html & iletisim.html)
     ====================================================================== */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^[0-9\s()+.-]{10,20}$/;

  function fieldOf(input) {
    return input.closest(".field");
  }

  function setError(input, message) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    wrap.classList.add("has-error");
    var slot = $(".field__error", wrap);
    if (slot) slot.textContent = message;
    input.setAttribute("aria-invalid", "true");
  }

  function clearError(input) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    wrap.classList.remove("has-error");
    var slot = $(".field__error", wrap);
    if (slot) slot.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  function validateInput(input) {
    var value = (input.value || "").trim();
    var type = input.type;

    if (type === "checkbox") {
      if (input.required && !input.checked) {
        setError(input, "Devam etmek için bu kutuyu işaretleyin.");
        return false;
      }
      clearError(input);
      return true;
    }

    if (input.required && !value) {
      setError(input, "Bu alan zorunludur.");
      return false;
    }

    if (!value) {
      clearError(input);
      return true;
    }

    if (type === "email" && !EMAIL_RE.test(value)) {
      setError(input, "Geçerli bir e-posta adresi girin (ör. ad@ornek.com).");
      return false;
    }

    if (type === "tel" && !PHONE_RE.test(value)) {
      setError(input, "Geçerli bir telefon numarası girin (ör. 0532 123 45 67).");
      return false;
    }

    if (input.dataset.minlength && value.length < parseInt(input.dataset.minlength, 10)) {
      setError(input, "En az " + input.dataset.minlength + " karakter yazın.");
      return false;
    }

    if (input.name === "ad" && value.length < 3) {
      setError(input, "Lütfen adınızı ve soyadınızı yazın.");
      return false;
    }

    clearError(input);
    return true;
  }

  function makeCode(prefix) {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
    var out = "";
    for (var i = 0; i < 6; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + "-" + out;
  }

  function initForms() {
    $$("form[data-ajax-form]").forEach(function (form) {
      var successBox = $("#" + form.dataset.success);
      var fields = $$("input, select, textarea", form);
      var submitBtn = $("button[type='submit']", form);

      /* Kullanıcı yazarken hatayı temizle */
      fields.forEach(function (input) {
        var ev = input.tagName === "SELECT" || input.type === "checkbox" ? "change" : "input";
        input.addEventListener(ev, function () {
          if (fieldOf(input) && fieldOf(input).classList.contains("has-error")) {
            validateInput(input);
          }
        });
        input.addEventListener("blur", function () {
          if ((input.value || "").trim() || input.required) validateInput(input);
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault(); /* Sayfa yenilenmesini engelle */

        var valid = true;
        var firstBad = null;

        fields.forEach(function (input) {
          if (!validateInput(input)) {
            valid = false;
            if (!firstBad) firstBad = input;
          }
        });

        if (!valid) {
          if (firstBad) {
            firstBad.focus();
            firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }

        /* Gönderim simülasyonu */
        var originalText = submitBtn ? submitBtn.innerHTML : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Gönderiliyor…";
        }

        window.setTimeout(function () {
          var data = {};
          new FormData(form).forEach(function (v, k) {
            data[k] = v;
          });

          if (successBox) {
            /* Ada göre kişiselleştir */
            var nameSlot = $("[data-fill='ad']", successBox);
            if (nameSlot && data.ad) {
              nameSlot.textContent = data.ad.trim().split(" ")[0];
            }
            var mailSlot = $("[data-fill='eposta']", successBox);
            if (mailSlot && data.eposta) {
              mailSlot.textContent = data.eposta.trim();
            }
            var codeSlot = $("[data-fill='kod']", successBox);
            if (codeSlot) {
              codeSlot.textContent = makeCode(form.dataset.codePrefix || "LMD");
            }

            form.style.display = "none";
            successBox.classList.add("is-visible");
            successBox.setAttribute("role", "status");
            successBox.scrollIntoView({ behavior: "smooth", block: "center" });
          }

          form.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        }, 700);
      });

      /* "Yeni kayıt / yeni mesaj" butonu — formu geri getirir */
      if (successBox) {
        var reset = $("[data-reset-form]", successBox);
        if (reset) {
          reset.addEventListener("click", function () {
            successBox.classList.remove("is-visible");
            form.style.display = "";
            fields.forEach(clearError);
            form.scrollIntoView({ behavior: "smooth", block: "center" });
            var first = fields[0];
            if (first) first.focus();
          });
        }
      }
    });
  }

  /* ======================================================================
     9. FOOTER YIL BİLGİSİ
     ====================================================================== */
  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ======================================================================
     BAŞLAT
     ====================================================================== */
  onReady(function () {
    initNav();
    initActiveLink();
    initScrollUI();
    initReveal();
    initMenuFilter();
    initSlider();
    initLightbox();
    initForms();
    initYear();
  });
})();
