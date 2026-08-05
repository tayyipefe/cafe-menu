/* ============================================================================
   La'mondes — Site JavaScript
   Ortak başlık/alt bilgi ve sayfaya özel içerik yükleyicileri.
   Sayfa, <body data-sayfa="..."> özniteliğine göre yönlendirilir.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.LM_CONFIG || {};
  var IS = CFG.ISLETME || {};
  var KOK = document.body.getAttribute("data-kok") || "";
  var SAYFA = document.body.getAttribute("data-sayfa") || "";

  /* ---------------------------------------------------------------- */
  /* Yardımcılar                                                       */
  /* ---------------------------------------------------------------- */
  function $(s, k) { return (k || document).querySelector(s); }
  function $$(s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); }

  function kacis(m) {
    return String(m == null ? "" : m)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fiyat(n) {
    var s = Number(n || 0);
    return s.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ₺";
  }

  function tarihYaz(iso, saatliMi) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var sec = { day: "numeric", month: "long", year: "numeric", weekday: "long" };
    var m = d.toLocaleDateString("tr-TR", sec);
    if (saatliMi) {
      m += " · " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    }
    return m;
  }

  function yaz(el, html) { if (el) el.innerHTML = html; }

  /* Küçük önizlemeler için daha hafif bir görsel adresi üretir.
     Unsplash bağlantılarında genişlik/kalite parametresini düşürür;
     kendi yüklediğiniz görsellerde adres değişmeden döner. */
  function kucukGorsel(url, genislik) {
    if (!url || url.indexOf("images.unsplash.com") === -1) return url;
    return url
      .replace(/([?&])w=\d+/, "$1w=" + genislik)
      .replace(/([?&])q=\d+/, "$1q=75");
  }

  function hataKutusu(mesaj) {
    return '<div class="uyari uyari-hata"><strong>İçerik yüklenemedi.</strong> ' + kacis(mesaj) + "</div>";
  }

  function iskelet(satir) {
    var h = '<div class="iskelet">';
    for (var i = 0; i < (satir || 4); i++) h += "<i></i>";
    return h + "</div>";
  }

  /* ---------------------------------------------------------------- */
  /* Başlık ve alt bilgi                                               */
  /* ---------------------------------------------------------------- */
  var SAYFALAR = [
    ["anasayfa", "index.html", "Ana Sayfa"],
    ["hakkimizda", "hakkimizda.html", "Hakkımızda"],
    ["menu", "menu.html", "Menü"],
    ["galeri", "galeri.html", "Galeri"],
    ["quiz", "quiz.html", "Quiz Night"],
    ["iletisim", "iletisim.html", "İletişim"]
  ];

  var YASAL = [
    ["gizlilik-politikasi.html", "Gizlilik Politikası"],
    ["kullanim-kosullari.html", "Kullanım Koşulları"],
    ["kvkk-aydinlatma-metni.html", "KVKK Aydınlatma Metni"],
    ["cerez-politikasi.html", "Çerez Politikası"],
    ["iptal-ve-iade-kosullari.html", "İptal ve İade Koşulları"]
  ];

  function markaHtml() {
    return (
      '<a class="marka" href="' + KOK + 'index.html">' +
      '<span class="marka-im"><img src="' + KOK + 'assets/gorseller/logo.jpg" alt="' +
      kacis(IS.ad) + " " + kacis(IS.altAd) + ' logosu"></span>' +
      '<span><span class="marka-ad">' + kacis(IS.ad) + "</span>" +
      '<span class="marka-alt">' + kacis(IS.altAd) + "</span></span></a>"
    );
  }

  function ustBar() {
    var bag = $("#ustBar");
    if (!bag) return;

    var linkler = SAYFALAR.map(function (s) {
      var etkin = s[0] === SAYFA ? ' class="etkin"' : "";
      var aria = s[0] === SAYFA ? ' aria-current="page"' : "";
      return "<li><a href=\"" + KOK + s[1] + "\"" + etkin + aria + ">" + kacis(s[2]) + "</a></li>";
    }).join("");

    bag.className = "ust";
    bag.innerHTML =
      '<div class="kap ust-ic">' + markaHtml() +
      '<button class="menu-dugme" id="menuDugme" type="button" aria-label="Menüyü aç" aria-expanded="false" aria-controls="anaMenu"><span></span><span></span><span></span></button>' +
      '<ul class="menu" id="anaMenu">' + linkler +
      '<li><a class="btn btn-ana" href="' + KOK + 'iletisim.html">Rezervasyon</a></li></ul></div>';

    menuKur();
  }

  function menuKur() {
    var dugme = $("#menuDugme"), menu = $("#anaMenu");
    if (!dugme || !menu) return;

    var perde = document.createElement("div");
    perde.className = "perde";
    document.body.appendChild(perde);

    function ac() {
      menu.classList.add("acik"); dugme.classList.add("acik");
      perde.classList.add("gorunur"); document.body.classList.add("kilit");
      dugme.setAttribute("aria-expanded", "true");
      dugme.setAttribute("aria-label", "Menüyü kapat");
    }
    function kapat() {
      menu.classList.remove("acik"); dugme.classList.remove("acik");
      perde.classList.remove("gorunur"); document.body.classList.remove("kilit");
      dugme.setAttribute("aria-expanded", "false");
      dugme.setAttribute("aria-label", "Menüyü aç");
    }

    dugme.addEventListener("click", function () {
      menu.classList.contains("acik") ? kapat() : ac();
    });
    perde.addEventListener("click", kapat);
    $$("a", menu).forEach(function (a) { a.addEventListener("click", kapat); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("acik")) { kapat(); dugme.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && menu.classList.contains("acik")) kapat();
    });
  }

  /* Yalnızca config'de tanımlı olan sosyal hesaplar gösterilir. */
  function sosyalHtml() {
    var s = IS.sosyal || {};
    var etiket = {
      instagram: ["IG", "Instagram"],
      whatsapp: ["WA", "WhatsApp"],
      facebook: ["FB", "Facebook"],
      x: ["X", "X (Twitter)"],
      tiktok: ["TT", "TikTok"],
      youtube: ["YT", "YouTube"]
    };
    return Object.keys(etiket)
      .filter(function (k) { return s[k]; })
      .map(function (k) {
        return '<a href="' + kacis(s[k]) + '" target="_blank" rel="noopener" aria-label="' +
          kacis(etiket[k][1]) + '">' + etiket[k][0] + "</a>";
      })
      .join("");
  }

  function altBilgi() {
    var bag = $("#altBilgi");
    if (!bag) return;

    var sayfaLink = SAYFALAR.map(function (s) {
      return '<li><a href="' + KOK + s[1] + '">' + kacis(s[2]) + "</a></li>";
    }).join("");

    var yasalLink = YASAL.map(function (y) {
      return '<li><a href="' + KOK + "yasal/" + y[0] + '">' + kacis(y[1]) + "</a></li>";
    }).join("");

    bag.className = "alt";
    bag.innerHTML =
      '<div class="kap"><div class="alt-izgara">' +

      "<div>" + markaHtml() +
      "<p>Körfez'de waffle üstüne kurulmuş küçük bir kafe. Kahvenizi için, " +
      "sohbetinizi edin, sonra tatlının en güzeline geçin.</p>" +
      '<div class="sosyal">' + sosyalHtml() + "</div></div>" +

      "<div><h4>Sayfalar</h4><ul class=\"alt-linkler\">" + sayfaLink + "</ul></div>" +
      "<div><h4>Yasal</h4><ul class=\"alt-linkler\">" + yasalLink + "</ul></div>" +

      "<div><h4>İletişim</h4><ul class=\"alt-iletisim\">" +
      "<li><span>📍</span><span>" + kacis(IS.adres) + "<br>" + kacis(IS.ilce) + "</span></li>" +
      '<li><span>📞</span><a href="' + kacis(IS.telefonLink) + '">' + kacis(IS.telefon) + "</a></li>" +
      '<li><span>✉️</span><a href="mailto:' + kacis(IS.eposta) + '">' + kacis(IS.eposta) + "</a></li>" +
      "<li><span>🕘</span><span>" +
      (IS.saatler || []).map(function (s) {
        return kacis(s[0]) + " " + kacis(s[1]);
      }).join("<br>") +
      "</span></li></ul></div>" +

      '</div><div class="alt-son"><span>© <span id="yil"></span> ' + kacis(IS.ad) + " " +
      kacis(IS.altAd) + ". Tüm hakları saklıdır" +
      /* Telif yazısının sonundaki nokta gizli yönetim girişidir. */
      '<span class="gizli-giris" id="gizliGiris">.</span></span>' +
      '<nav aria-label="Yasal bağlantılar">' +
      YASAL.map(function (y) {
        return '<a href="' + KOK + "yasal/" + y[0] + '">' + kacis(y[1]) + "</a>";
      }).join("") +
      "</nav></div></div>";

    var yil = $("#yil");
    if (yil) yil.textContent = new Date().getFullYear();

    /* Gizli yönetim girişi: telif satırının sonundaki noktaya tıklanınca
       panele gider. Sitede görünür bir "Admin" bağlantısı bulunmaz. */
    var nokta = $("#gizliGiris");
    if (nokta) {
      nokta.addEventListener("click", function () {
        window.location.href = KOK + "admin/login.html";
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* QR KODLARI (ana sayfa)                                            */
  /* ---------------------------------------------------------------- */
  function qrKodlari() {
    var bolum = $("#qrBolumu");
    if (!bolum) return;

    var taban = (CFG.SITE_ADRESI || window.location.origin).replace(/\/+$/, "");
    var hedefler = [
      { id: "qrMenu", url: taban + "/menu.html", etiket: "Menü sayfasının QR kodu" },
      { id: "qrSite", url: taban + "/", etiket: "Web sitesi ana sayfasının QR kodu" }
    ];

    function ciz() {
      hedefler.forEach(function (h) {
        var kutu = document.getElementById(h.id);
        if (!kutu) return;
        try {
          /* 0 = sürüm otomatik seçilsin, "M" = %15 hata düzeltme
             (baskıda leke/çizik toleransı için makul denge) */
          var kod = window.qrcode(0, "M");
          kod.addData(h.url);
          kod.make();
          kutu.innerHTML = kod.createSvgTag({ cellSize: 4, margin: 2, scalable: true });

          var svg = kutu.querySelector("svg");
          if (svg) {
            svg.removeAttribute("width");
            svg.removeAttribute("height");
            svg.setAttribute("role", "img");
            svg.setAttribute("aria-label", h.etiket);
          }
        } catch (e) {
          kutu.innerHTML = '<p style="font-size:.8rem;color:var(--muted)">QR kodu oluşturulamadı.</p>';
        }

        var adres = document.querySelector('[data-qr-adres="' + h.id + '"]');
        if (adres) adres.textContent = h.url;
      });
    }

    function yukle() {
      if (window.qrcode) { ciz(); return; }
      var s = document.createElement("script");
      s.src = KOK + "assets/js/vendor/qrcode.js";
      s.onload = ciz;
      s.onerror = function () {
        bolum.innerHTML =
          '<div class="uyari uyari-hata">QR kod bileşeni yüklenemedi.</div>';
      };
      document.head.appendChild(s);
    }

    /* Kütüphane 56 KB. Sayfanın ilk çizimini geciktirmemek için script
       dinamik olarak, tarayıcı boşa çıktığında eklenir — böylece indirme
       arka planda olur ama QR kodunun görünmesi hiçbir koşula bağlı değildir.

       Not: Burada bilerek IntersectionObserver kullanılmıyor. Görünürlüğe
       bağlı yükleme, sayfanın çizim yapmadığı ortamlarda (bazı önizleme ve
       gömülü tarayıcılar) hiç tetiklenmiyor ve QR kodu boş kalıyordu. */
    if (window.requestIdleCallback) {
      window.requestIdleCallback(yukle, { timeout: 1500 });
    } else {
      window.setTimeout(yukle, 400);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Kaydırma etkileri                                                 */
  /* ---------------------------------------------------------------- */
  /* Hareketi kapatmış kullanıcılara hiçbir animasyon uygulanmaz. */
  function hareketKapali() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* Üst çubuk: sayfa kaydırılınca incelir, gölgelenir ve altındaki ince
     çizgi sayfanın ne kadarının okunduğunu gösterir. */
  function ustCubukEtkisi() {
    var ust = $("#ustBar");
    if (!ust) return;

    var cizgi = document.createElement("span");
    cizgi.className = "ust-ilerleme";
    ust.appendChild(cizgi);

    var bekliyor = false;
    function guncelle() {
      bekliyor = false;
      var y = window.pageYOffset;
      var kaydi = y > 24;
      ust.classList.toggle("kaydi", kaydi);
      document.body.classList.toggle("kaydi", kaydi);

      var toplam = document.documentElement.scrollHeight - window.innerHeight;
      cizgi.style.width = (toplam > 0 ? Math.min(100, (y / toplam) * 100) : 0) + "%";
    }
    window.addEventListener("scroll", function () {
      if (bekliyor) return;
      bekliyor = true;
      window.requestAnimationFrame(guncelle);
      /* requestAnimationFrame, sayfanın çizim yapmadığı bazı gömülü
         tarayıcılarda hiç tetiklenmiyor; zamanlayıcı yedeği bırakılıyor.
         guncelle() iki kez çalışsa da zararsızdır. */
      window.setTimeout(guncelle, 120);
    }, { passive: true });
    guncelle();
  }

  /* Ekrana giren bölümler yumuşakça belirir. İçerik sunucudan sonradan
     geldiği için yeni eklenen düğümler MutationObserver ile yakalanır. */
  var BELIREN_SECICI = [
    ".blok-basi", ".kart", ".izgara > *", ".hizli a", ".galeri-oge",
    ".urun", ".menu-grup", ".kural", ".etkinlik", ".gecmis-kart",
    ".qr-kart", ".ikili > *", ".form-kart", ".bilgi-liste", ".harita",
    ".duyuru", ".bos-durum", ".rozet-serit span"
  ].join(",");

  function belirmeKur() {
    if (hareketKapali()) return;

    var bekleyen = [];
    var bekliyor = false;

    /* Kaydırma olayı bir kez geldiyse ortam sağlıklıdır ve gerisini olaylar
       taşır. Gelmediği sürece tarama kendi kendini tekrar eder (aşağıya bkz.);
       bazı önizleme ve gömülü tarayıcılar scroll olayı üretmiyor. */
    var kaydirmaGeldi = false;

    /* Animasyon süresi (0,7 sn + en fazla 0,35 sn gecikme) dolduğunda "bitti"
       eklenir; bkz. site.css'teki açıklama. */
    function goster(el) {
      el.classList.add("gorundu");
      window.setTimeout(function () { el.classList.add("bitti"); }, 1200);
    }

    /* Bilerek IntersectionObserver kullanılmıyor: sayfanın çizim yapmadığı
       bazı önizleme ve gömülü tarayıcılarda hiç tetiklenmiyor ve öğeler
       görünmez kalıyor. Konum hesabı her ortamda çalışır. */
    function tara() {
      bekliyor = false;
      var esik = window.innerHeight * 0.92;
      var kalan = [];
      for (var i = 0; i < bekleyen.length; i++) {
        var el = bekleyen[i];
        var k = el.getBoundingClientRect();
        /* Eşiğin üstündeki her şey açılır — hızlı kaydırmada atlanan veya
           bağlantıyla üstünden geçilen bölümler gizli kalmasın.
           Yüksekliği 0 olan (henüz yerleşmemiş) öğeler sırada bekler. */
        if (k.top < esik && k.height > 0) goster(el);
        else kalan.push(el);
      }
      bekleyen = kalan;

      /* İlk kaydırmaya kadar tarama kendini tekrarlar; kaydırma olayı gelmeyen
         ortamlarda tek çalışan mekanizma budur ve içerik gizli kalmaz.
         Normal tarayıcıda ilk kaydırmadan sonra döngü kendiliğinden durur. */
      if (bekleyen.length && !kaydirmaGeldi) window.setTimeout(planla, 600);
    }

    function planla() {
      if (bekliyor || !bekleyen.length) return;
      bekliyor = true;
      window.requestAnimationFrame(tara);
      /* rAF yedeği: tara() iki kez çağrılsa da zararsızdır. */
      window.setTimeout(tara, 300);
    }

    function kaydet(kok) {
      $$(BELIREN_SECICI, kok).forEach(function (el) {
        if (el.classList.contains("beliren")) return;
        /* İç içe geçen öğelerde yalnızca en dıştaki canlansın. */
        if (el.parentElement && el.parentElement.closest(".beliren")) return;
        el.classList.add("beliren");
        bekleyen.push(el);
      });
      planla();
    }

    kaydet(document);

    var ana = $("main");
    if (ana && window.MutationObserver) {
      new MutationObserver(function () { kaydet(ana); })
        .observe(ana, { childList: true, subtree: true });
    }

    window.addEventListener("scroll", function () {
      kaydirmaGeldi = true;
      planla();
    }, { passive: true });
    window.addEventListener("resize", planla, { passive: true });
  }

  function yukariDugme() {
    var b = document.createElement("button");
    b.className = "yukari";
    b.type = "button";
    b.setAttribute("aria-label", "Sayfanın başına dön");
    b.innerHTML = "↑";
    document.body.appendChild(b);
    b.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", function () {
      b.classList.toggle("gorunur", window.pageYOffset > 400);
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- */
  /* ANA SAYFA                                                         */
  /* ---------------------------------------------------------------- */
  function anaSayfa() {
    // Öne çıkan ürünler
    var kutu = $("#oneCikanlar");
    if (kutu) {
      yaz(kutu, iskelet(3));
      LM.db.select("lm_urunler", {
        sec: "id,ad,aciklama,fiyat,gorsel_url,stokta",
        esit: { one_cikan: true, aktif: true },
        sirala: "sira.asc",
        limit: 6
      }).then(function (liste) {
        /* Hiç "öne çıkan" ürün seçilmemişse başlığıyla birlikte bölümü gizle,
           yoksa sayfada boş bir başlık kalır. */
        if (!liste.length) {
          var bolum = kutu.closest("section");
          if (bolum) bolum.style.display = "none";
          else kutu.innerHTML = "";
          return;
        }
        kutu.className = "izgara izgara-3";
        kutu.innerHTML = liste.map(function (u) {
          return (
            '<article class="kart kart-hover">' +
            (u.gorsel_url
              ? '<img src="' + kacis(kucukGorsel(u.gorsel_url, 600)) + '" alt="' + kacis(u.ad) +
                '" loading="lazy" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;margin-bottom:1rem">'
              : "") +
            '<div style="display:flex;justify-content:space-between;gap:.8rem;align-items:baseline">' +
            "<h3>" + kacis(u.ad) + "</h3>" +
            '<span class="urun-fiyat">' + fiyat(u.fiyat) + "</span></div>" +
            "<p>" + kacis(u.aciklama || "") + "</p>" +
            (u.stokta ? "" : '<p style="margin-top:.6rem"><span class="rozet rozet-tukendi">Tükendi</span></p>') +
            "</article>"
          );
        }).join("");
      }).catch(function (e) { yaz(kutu, hataKutusu(e.message)); });
    }

    galeriKesit();
    quizKesit();
  }

  /* Ana sayfadaki galeri kesiti — ilk 6 fotoğraf, tıklayınca galeri sayfasına. */
  function galeriKesit() {
    var kutu = $("#galeriKesit");
    if (!kutu) return;
    yaz(kutu, iskelet(3));

    LM.db.select("lm_galeri", {
      sec: "id,baslik,gorsel_url", esit: { aktif: true }, sirala: "sira.asc", limit: 6
    }).then(function (liste) {
      var bolum = kutu.closest("section");
      if (!liste.length) { if (bolum) bolum.style.display = "none"; return; }

      kutu.className = "galeri";
      kutu.innerHTML = liste.map(function (g) {
        return (
          '<a class="galeri-oge" href="' + KOK + 'galeri.html">' +
          '<img src="' + kacis(kucukGorsel(g.gorsel_url, 500)) + '" alt="' +
          kacis(g.baslik || "Galeri görseli") + '" loading="lazy">' +
          (g.baslik ? '<span class="galeri-yazi">' + kacis(g.baslik) + "</span>" : "") +
          "</a>"
        );
      }).join("");
    }).catch(function () {
      var bolum = kutu.closest("section");
      if (bolum) bolum.style.display = "none";
    });
  }

  /* Ana sayfadaki Quiz Night kesiti — sabit bilgiler + varsa yaklaşan tema. */
  function quizKesit() {
    var kutu = $("#quizKesit");
    if (!kutu) return;
    yaz(kutu, iskelet(3));

    var kurallar =
      '<div class="kural-izgara">' +
      '<div class="kural"><span class="im">🎟️</span><div><b>Katılım Ücretsiz</b>' +
      "<span>Tek şart gelmek.</span></div></div>" +
      '<div class="kural"><span class="im">🕘</span><div><b>Saat 20:30</b>' +
      "<span>Her etkinlikte aynı saatte.</span></div></div>" +
      '<div class="kural"><span class="im">🥤</span><div><b>Kolay Test</b>' +
      "<span>Bardak Waffle hediye.</span></div></div>" +
      '<div class="kural"><span class="im">🧇</span><div><b>Zor Test</b>' +
      "<span>Waffle Kampanya hediye.</span></div></div></div>";

    etkinlikGetir().then(function (e) {
      var tema = e && e.film_adi
        ? '<div class="duyuru" style="margin-top:1.4rem"><span class="nokta"></span>' +
          "<p><b>Sıradaki tema: " + kacis(e.film_adi) + "</b> — " +
          kacis(tarihYaz(e.tarih, true)) + "</p></div>"
        : '<div class="duyuru" style="margin-top:1.4rem"><span class="nokta"></span>' +
          "<p><b>Çok yakında yeni etkinlik</b> — tema ve tarih için Instagram'dan " +
          "bizi takip edin.</p></div>";

      kutu.innerHTML = kurallar + tema +
        '<div class="btn-sira" style="justify-content:center;margin-top:1.6rem">' +
        '<a class="btn btn-ana" href="' + KOK + 'quiz.html">Quiz Night Detayları</a></div>';
    }).catch(function () {
      kutu.innerHTML = kurallar +
        '<div class="btn-sira" style="justify-content:center;margin-top:1.6rem">' +
        '<a class="btn btn-ana" href="' + KOK + 'quiz.html">Quiz Night Detayları</a></div>';
    });
  }

  /* ---------------------------------------------------------------- */
  /* MENÜ SAYFASI                                                      */
  /* ---------------------------------------------------------------- */
  function menuSayfasi() {
    var sekmeKutu = $("#sekmeler"), liste = $("#menuListe");
    if (!liste) return;

    yaz(liste, iskelet(6));

    Promise.all([
      LM.db.select("lm_kategoriler", {
        sec: "id,ad,slug,aciklama", esit: { aktif: true }, sirala: "sira.asc"
      }),
      LM.db.select("lm_urunler", {
        sec: "id,kategori_id,ad,aciklama,fiyat,gorsel_url,stokta,one_cikan",
        esit: { aktif: true }, sirala: "sira.asc"
      })
    ]).then(function (sonuc) {
      var kategoriler = sonuc[0], urunler = sonuc[1];

      if (!kategoriler.length) {
        liste.innerHTML =
          '<div class="bos-durum"><span class="im">🍽️</span><h3>Menü hazırlanıyor</h3>' +
          "<p>Menü içeriği çok yakında burada olacak.</p></div>";
        if (sekmeKutu) sekmeKutu.innerHTML = "";
        return;
      }

      // Sekmeler
      if (sekmeKutu) {
        sekmeKutu.innerHTML =
          '<button class="sekme etkin" type="button" data-slug="tumu">Tümü' +
          '<span class="adet">' + urunler.length + "</span></button>" +
          kategoriler.map(function (k) {
            var adet = urunler.filter(function (u) { return u.kategori_id === k.id; }).length;
            return '<button class="sekme" type="button" data-slug="' + kacis(k.slug) + '">' +
              kacis(k.ad) + '<span class="adet">' + adet + "</span></button>";
          }).join("");
      }

      // Gruplar — görselli ürünler büyütme penceresi için sırayla toplanır
      var buyutmeListesi = [];
      liste.className = "";
      liste.innerHTML = kategoriler.map(function (k) {
        var kendi = urunler.filter(function (u) { return u.kategori_id === k.id; });
        if (!kendi.length) return "";
        return (
          '<section class="menu-grup" data-slug="' + kacis(k.slug) + '">' +
          "<h2>" + kacis(k.ad) +
          (k.aciklama ? "<small>" + kacis(k.aciklama) + "</small>" : "") + "</h2>" +
          '<div class="urun-liste">' + kendi.map(function (u) {
            var sira = -1;
            if (u.gorsel_url) {
              sira = buyutmeListesi.length;
              buyutmeListesi.push({
                gorsel_url: u.gorsel_url,
                baslik: u.ad,
                aciklama: fiyat(u.fiyat) + (u.aciklama ? " · " + u.aciklama : "")
              });
            }
            return urunHtml(u, sira);
          }).join("") + "</div></section>"
        );
      }).join("");

      kutuKur(buyutmeListesi, ".urun-gorsel-kutu");

      // Sekme filtreleme
      if (sekmeKutu) {
        $$(".sekme", sekmeKutu).forEach(function (b) {
          b.addEventListener("click", function () {
            $$(".sekme", sekmeKutu).forEach(function (x) { x.classList.remove("etkin"); });
            b.classList.add("etkin");
            var slug = b.dataset.slug;
            $$(".menu-grup", liste).forEach(function (g) {
              g.style.display = slug === "tumu" || g.dataset.slug === slug ? "" : "none";
            });
            if (history.replaceState) {
              history.replaceState(null, "", location.pathname + (slug === "tumu" ? "" : "#" + slug));
            }
          });
        });

        var basla = (location.hash || "").replace("#", "");
        var hedef = basla && $('.sekme[data-slug="' + basla + '"]', sekmeKutu);
        if (hedef) hedef.click();
      }
    }).catch(function (e) {
      yaz(liste, hataKutusu(e.message));
      if (sekmeKutu) sekmeKutu.innerHTML = "";
    });
  }

  /* gorselSira: büyütme penceresindeki sırası. Görseli yoksa -1 gelir. */
  function urunHtml(u, gorselSira) {
    return (
      '<article class="urun' + (u.stokta ? "" : " tukendi") + '">' +
      (u.gorsel_url
        ? '<button class="urun-gorsel-kutu" type="button" data-i="' + gorselSira +
          '" aria-label="' + kacis(u.ad) + ' fotoğrafını büyüt">' +
          '<img class="urun-gorsel" src="' + kacis(kucukGorsel(u.gorsel_url, 800)) +
          '" alt="' + kacis(u.ad) + '" loading="lazy">' +
          '<span class="urun-buyut" aria-hidden="true">⤢</span></button>'
        : "") +
      '<div class="urun-govde"><div class="urun-ust">' +
      '<span class="urun-ad">' + kacis(u.ad) +
      (u.one_cikan ? ' <span class="rozet rozet-one">Öne çıkan</span>' : "") +
      (u.stokta ? "" : ' <span class="rozet rozet-tukendi">Tükendi</span>') +
      "</span>" +
      '<span class="urun-fiyat">' + fiyat(u.fiyat) + "</span></div>" +
      (u.aciklama ? '<p class="urun-aciklama">' + kacis(u.aciklama) + "</p>" : "") +
      "</div></article>"
    );
  }

  /* ---------------------------------------------------------------- */
  /* GALERİ                                                            */
  /* ---------------------------------------------------------------- */
  function galeriSayfasi() {
    var kutu = $("#galeriIzgara");
    if (!kutu) return;
    yaz(kutu, iskelet(6));

    LM.db.select("lm_galeri", {
      sec: "id,baslik,aciklama,gorsel_url", esit: { aktif: true }, sirala: "sira.asc"
    }).then(function (liste) {
      if (!liste.length) {
        kutu.className = "";
        kutu.innerHTML =
          '<div class="bos-durum"><span class="im">🖼️</span><h3>Galeri hazırlanıyor</h3>' +
          "<p>Mekânımızdan fotoğraflar çok yakında burada olacak.</p></div>";
        return;
      }
      kutu.className = "galeri";
      kutu.innerHTML = liste.map(function (g, i) {
        return (
          '<button class="galeri-oge" type="button" data-i="' + i + '">' +
          '<img src="' + kacis(kucukGorsel(g.gorsel_url, 500)) + '" alt="' +
          kacis(g.baslik || "Galeri görseli") + '" loading="lazy">' +
          (g.baslik ? '<span class="galeri-yazi">' + kacis(g.baslik) + "</span>" : "") +
          "</button>"
        );
      }).join("");
      kutuKur(liste);
    }).catch(function (e) {
      kutu.className = "";
      yaz(kutu, hataKutusu(e.message));
    });
  }

  /* Büyütme penceresi. secici verilmezse galeri öğelerine bağlanır;
     menü sayfasında ".urun-gorsel-kutu" ile ürün fotoğraflarına bağlanır. */
  function kutuKur(liste, secici) {
    var kutu = $("#buyutec");
    if (!kutu || !liste.length) return;
    var img = $(".kutu-resim", kutu), yazi = $(".kutu-yazi", kutu), sayac = $(".kutu-sayac", kutu);
    var simdi = 0, sonOdak = null;

    function ciz(i) {
      if (i < 0) i = liste.length - 1;
      if (i >= liste.length) i = 0;
      simdi = i;
      var g = liste[i];
      img.src = g.gorsel_url;
      img.alt = g.baslik || "Galeri görseli";
      yazi.textContent = [g.baslik, g.aciklama].filter(Boolean).join(" — ");
      sayac.textContent = i + 1 + " / " + liste.length;
    }
    function ac(i) {
      sonOdak = document.activeElement;
      ciz(i);
      kutu.classList.add("acik");
      kutu.setAttribute("aria-hidden", "false");
      document.body.classList.add("kilit");
      $(".kutu-kapat", kutu).focus();
    }
    function kapat() {
      kutu.classList.remove("acik");
      kutu.setAttribute("aria-hidden", "true");
      document.body.classList.remove("kilit");
      if (sonOdak) sonOdak.focus();
    }

    $$(secici || ".galeri-oge").forEach(function (b) {
      b.addEventListener("click", function () { ac(parseInt(b.dataset.i, 10)); });
    });
    $(".kutu-kapat", kutu).addEventListener("click", kapat);
    $(".kutu-sonraki", kutu).addEventListener("click", function () { ciz(simdi + 1); });
    $(".kutu-onceki", kutu).addEventListener("click", function () { ciz(simdi - 1); });
    kutu.addEventListener("click", function (e) {
      if (e.target === kutu || e.target.tagName === "FIGURE") kapat();
    });
    document.addEventListener("keydown", function (e) {
      if (!kutu.classList.contains("acik")) return;
      if (e.key === "Escape") kapat();
      if (e.key === "ArrowRight") ciz(simdi + 1);
      if (e.key === "ArrowLeft") ciz(simdi - 1);
    });

    var dokunX = null;
    kutu.addEventListener("touchstart", function (e) { dokunX = e.changedTouches[0].clientX; }, { passive: true });
    kutu.addEventListener("touchend", function (e) {
      if (dokunX === null) return;
      var f = e.changedTouches[0].clientX - dokunX;
      if (Math.abs(f) > 50) ciz(f < 0 ? simdi + 1 : simdi - 1);
      dokunX = null;
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- */
  /* QUIZ NIGHT                                                        */
  /* ---------------------------------------------------------------- */
  /* Etkinlik akşamı boyunca hâlâ "yaklaşan" sayılsın diye 6 saat pay bırakılır. */
  var ETKINLIK_PAYI = 6 * 3600 * 1000;
  var ETKINLIK_ALANLARI =
    "id,baslik,film_adi,aciklama,tarih,konum,katilim,afis_url,video_url,geri_sayim";

  function etkinlikGetir() {
    return LM.db.select("lm_etkinlikler", {
      sec: ETKINLIK_ALANLARI,
      esit: { yayinda: true },
      suzgec: "tarih=gte." + new Date(Date.now() - ETKINLIK_PAYI).toISOString(),
      sirala: "tarih.asc",
      limit: 1
    }).then(function (l) { return l && l.length ? l[0] : null; });
  }

  /* ---------------------------------------------------------------- */
  /* Video gömme                                                       */
  /* ---------------------------------------------------------------- */
  /* Yönetici; Instagram/YouTube bağlantısı, hazır embed kodu veya yüklenmiş
     bir dosya adresi girebilir. Yapıştırılan embed kodunu OLDUĞU GİBİ sayfaya
     basmıyoruz — içinden yalnızca adresi çıkarıp kendi çerçevemizi kuruyoruz.
     Böylece koda gizlenmiş bir script sayfaya sızamaz. */
  function videoBilgi(girdi) {
    var m = String(girdi || "").trim();
    if (!m) return null;

    // Embed kodu yapıştırıldıysa adresi çıkar
    var cerceve = m.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
    if (cerceve) {
      m = cerceve[1];
    } else {
      var insBlok = m.match(/data-instgrm-permalink=["']([^"'?]+)/i);
      if (insBlok) m = insBlok[1];
    }
    if (m.indexOf("//") === 0) m = "https:" + m;

    var yt = m.match(
      /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
    );
    if (yt) return { tip: "cerceve", src: "https://www.youtube-nocookie.com/embed/" + yt[1] };

    var ins = m.match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)/);
    if (ins) {
      return {
        tip: "cerceve",
        src: "https://www.instagram.com/p/" + ins[1] + "/embed",
        oran: "9 / 14"
      };
    }

    var vim = m.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vim) return { tip: "cerceve", src: "https://player.vimeo.com/video/" + vim[1] };

    /* Video dosyası: hem tam adres (https://...) hem de projedeki yol (/assets/...)
       kabul edilir. Yerel yollar da desteklenmezse panelden yüklenen ve projeye
       konan videolar hiç görünmez. */
    if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(m) && /^(https?:\/\/|\/)/i.test(m)) {
      return { tip: "dosya", src: m };
    }
    if (/^https?:\/\//i.test(m)) return { tip: "baglanti", src: m };
    return null;
  }

  /* kapak: yüklenen video dosyaları için önizleme görseli (afiş).
     Oynatılmadan önce siyah kutu yerine afiş görünür. */
  function videoHtml(bilgi, baslik, kapak) {
    if (!bilgi) return "";
    if (bilgi.tip === "cerceve") {
      return (
        '<div class="video-kutu"' +
        (bilgi.oran ? ' style="aspect-ratio:' + bilgi.oran + '"' : "") + ">" +
        '<iframe src="' + kacis(bilgi.src) + '" loading="lazy" allowfullscreen ' +
        'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
        'referrerpolicy="strict-origin-when-cross-origin" title="' + kacis(baslik || "Etkinlik videosu") +
        '"></iframe></div>'
      );
    }
    if (bilgi.tip === "dosya") {
      return (
        '<div class="video-kutu"><video controls playsinline preload="metadata"' +
        (kapak ? ' poster="' + kacis(kapak) + '"' : "") +
        ' src="' + kacis(bilgi.src) + '"></video></div>'
      );
    }
    return (
      '<a class="btn btn-cizgi btn-kucuk" href="' + kacis(bilgi.src) +
      '" target="_blank" rel="noopener">Videoyu aç ↗</a>'
    );
  }

  function quizSayfasi() {
    var kutu = $("#etkinlikAlani");
    var gecmisKutu = $("#gecmisAlani");
    if (!kutu) return;
    yaz(kutu, iskelet(5));

    LM.db.select("lm_etkinlikler", {
      sec: ETKINLIK_ALANLARI,
      esit: { yayinda: true },
      sirala: "tarih.desc"
    }).then(function (liste) {
      var esik = Date.now() - ETKINLIK_PAYI;

      var yaklasanlar = liste
        .filter(function (e) { return new Date(e.tarih).getTime() >= esik; })
        .sort(function (a, b) { return new Date(a.tarih) - new Date(b.tarih); });

      var gecmisler = liste.filter(function (e) {
        return new Date(e.tarih).getTime() < esik;
      });

      yaklasanCiz(kutu, yaklasanlar[0]);
      gecmisCiz(gecmisKutu, gecmisler);
    }).catch(function (err) {
      yaz(kutu, hataKutusu(err.message));
      if (gecmisKutu) gecmisKutu.closest("section").style.display = "none";
    });
  }

  function yaklasanCiz(kutu, e) {
    if (!e) {
      kutu.innerHTML =
        '<div class="bos-durum"><span class="im">🎬</span>' +
        "<h3>Çok Yakında Yeni Etkinlik!</h3>" +
        "<p>Bir sonraki Quiz Night'ın teması ve tarihi henüz açıklanmadı. " +
        "Duyuruyu ilk siz görmek isterseniz Instagram'dan bizi takip edin.</p>" +
        '<div class="btn-sira" style="justify-content:center">' +
        '<a class="btn btn-ana" href="' + kacis((IS.sosyal || {}).instagram || "#") +
        '" target="_blank" rel="noopener">Instagram\'da Takip Et</a>' +
        '<a class="btn btn-cizgi" href="' + KOK + 'iletisim.html">Bize Ulaşın</a>' +
        "</div></div>";
      return;
    }

    var maddeler = (e.katilim || "").split("\n").filter(function (s) { return s.trim(); });
    var video = videoBilgi(e.video_url);

    kutu.innerHTML =
      '<article class="etkinlik">' +
      (e.afis_url
        ? '<img class="etkinlik-afis" src="' + kacis(e.afis_url) + '" alt="' +
          kacis(e.film_adi || e.baslik) + ' afişi">'
        : '<div class="etkinlik-afis" style="display:grid;place-items:center;font-size:3rem">🎬</div>') +
      '<div class="etkinlik-govde">' +
      '<span class="etkinlik-tarih">📅 ' + kacis(tarihYaz(e.tarih, true)) + "</span>" +
      (e.film_adi
        ? '<span class="tema-etiket">Bu haftanın teması</span><h2>' + kacis(e.film_adi) + "</h2>"
        : "<h2>" + kacis(e.baslik || "Quiz Night") + "</h2>") +
      (e.aciklama ? "<p>" + kacis(e.aciklama) + "</p>" : "") +
      (e.konum ? '<p style="color:var(--muted);font-size:.9rem">📍 ' + kacis(e.konum) + "</p>" : "") +
      (e.geri_sayim ? '<div class="geri-sayim" id="geriSayim"></div>' : "") +
      (maddeler.length
        ? '<ul class="katilim-liste">' + maddeler.map(function (m) {
            return "<li>" + kacis(m.trim()) + "</li>";
          }).join("") + "</ul>"
        : "") +
      (video ? videoHtml(video, e.film_adi || "Etkinlik videosu") : "") +
      '<div class="btn-sira">' +
      '<a class="btn btn-ana" href="' + KOK + 'iletisim.html">Yer Ayırt</a>' +
      '<a class="btn btn-cizgi" href="' + kacis(IS.telefonLink) + '">' + kacis(IS.telefon) + "</a>" +
      "</div></div></article>";

    if (e.geri_sayim) geriSayimBaslat($("#geriSayim"), e.tarih);
  }

  function gecmisCiz(kutu, liste) {
    if (!kutu) return;
    var bolum = kutu.closest("section");

    /* Geçmiş etkinlik yoksa bölümü tamamen gizle — boş başlık kalmasın. */
    if (!liste.length) {
      if (bolum) bolum.style.display = "none";
      return;
    }
    if (bolum) bolum.style.display = "";

    /* En yeni etkinlik en üstte. Sıralamayı veri kaynağına bırakmıyoruz. */
    liste = liste.slice().sort(function (a, b) {
      return new Date(b.tarih) - new Date(a.tarih);
    });

    kutu.className = "gecmis-liste";
    kutu.innerHTML = liste.map(function (e) {
      var video = videoBilgi(e.video_url);
      var maddeler = (e.katilim || "").split("\n").filter(function (s) { return s.trim(); });

      /* Video varsa afiş onun kapak görseli olur; yoksa afiş tek başına gösterilir. */
      var medya = video
        ? videoHtml(video, e.film_adi || e.baslik, e.afis_url)
        : e.afis_url
          ? '<div class="video-kutu"><img src="' + kacis(e.afis_url) + '" alt="' +
            kacis(e.film_adi || e.baslik) + ' afişi" loading="lazy"></div>'
          : '<div class="video-kutu video-yok">🎬</div>';

      return (
        '<article class="gecmis-kart">' +
        '<div class="gecmis-medya">' + medya + "</div>" +
        '<div class="gecmis-govde">' +
        '<span class="etkinlik-tarih">📅 ' + kacis(tarihYaz(e.tarih, true)) + "</span>" +
        '<span class="tema-etiket">Tema</span>' +
        "<h3>" + kacis(e.film_adi || e.baslik || "Quiz Night") + "</h3>" +
        (e.aciklama ? "<p>" + kacis(e.aciklama) + "</p>" : "") +
        (maddeler.length
          ? '<ul class="katilim-liste">' + maddeler.map(function (m) {
              return "<li>" + kacis(m.trim()) + "</li>";
            }).join("") + "</ul>"
          : "") +
        "</div></article>"
      );
    }).join("");
  }

  function geriSayimBaslat(el, isoTarih) {
    if (!el) return;
    var hedef = new Date(isoTarih).getTime();

    function ciz() {
      var fark = hedef - Date.now();
      if (fark <= 0) {
        el.innerHTML =
          '<div class="duyuru" style="width:100%"><span class="nokta"></span>' +
          "<p><b>Bu akşam bizdeyiz!</b> Kapılar 19:30'da açılıyor.</p></div>";
        return;
      }
      var gun = Math.floor(fark / 86400000);
      var saat = Math.floor((fark % 86400000) / 3600000);
      var dk = Math.floor((fark % 3600000) / 60000);
      var sn = Math.floor((fark % 60000) / 1000);
      el.innerHTML = [[gun, "Gün"], [saat, "Saat"], [dk, "Dakika"], [sn, "Saniye"]]
        .map(function (p) {
          return '<div class="gs-kutu"><b>' + p[0] + "</b><span>" + p[1] + "</span></div>";
        }).join("");
      window.setTimeout(ciz, 1000);
    }
    ciz();
  }

  /* ---------------------------------------------------------------- */
  /* İLETİŞİM                                                          */
  /* ---------------------------------------------------------------- */
  function iletisimSayfasi() {
    // Harita
    var h = $("#haritaCerceve");
    if (h) h.src = IS.harita;

    // Çalışma saatleri — bugüne denk gelen satır vurgulanır.
    // Tek satır varsa (her gün aynı saat) her zaman vurgulanır.
    // Birden çok satırda üçüncü eleman gün numaralarını taşıyabilir: [.., .., [1,2,3]]
    var t = $("#saatler");
    if (t && IS.saatler) {
      var bugun = new Date().getDay(); // 0 = Pazar
      t.innerHTML = IS.saatler.map(function (s) {
        var bugunMu =
          IS.saatler.length === 1 ||
          (Array.isArray(s[2]) && s[2].indexOf(bugun) > -1);
        return "<tr" + (bugunMu ? ' class="bugun"' : "") + "><td>" +
          kacis(s[0]) + "</td><td>" + kacis(s[1]) + "</td></tr>";
      }).join("");
    }

    formKur();
  }

  /* Google bağlantıları — her sayfada çalışır, ilgili id yoksa atlanır. */
  function googleBaglantilari() {
    var hedef = {
      yolTarifi: IS.haritaYol,
      googleProfil: IS.googleProfil,
      yorumYaz: IS.yorumYaz
    };
    Object.keys(hedef).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && hedef[id]) el.href = hedef[id];
    });
  }

  var EPOSTA_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var TEL_RE = /^[0-9\s()+.\-]{10,20}$/;

  function alanHata(input, mesaj) {
    var sarma = input.closest(".alan");
    if (!sarma) return;
    sarma.classList.toggle("hatali", !!mesaj);
    var yer = sarma.querySelector(".alan-hata");
    if (yer) yer.textContent = mesaj || "";
    if (mesaj) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function alanDogrula(input) {
    var d = (input.value || "").trim();

    if (input.type === "checkbox") {
      if (input.required && !input.checked) {
        alanHata(input, "Devam etmek için onaylamanız gerekiyor."); return false;
      }
      alanHata(input, ""); return true;
    }
    if (input.required && !d) { alanHata(input, "Bu alan zorunludur."); return false; }
    if (!d) { alanHata(input, ""); return true; }
    if (input.type === "email" && !EPOSTA_RE.test(d)) {
      alanHata(input, "Geçerli bir e-posta girin (ör. ad@ornek.com)."); return false;
    }
    if (input.type === "tel" && !TEL_RE.test(d)) {
      alanHata(input, "Geçerli bir telefon girin (ör. 0532 123 45 67)."); return false;
    }
    if (input.name === "ad" && d.length < 3) {
      alanHata(input, "Lütfen adınızı ve soyadınızı yazın."); return false;
    }
    if (input.name === "mesaj" && d.length < 10) {
      alanHata(input, "En az 10 karakter yazın."); return false;
    }
    alanHata(input, ""); return true;
  }

  function formKur() {
    var form = $("#iletisimForm");
    if (!form) return;
    var basari = $("#formBasari");
    var alanlar = $$("input, select, textarea", form);
    var gonder = $("button[type=submit]", form);

    alanlar.forEach(function (i) {
      var olay = i.tagName === "SELECT" || i.type === "checkbox" ? "change" : "input";
      i.addEventListener(olay, function () {
        var s = i.closest(".alan");
        if (s && s.classList.contains("hatali")) alanDogrula(i);
      });
      i.addEventListener("blur", function () {
        if ((i.value || "").trim() || i.required) alanDogrula(i);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var gecerli = true, ilkHata = null;
      alanlar.forEach(function (i) {
        if (!alanDogrula(i)) { gecerli = false; if (!ilkHata) ilkHata = i; }
      });
      if (!gecerli) {
        if (ilkHata) { ilkHata.focus(); ilkHata.scrollIntoView({ behavior: "smooth", block: "center" }); }
        return;
      }

      var eskiYazi = gonder.textContent;
      gonder.disabled = true;
      gonder.textContent = "Gönderiliyor…";

      var d = new FormData(form);
      var kayit = {
        ad: (d.get("ad") || "").trim(),
        eposta: (d.get("eposta") || "").trim(),
        telefon: (d.get("telefon") || "").trim() || null,
        konu: (d.get("konu") || "").trim(),
        mesaj: (d.get("mesaj") || "").trim()
      };

      var ekler = [];
      if (d.get("tarih")) ekler.push("Tarih: " + d.get("tarih"));
      if (d.get("saat")) ekler.push("Saat: " + d.get("saat"));
      if (d.get("kisi")) ekler.push("Kişi sayısı: " + d.get("kisi"));
      if (ekler.length) kayit.mesaj += "\n\n— " + ekler.join(" · ");

      // donus:false → eklenen kayıt geri okunmaz; ziyaretçinin mesajları
      // okuma yetkisi yok, aksi hâlde RLS ekleme işlemini geri alır.
      LM.db.insert("lm_mesajlar", kayit, { donus: false }).then(function () {
        form.style.display = "none";
        var ad = $("[data-doldur=ad]", basari);
        if (ad) ad.textContent = kayit.ad.split(" ")[0];
        var ep = $("[data-doldur=eposta]", basari);
        if (ep) ep.textContent = kayit.eposta;
        basari.classList.add("gorunur");
        basari.scrollIntoView({ behavior: "smooth", block: "center" });
        form.reset();
      }).catch(function (err) {
        var u = $("#formUyari");
        if (u) {
          u.className = "uyari uyari-hata";
          u.textContent = "Mesaj gönderilemedi: " + err.message;
          u.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }).then(function () {
        gonder.disabled = false;
        gonder.textContent = eskiYazi;
      });
    });

    var yeni = $("[data-yeni-mesaj]", basari);
    if (yeni) {
      yeni.addEventListener("click", function () {
        basari.classList.remove("gorunur");
        form.style.display = "";
        alanlar.forEach(function (i) { alanHata(i, ""); });
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Başlat                                                            */
  /* ---------------------------------------------------------------- */
  function basla() {
    ustBar();
    altBilgi();
    ustCubukEtkisi();
    belirmeKur();
    yukariDugme();
    googleBaglantilari();
    qrKodlari();

    if (SAYFA === "anasayfa") anaSayfa();
    else if (SAYFA === "menu") menuSayfasi();
    else if (SAYFA === "galeri") galeriSayfasi();
    else if (SAYFA === "quiz") quizSayfasi();
    else if (SAYFA === "iletisim") iletisimSayfasi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", basla);
  } else {
    basla();
  }
})();
