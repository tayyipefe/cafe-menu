/* ============================================================================
   La'mondes — Yönetim Paneli
   Bölümler: Özet · Menü · Galeri · Quiz Night · Mesajlar · Hesap
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  var durum = { kategoriler: [], urunler: [], galeri: [], etkinlikler: [], mesajlar: [] };
  var admin = null;

  /* ================================================================== */
  /* Yardımcılar                                                        */
  /* ================================================================== */
  function kacis(m) {
    return String(m == null ? "" : m)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fiyatYaz(n) {
    return Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ₺";
  }

  function tarihYaz(iso, saatli) {
    var d = new Date(iso);
    if (isNaN(d)) return "—";
    var s = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
    return saatli ? s + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : s;
  }

  function isoToYerel(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function yerelToIso(v) {
    if (!v) return null;
    var d = new Date(v);
    return isNaN(d) ? null : d.toISOString();
  }

  function bildir(mesaj, tip) {
    var kap = $("#bildirimler");
    if (!kap) return;
    var b = document.createElement("div");
    b.className = "bildirim " + (tip || "");
    b.textContent = mesaj;
    kap.appendChild(b);
    setTimeout(function () {
      b.style.opacity = "0";
      b.style.transition = "opacity .3s";
      setTimeout(function () { b.remove(); }, 320);
    }, 3600);
  }

  function hataGoster(e) {
    bildir(e && e.message ? e.message : "Beklenmeyen bir hata oluştu.", "hata");
  }

  function bosSatir(sutun, im, yazi) {
    return '<tr><td colspan="' + sutun + '"><div class="bos-satir"><span class="im">' +
      im + "</span>" + kacis(yazi) + "</div></td></tr>";
  }

  /* ================================================================== */
  /* Modal                                                              */
  /* ================================================================== */
  var modal = {
    ac: function (baslik, govde, dip) {
      var m = $("#modal");
      $("#modalBaslik", m).textContent = baslik;
      $("#modalGovde", m).innerHTML = govde;
      $("#modalDip", m).innerHTML = dip ||
        '<button class="btn btn-cizgi" type="button" data-kapat>Vazgeç</button>';
      m.classList.add("acik");
      m.setAttribute("aria-hidden", "false");
      document.body.classList.add("kilit");
      var ilk = $("input, select, textarea", $("#modalGovde", m));
      if (ilk) setTimeout(function () { ilk.focus(); }, 60);
      return m;
    },
    kapat: function () {
      var m = $("#modal");
      m.classList.remove("acik");
      m.setAttribute("aria-hidden", "true");
      document.body.classList.remove("kilit");
    }
  };

  function modalKur() {
    var m = $("#modal");
    m.addEventListener("click", function (e) {
      if (e.target === m || e.target.hasAttribute("data-kapat")) modal.kapat();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && m.classList.contains("acik")) modal.kapat();
    });
  }

  function onayIste(mesaj, geri) {
    modal.ac(
      "Emin misiniz?",
      "<p>" + kacis(mesaj) + "</p>",
      '<button class="btn btn-cizgi" type="button" data-kapat>Vazgeç</button>' +
      '<button class="btn btn-ana" type="button" id="onayEvet" style="background:var(--err)">Evet, sil</button>'
    );
    $("#onayEvet").addEventListener("click", function () {
      modal.kapat();
      geri();
    });
  }

  /* ================================================================== */
  /* Giriş koruması                                                     */
  /* ================================================================== */
  function koru() {
    return LM.auth.yoneticiMi().then(function (sonuc) {
      if (!sonuc) {
        window.location.replace("login.html?geri=1");
        return null;
      }
      admin = sonuc.admin;
      var k = $("#kullaniciBilgi");
      if (k) k.innerHTML = "<b>" + kacis(admin.ad || "Yönetici") + "</b>" + kacis(admin.eposta);
      return sonuc;
    });
  }

  /* ================================================================== */
  /* Bölüm yönlendirme                                                  */
  /* ================================================================== */
  var BOLUMLER = {
    ozet: { baslik: "Özet", aciklama: "Sitenizin güncel durumu.", ciz: cizOzet },
    menu: { baslik: "Menü Yönetimi", aciklama: "Kategorileri ve ürünleri düzenleyin.", ciz: cizMenu },
    galeri: { baslik: "Galeri Yönetimi", aciklama: "Fotoğraf yükleyin, silin, sıralayın.", ciz: cizGaleri },
    quiz: {
      baslik: "Quiz Night Yönetimi",
      aciklama: "Tema, tarih ve video ekleyin; yaklaşan ve geçmiş geceleri yönetin.",
      ciz: cizQuiz
    },
    mesajlar: { baslik: "Mesajlar", aciklama: "İletişim formundan gelen talepler.", ciz: cizMesajlar },
    hesap: { baslik: "Hesap", aciklama: "Şifrenizi değiştirin.", ciz: cizHesap }
  };

  function bolumAc(ad) {
    if (!BOLUMLER[ad]) ad = "ozet";
    $$(".yan-link").forEach(function (b) {
      b.classList.toggle("etkin", b.dataset.bolum === ad);
    });
    $("#bolumBaslik").textContent = BOLUMLER[ad].baslik;
    $("#bolumAciklama").textContent = BOLUMLER[ad].aciklama;
    $("#icerikAlani").innerHTML = '<div class="iskelet" style="padding:1rem"><i></i><i></i><i></i><i></i></div>';
    if (history.replaceState) history.replaceState(null, "", "#" + ad);
    yanKapat();
    BOLUMLER[ad].ciz();
  }

  /* ================================================================== */
  /* Veri yükleme                                                       */
  /* ================================================================== */
  function tumVeriler() {
    return Promise.all([
      LM.db.select("lm_kategoriler", { sirala: "sira.asc" }),
      LM.db.select("lm_urunler", { sirala: "sira.asc" }),
      LM.db.select("lm_galeri", { sirala: "sira.asc" }),
      LM.db.select("lm_etkinlikler", { sirala: "tarih.desc" }),
      LM.db.select("lm_mesajlar", { sirala: "created_at.desc", limit: 200 })
    ]).then(function (r) {
      durum.kategoriler = r[0]; durum.urunler = r[1]; durum.galeri = r[2];
      durum.etkinlikler = r[3]; durum.mesajlar = r[4];
      rozetleriGuncelle();
      return durum;
    });
  }

  var ANA_BASLIK = "Yönetim Paneli — La'mondes";
  var sonOkunmamis = null;

  function rozetYaz(okunmamis) {
    var r = $("#mesajRozet");
    if (r) {
      r.textContent = okunmamis || "";
      r.style.display = okunmamis ? "" : "none";
    }
    document.title = okunmamis ? "(" + okunmamis + ") " + ANA_BASLIK : ANA_BASLIK;
  }

  function rozetleriGuncelle() {
    var okunmamis = durum.mesajlar.filter(function (m) { return !m.okundu; }).length;
    rozetYaz(okunmamis);
    sonOkunmamis = okunmamis;
  }

  /* Panel açıkken yeni mesajları izler. Sayı artarsa rozet güncellenir ve
     bildirim çıkar; kullanıcı Mesajlar bölümündeyse liste tazelenir. */
  function bildirimIzle() {
    window.setInterval(function () {
      if (document.hidden) return;

      LM.db.select("lm_mesajlar", { sec: "id", esit: { okundu: false } })
        .then(function (satirlar) {
          var simdiki = satirlar.length;
          if (sonOkunmamis === null) { sonOkunmamis = simdiki; rozetYaz(simdiki); return; }

          if (simdiki > sonOkunmamis) {
            var fark = simdiki - sonOkunmamis;
            bildir(fark === 1 ? "Yeni bir mesaj geldi." : fark + " yeni mesaj geldi.", "basari");
            if ((location.hash || "") === "#mesajlar") cizMesajlar();
          }
          if (simdiki !== sonOkunmamis) rozetYaz(simdiki);
          sonOkunmamis = simdiki;
        })
        .catch(function () { /* geçici ağ hatalarında sessiz kal */ });
    }, 45000);
  }

  /* ================================================================== */
  /* ÖZET                                                               */
  /* ================================================================== */
  function cizOzet() {
    tumVeriler().then(function () {
      var yayindaki = durum.etkinlikler.filter(function (e) {
        return e.yayinda && new Date(e.tarih) >= new Date(Date.now() - 6 * 3600 * 1000);
      })[0];
      var tukenen = durum.urunler.filter(function (u) { return !u.stokta; }).length;
      var okunmamis = durum.mesajlar.filter(function (m) { return !m.okundu; }).length;

      $("#icerikAlani").innerHTML =
        '<div class="ozet">' +
        ozetKart(durum.kategoriler.length, "Kategori") +
        ozetKart(durum.urunler.length, "Ürün") +
        ozetKart(durum.galeri.length, "Galeri fotoğrafı") +
        ozetKart(okunmamis, "Okunmamış mesaj") +
        "</div>" +

        '<div class="veri-kart"><div class="veri-bas"><h2>Yaklaşan etkinlik</h2>' +
        '<button class="btn btn-cizgi btn-kucuk" type="button" data-git="quiz">Yönet</button></div>' +
        '<div style="padding:1.2rem">' +
        (yayindaki
          ? "<b>" + kacis(yayindaki.film_adi || yayindaki.baslik) + "</b><br>" +
            '<span style="color:var(--muted)">' + tarihYaz(yayindaki.tarih, true) + "</span>" +
            (yayindaki.geri_sayim ? ' <span class="durum durum-acik">Geri sayım açık</span>' : "") +
            (yayindaki.video_url ? ' <span class="durum durum-notr">Video var</span>' : "")
          : '<span style="color:var(--muted)">Yayında yaklaşan etkinlik yok. Sitede "Çok Yakında Yeni Etkinlik!" kartı görünüyor.</span>') +
        "</div></div>" +

        (tukenen
          ? '<div class="veri-kart"><div class="veri-bas"><h2>Stokta olmayan ürünler</h2>' +
            '<button class="btn btn-cizgi btn-kucuk" type="button" data-git="menu">Menüye git</button></div>' +
            '<div style="padding:1.2rem;color:var(--muted)">' +
            durum.urunler.filter(function (u) { return !u.stokta; })
              .map(function (u) { return kacis(u.ad); }).join(", ") +
            "</div></div>"
          : "") +

        '<div class="veri-kart"><div class="veri-bas"><h2>Son mesajlar</h2>' +
        '<button class="btn btn-cizgi btn-kucuk" type="button" data-git="mesajlar">Tümü</button></div>' +
        (durum.mesajlar.length
          ? durum.mesajlar.slice(0, 3).map(mesajKartHtml).join("")
          : '<div class="bos-satir"><span class="im">📭</span>Henüz mesaj yok.</div>') +
        "</div>";

      $$("[data-git]").forEach(function (b) {
        b.addEventListener("click", function () { bolumAc(b.dataset.git); });
      });
    }).catch(function (e) {
      $("#icerikAlani").innerHTML = '<div class="uyari uyari-hata">' + kacis(e.message) + "</div>";
    });
  }

  function ozetKart(sayi, etiket) {
    return '<div class="ozet-kart"><b>' + sayi + "</b><span>" + kacis(etiket) + "</span></div>";
  }

  /* ================================================================== */
  /* MENÜ YÖNETİMİ                                                      */
  /* ================================================================== */
  function cizMenu() {
    tumVeriler().then(function () {
      var html =
        '<div class="veri-kart"><div class="veri-bas"><h2>Kategoriler</h2>' +
        '<button class="btn btn-ana btn-kucuk" type="button" id="yeniKategori">+ Yeni kategori</button></div>' +
        '<div class="tablo-sarma"><table class="veri"><thead><tr>' +
        "<th>Sıra</th><th>Kategori</th><th>Ürün</th><th>Durum</th><th></th>" +
        "</tr></thead><tbody>" +
        (durum.kategoriler.length
          ? durum.kategoriler.map(kategoriSatir).join("")
          : bosSatir(5, "🍽️", "Henüz kategori yok. Ürün ekleyebilmek için önce bir kategori oluşturun.")) +
        "</tbody></table></div></div>" +

        '<div class="veri-kart"><div class="veri-bas"><h2>Ürünler</h2>' +
        '<div style="display:flex;gap:.5rem;align-items:center">' +
        '<select id="urunSuzgec" style="padding:.45rem .7rem;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:.85rem">' +
        '<option value="">Tüm kategoriler</option>' +
        durum.kategoriler.map(function (k) {
          return '<option value="' + k.id + '">' + kacis(k.ad) + "</option>";
        }).join("") +
        "</select>" +
        '<button class="btn btn-ana btn-kucuk" type="button" id="yeniUrun"' +
        (durum.kategoriler.length ? "" : " disabled") + ">+ Yeni ürün</button></div></div>" +
        '<div class="tablo-sarma"><table class="veri"><thead><tr>' +
        "<th>Sıra</th><th>Ürün</th><th>Kategori</th><th>Fiyat</th><th>Stok</th><th></th>" +
        "</tr></thead><tbody id=\"urunGovde\"></tbody></table></div></div>";

      $("#icerikAlani").innerHTML = html;

      $("#yeniKategori").addEventListener("click", function () { kategoriModal(null); });
      $("#yeniUrun").addEventListener("click", function () { urunModal(null); });
      $("#urunSuzgec").addEventListener("change", urunleriCiz);

      kategoriOlaylari();
      urunleriCiz();
    }).catch(function (e) {
      $("#icerikAlani").innerHTML = '<div class="uyari uyari-hata">' + kacis(e.message) + "</div>";
    });
  }

  function kategoriSatir(k, i) {
    var adet = durum.urunler.filter(function (u) { return u.kategori_id === k.id; }).length;
    return (
      "<tr>" +
      '<td><button class="mini-btn" data-kyukari="' + k.id + '"' + (i === 0 ? " disabled" : "") + '>↑</button> ' +
      '<button class="mini-btn" data-kasagi="' + k.id + '"' +
      (i === durum.kategoriler.length - 1 ? " disabled" : "") + ">↓</button></td>" +
      '<td class="ad-hucre"><b>' + kacis(k.ad) + "</b>" +
      (k.aciklama ? "<small>" + kacis(k.aciklama) + "</small>" : "") + "</td>" +
      "<td>" + adet + "</td>" +
      '<td><span class="durum ' + (k.aktif ? "durum-acik" : "durum-kapali") + '">' +
      (k.aktif ? "Yayında" : "Gizli") + "</span></td>" +
      '<td class="islem-hucre">' +
      '<button class="mini-btn" data-kduzenle="' + k.id + '">Düzenle</button> ' +
      '<button class="mini-btn tehlike" data-ksil="' + k.id + '">Sil</button></td></tr>'
    );
  }

  function kategoriOlaylari() {
    $$("[data-kduzenle]").forEach(function (b) {
      b.addEventListener("click", function () {
        kategoriModal(durum.kategoriler.filter(function (k) { return k.id === b.dataset.kduzenle; })[0]);
      });
    });
    $$("[data-ksil]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = durum.kategoriler.filter(function (x) { return x.id === b.dataset.ksil; })[0];
        var adet = durum.urunler.filter(function (u) { return u.kategori_id === k.id; }).length;
        onayIste(
          '"' + k.ad + '" kategorisi silinecek' +
          (adet ? " ve içindeki " + adet + " ürün de silinecek." : ".") + " Bu işlem geri alınamaz.",
          function () {
            LM.db.remove("lm_kategoriler", k.id).then(function () {
              bildir("Kategori silindi.", "basari");
              cizMenu();
            }).catch(hataGoster);
          }
        );
      });
    });
    $$("[data-kyukari]").forEach(function (b) {
      b.addEventListener("click", function () { siraDegistir("lm_kategoriler", durum.kategoriler, b.dataset.kyukari, -1, cizMenu); });
    });
    $$("[data-kasagi]").forEach(function (b) {
      b.addEventListener("click", function () { siraDegistir("lm_kategoriler", durum.kategoriler, b.dataset.kasagi, 1, cizMenu); });
    });
  }

  function siraDegistir(tablo, liste, id, yon, geri) {
    var i = liste.findIndex(function (x) { return x.id === id; });
    var j = i + yon;
    if (i < 0 || j < 0 || j >= liste.length) return;
    var a = liste[i], b = liste[j];
    Promise.all([
      LM.db.update(tablo, a.id, { sira: b.sira === a.sira ? b.sira + yon : b.sira }),
      LM.db.update(tablo, b.id, { sira: a.sira })
    ]).then(function () { geri(); }).catch(hataGoster);
  }

  function kategoriModal(k) {
    var yeni = !k;
    modal.ac(
      yeni ? "Yeni kategori" : "Kategoriyi düzenle",
      '<div class="form-izgara" style="grid-template-columns:1fr">' +
      alanHtml("Kategori adı", "kAd", "text", k ? k.ad : "", true, "Örn. Başlangıçlar") +
      alanHtml("Kısa açıklama", "kAciklama", "text", k ? k.aciklama || "" : "", false, "Menüde başlığın yanında görünür") +
      '<div class="alan"><label class="anahtar"><input type="checkbox" id="kAktif"' +
      (!k || k.aktif ? " checked" : "") + '><span class="yol"></span> Sitede yayında</label></div>' +
      "</div>",
      '<button class="btn btn-cizgi" type="button" data-kapat>Vazgeç</button>' +
      '<button class="btn btn-ana" type="button" id="kKaydet">Kaydet</button>'
    );

    $("#kKaydet").addEventListener("click", function () {
      var ad = $("#kAd").value.trim();
      if (ad.length < 2) { bildir("Kategori adı en az 2 karakter olmalı.", "hata"); return; }

      var veri = {
        ad: ad,
        aciklama: $("#kAciklama").value.trim() || null,
        aktif: $("#kAktif").checked
      };

      var islem;
      if (yeni) {
        veri.slug = slugYap(ad);
        veri.sira = durum.kategoriler.length + 1;
        islem = LM.db.insert("lm_kategoriler", veri);
      } else {
        islem = LM.db.update("lm_kategoriler", k.id, veri);
      }

      this.disabled = true;
      islem.then(function () {
        modal.kapat();
        bildir(yeni ? "Kategori eklendi." : "Kategori güncellendi.", "basari");
        cizMenu();
      }).catch(function (e) {
        hataGoster(e);
        $("#kKaydet").disabled = false;
      });
    });
  }

  function slugYap(s) {
    var harita = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
    return String(s).replace(/[çğıöşüÇĞİÖŞÜ]/g, function (c) { return harita[c]; })
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) ||
      "kategori-" + Date.now();
  }

  function urunleriCiz() {
    var suzgec = $("#urunSuzgec") ? $("#urunSuzgec").value : "";
    var liste = suzgec
      ? durum.urunler.filter(function (u) { return u.kategori_id === suzgec; })
      : durum.urunler;

    var govde = $("#urunGovde");
    if (!govde) return;

    govde.innerHTML = liste.length
      ? liste.map(function (u, i) {
          var kat = durum.kategoriler.filter(function (k) { return k.id === u.kategori_id; })[0];
          return (
            "<tr>" +
            '<td><button class="mini-btn" data-uyukari="' + u.id + '"' + (i === 0 ? " disabled" : "") + '>↑</button> ' +
            '<button class="mini-btn" data-uasagi="' + u.id + '"' + (i === liste.length - 1 ? " disabled" : "") + ">↓</button></td>" +
            '<td class="ad-hucre" style="display:flex;gap:.7rem;align-items:center">' +
            (u.gorsel_url ? '<img class="kucuk-gorsel" src="' + kacis(u.gorsel_url) + '" alt="">' : "") +
            "<span><b>" + kacis(u.ad) + "</b>" +
            (u.one_cikan ? ' <span class="durum durum-notr">Öne çıkan</span>' : "") +
            (u.aktif ? "" : ' <span class="durum durum-kapali">Gizli</span>') +
            (u.aciklama ? "<small>" + kacis(u.aciklama.slice(0, 60)) + (u.aciklama.length > 60 ? "…" : "") + "</small>" : "") +
            "</span></td>" +
            "<td>" + kacis(kat ? kat.ad : "—") + "</td>" +
            "<td>" + fiyatYaz(u.fiyat) + "</td>" +
            '<td><label class="anahtar"><input type="checkbox" data-stok="' + u.id + '"' +
            (u.stokta ? " checked" : "") + '><span class="yol"></span></label></td>' +
            '<td class="islem-hucre">' +
            '<button class="mini-btn" data-uduzenle="' + u.id + '">Düzenle</button> ' +
            '<button class="mini-btn tehlike" data-usil="' + u.id + '">Sil</button></td></tr>'
          );
        }).join("")
      : bosSatir(6, "🍰", "Bu görünümde ürün yok.");

    $$("[data-uduzenle]", govde).forEach(function (b) {
      b.addEventListener("click", function () {
        urunModal(durum.urunler.filter(function (u) { return u.id === b.dataset.uduzenle; })[0]);
      });
    });

    $$("[data-usil]", govde).forEach(function (b) {
      b.addEventListener("click", function () {
        var u = durum.urunler.filter(function (x) { return x.id === b.dataset.usil; })[0];
        onayIste('"' + u.ad + '" ürünü silinecek. Bu işlem geri alınamaz.', function () {
          LM.storage.sil(u.gorsel_path).then(function () {
            return LM.db.remove("lm_urunler", u.id);
          }).then(function () {
            bildir("Ürün silindi.", "basari");
            cizMenu();
          }).catch(hataGoster);
        });
      });
    });

    $$("[data-stok]", govde).forEach(function (c) {
      c.addEventListener("change", function () {
        LM.db.update("lm_urunler", c.dataset.stok, { stokta: c.checked }).then(function () {
          var u = durum.urunler.filter(function (x) { return x.id === c.dataset.stok; })[0];
          if (u) u.stokta = c.checked;
          bildir(c.checked ? "Ürün stokta olarak işaretlendi." : "Ürün tükendi olarak işaretlendi.", "basari");
        }).catch(function (e) { c.checked = !c.checked; hataGoster(e); });
      });
    });

    $$("[data-uyukari]", govde).forEach(function (b) {
      b.addEventListener("click", function () { siraDegistir("lm_urunler", liste, b.dataset.uyukari, -1, cizMenu); });
    });
    $$("[data-uasagi]", govde).forEach(function (b) {
      b.addEventListener("click", function () { siraDegistir("lm_urunler", liste, b.dataset.uasagi, 1, cizMenu); });
    });
  }

  function urunModal(u) {
    var yeni = !u;
    modal.ac(
      yeni ? "Yeni ürün" : "Ürünü düzenle",
      '<div class="form-izgara">' +
      '<div class="alan alan-tam"><label for="uKategori">Kategori <span class="zorunlu">*</span></label>' +
      '<select id="uKategori">' + durum.kategoriler.map(function (k) {
        return '<option value="' + k.id + '"' +
          (u && u.kategori_id === k.id ? " selected" : "") + ">" + kacis(k.ad) + "</option>";
      }).join("") + "</select><span class=\"alan-hata\"></span></div>" +

      alanHtml("Ürün adı", "uAd", "text", u ? u.ad : "", true, "Örn. Flat White", true) +
      alanHtml("Fiyat (₺)", "uFiyat", "number", u ? u.fiyat : "", true, "0") +

      '<div class="alan alan-tam"><label for="uAciklama">Açıklama</label>' +
      '<textarea id="uAciklama" style="min-height:90px" placeholder="İçindekiler, porsiyon bilgisi vb.">' +
      kacis(u ? u.aciklama || "" : "") + "</textarea><span class=\"alan-hata\"></span></div>" +

      '<div class="alan alan-tam"><label for="uGorsel">Ürün görseli</label>' +
      '<input type="file" id="uGorsel" accept="image/*">' +
      '<input type="url" id="uGorselUrl" placeholder="veya görsel bağlantısı yapıştırın" value="' +
      kacis(u ? u.gorsel_url || "" : "") + '" style="margin-top:.4rem">' +
      (u && u.gorsel_url ? '<img class="onizleme" id="uOnizleme" src="' + kacis(u.gorsel_url) + '" alt="">' :
        '<img class="onizleme" id="uOnizleme" style="display:none" alt="">') +
      "<span class=\"alan-hata\"></span></div>" +

      '<div class="alan"><label class="anahtar"><input type="checkbox" id="uStok"' +
      (!u || u.stokta ? " checked" : "") + '><span class="yol"></span> Stokta var</label></div>' +
      '<div class="alan"><label class="anahtar"><input type="checkbox" id="uOne"' +
      (u && u.one_cikan ? " checked" : "") + '><span class="yol"></span> Ana sayfada öne çıkar</label></div>' +
      '<div class="alan alan-tam"><label class="anahtar"><input type="checkbox" id="uAktif"' +
      (!u || u.aktif ? " checked" : "") + '><span class="yol"></span> Menüde yayında</label></div>' +
      "</div>",

      '<button class="btn btn-cizgi" type="button" data-kapat>Vazgeç</button>' +
      '<button class="btn btn-ana" type="button" id="uKaydet">Kaydet</button>'
    );

    var dosya = $("#uGorsel"), urlAlan = $("#uGorselUrl"), onizleme = $("#uOnizleme");
    dosya.addEventListener("change", function () {
      if (!dosya.files[0]) return;
      onizleme.src = URL.createObjectURL(dosya.files[0]);
      onizleme.style.display = "";
      urlAlan.value = "";
    });
    urlAlan.addEventListener("input", function () {
      if (urlAlan.value.trim()) {
        onizleme.src = urlAlan.value.trim();
        onizleme.style.display = "";
      }
    });

    $("#uKaydet").addEventListener("click", function () {
      var btn = this;
      var ad = $("#uAd").value.trim();
      var fiyat = parseFloat($("#uFiyat").value);

      if (ad.length < 2) { bildir("Ürün adı en az 2 karakter olmalı.", "hata"); return; }
      if (isNaN(fiyat) || fiyat < 0) { bildir("Geçerli bir fiyat girin.", "hata"); return; }
      if (!$("#uKategori").value) { bildir("Önce bir kategori seçin.", "hata"); return; }

      btn.disabled = true;
      btn.textContent = "Kaydediliyor…";

      var gorselIsi = dosya.files[0]
        ? LM.storage.yukle(dosya.files[0], "urunler")
        : Promise.resolve(null);

      gorselIsi.then(function (yuklenen) {
        var veri = {
          kategori_id: $("#uKategori").value,
          ad: ad,
          aciklama: $("#uAciklama").value.trim() || null,
          fiyat: fiyat,
          stokta: $("#uStok").checked,
          one_cikan: $("#uOne").checked,
          aktif: $("#uAktif").checked
        };

        if (yuklenen) {
          veri.gorsel_url = yuklenen.url;
          veri.gorsel_path = yuklenen.yol;
        } else if (urlAlan.value.trim()) {
          veri.gorsel_url = urlAlan.value.trim();
          veri.gorsel_path = null;
        }

        if (yeni) {
          veri.sira = durum.urunler.filter(function (x) {
            return x.kategori_id === veri.kategori_id;
          }).length + 1;
          return LM.db.insert("lm_urunler", veri);
        }
        // Yeni görsel yüklendiyse eskisini depodan temizle
        if (yuklenen && u.gorsel_path) LM.storage.sil(u.gorsel_path);
        return LM.db.update("lm_urunler", u.id, veri);
      }).then(function () {
        modal.kapat();
        bildir(yeni ? "Ürün eklendi." : "Ürün güncellendi.", "basari");
        cizMenu();
      }).catch(function (e) {
        hataGoster(e);
        btn.disabled = false;
        btn.textContent = "Kaydet";
      });
    });
  }

  function alanHtml(etiket, id, tip, deger, zorunlu, ipucu, tamMi) {
    return (
      '<div class="alan' + (tamMi ? " alan-tam" : "") + '">' +
      '<label for="' + id + '">' + kacis(etiket) +
      (zorunlu ? ' <span class="zorunlu">*</span>' : "") + "</label>" +
      '<input type="' + tip + '" id="' + id + '" value="' + kacis(deger) + '"' +
      (tip === "number" ? ' step="0.01" min="0"' : "") +
      (ipucu ? ' placeholder="' + kacis(ipucu) + '"' : "") + ">" +
      '<span class="alan-hata"></span></div>'
    );
  }

  /* ================================================================== */
  /* GALERİ YÖNETİMİ                                                    */
  /* ================================================================== */
  function cizGaleri() {
    tumVeriler().then(function () {
      $("#icerikAlani").innerHTML =
        '<div class="veri-kart">' +
        '<div class="veri-bas"><h2>Fotoğraflar</h2>' +
        '<span class="yan-bilgi">' + durum.galeri.length + " fotoğraf</span></div>" +

        '<div class="yukleme-alani" id="yuklemeAlani">' +
        '<span class="im">📤</span>' +
        "<b>Fotoğraf yüklemek için tıklayın veya sürükleyip bırakın</b>" +
        "<small>JPG, PNG, WebP · en fazla 5 MB · birden fazla seçebilirsiniz</small>" +
        '<input type="file" id="galeriDosya" accept="image/*" multiple hidden></div>' +
        '<div class="ilerleme" id="ilerleme" style="display:none"><i></i></div>' +

        (durum.galeri.length
          ? '<div class="y-galeri">' + durum.galeri.map(fotoKart).join("") + "</div>"
          : '<div class="bos-satir"><span class="im">🖼️</span>Henüz fotoğraf yok.</div>') +
        "</div>";

      yuklemeKur();
      fotoOlaylari();
    }).catch(function (e) {
      $("#icerikAlani").innerHTML = '<div class="uyari uyari-hata">' + kacis(e.message) + "</div>";
    });
  }

  function fotoKart(g, i) {
    return (
      '<div class="y-foto">' +
      '<img src="' + kacis(g.gorsel_url) + '" alt="' + kacis(g.baslik || "") + '" loading="lazy">' +
      '<div class="y-foto-alt"><b>' + kacis(g.baslik || "Başlıksız") + "</b>" +
      '<div class="y-foto-islem">' +
      '<button class="mini-btn" data-gyukari="' + g.id + '"' + (i === 0 ? " disabled" : "") + ' title="Öne al">↑</button>' +
      '<button class="mini-btn" data-gasagi="' + g.id + '"' +
      (i === durum.galeri.length - 1 ? " disabled" : "") + ' title="Geri al">↓</button>' +
      '<button class="mini-btn" data-gduzenle="' + g.id + '">Düzenle</button>' +
      '<button class="mini-btn tehlike" data-gsil="' + g.id + '">Sil</button>' +
      "</div></div></div>"
    );
  }

  function yuklemeKur() {
    var alan = $("#yuklemeAlani"), girdi = $("#galeriDosya");
    alan.addEventListener("click", function () { girdi.click(); });
    girdi.addEventListener("change", function () { fotolariYukle(girdi.files); });

    ["dragenter", "dragover"].forEach(function (o) {
      alan.addEventListener(o, function (e) { e.preventDefault(); alan.classList.add("uzerinde"); });
    });
    ["dragleave", "drop"].forEach(function (o) {
      alan.addEventListener(o, function (e) { e.preventDefault(); alan.classList.remove("uzerinde"); });
    });
    alan.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files.length) fotolariYukle(e.dataTransfer.files);
    });
  }

  function fotolariYukle(dosyalar) {
    var liste = Array.prototype.slice.call(dosyalar).filter(function (d) {
      return /^image\//.test(d.type);
    });
    if (!liste.length) { bildir("Lütfen bir görsel dosyası seçin.", "hata"); return; }

    var buyuk = liste.filter(function (d) { return d.size > 5 * 1024 * 1024; });
    if (buyuk.length) {
      bildir(buyuk.length + " dosya 5 MB sınırını aşıyor, atlanacak.", "hata");
      liste = liste.filter(function (d) { return d.size <= 5 * 1024 * 1024; });
      if (!liste.length) return;
    }

    var cubuk = $("#ilerleme");
    cubuk.style.display = "";
    var bitti = 0, sonrakiSira = durum.galeri.length;

    function ilerlet() {
      bitti++;
      $("i", cubuk).style.width = Math.round((bitti / liste.length) * 100) + "%";
    }

    liste.reduce(function (zincir, dosya, i) {
      return zincir.then(function () {
        return LM.storage.yukle(dosya, "galeri").then(function (y) {
          return LM.db.insert("lm_galeri", {
            baslik: dosya.name.replace(/\.[^.]+$/, "").slice(0, 80),
            gorsel_url: y.url,
            gorsel_path: y.yol,
            sira: sonrakiSira + i + 1,
            aktif: true
          });
        }).then(ilerlet);
      });
    }, Promise.resolve()).then(function () {
      bildir(liste.length + " fotoğraf yüklendi.", "basari");
      cizGaleri();
    }).catch(function (e) {
      hataGoster(e);
      cubuk.style.display = "none";
    });
  }

  function fotoOlaylari() {
    $$("[data-gsil]").forEach(function (b) {
      b.addEventListener("click", function () {
        var g = durum.galeri.filter(function (x) { return x.id === b.dataset.gsil; })[0];
        onayIste("Bu fotoğraf galeriden ve depodan kalıcı olarak silinecek.", function () {
          LM.storage.sil(g.gorsel_path).then(function () {
            return LM.db.remove("lm_galeri", g.id);
          }).then(function () {
            bildir("Fotoğraf silindi.", "basari");
            cizGaleri();
          }).catch(hataGoster);
        });
      });
    });

    $$("[data-gduzenle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var g = durum.galeri.filter(function (x) { return x.id === b.dataset.gduzenle; })[0];
        modal.ac(
          "Fotoğraf bilgisi",
          '<div class="form-izgara" style="grid-template-columns:1fr">' +
          '<img class="onizleme" src="' + kacis(g.gorsel_url) + '" alt="">' +
          alanHtml("Başlık", "gBaslik", "text", g.baslik || "", false, "Örn. Ana Salonumuz") +
          alanHtml("Açıklama", "gAciklama", "text", g.aciklama || "", false, "Örn. Mekân · 48 kişilik") +
          '<div class="alan"><label class="anahtar"><input type="checkbox" id="gAktif"' +
          (g.aktif ? " checked" : "") + '><span class="yol"></span> Galeride yayında</label></div>' +
          "</div>",
          '<button class="btn btn-cizgi" type="button" data-kapat>Vazgeç</button>' +
          '<button class="btn btn-ana" type="button" id="gKaydet">Kaydet</button>'
        );
        $("#gKaydet").addEventListener("click", function () {
          this.disabled = true;
          LM.db.update("lm_galeri", g.id, {
            baslik: $("#gBaslik").value.trim() || null,
            aciklama: $("#gAciklama").value.trim() || null,
            aktif: $("#gAktif").checked
          }).then(function () {
            modal.kapat();
            bildir("Fotoğraf güncellendi.", "basari");
            cizGaleri();
          }).catch(hataGoster);
        });
      });
    });

    $$("[data-gyukari]").forEach(function (b) {
      b.addEventListener("click", function () { siraDegistir("lm_galeri", durum.galeri, b.dataset.gyukari, -1, cizGaleri); });
    });
    $$("[data-gasagi]").forEach(function (b) {
      b.addEventListener("click", function () { siraDegistir("lm_galeri", durum.galeri, b.dataset.gasagi, 1, cizGaleri); });
    });
  }

  /* ================================================================== */
  /* QUIZ NIGHT                                                         */
  /* ================================================================== */
  /* Etkinlik akşamı boyunca hâlâ "yaklaşan" sayılsın diye 6 saat pay. */
  var ETKINLIK_PAYI = 6 * 3600 * 1000;

  function yaklasanMi(e) {
    return new Date(e.tarih).getTime() >= Date.now() - ETKINLIK_PAYI;
  }

  function cizQuiz() {
    tumVeriler().then(function () {
      var yaklasanlar = durum.etkinlikler.filter(yaklasanMi)
        .sort(function (a, b) { return new Date(a.tarih) - new Date(b.tarih); });
      var gecmisler = durum.etkinlikler.filter(function (e) { return !yaklasanMi(e); });

      $("#icerikAlani").innerHTML =
        '<div class="uyari uyari-bilgi">' +
        "Sitede yalnızca <strong>yayında</strong> olan etkinlikler görünür. " +
        "Tarihi gelecekte olanlar <strong>Yaklaşan Quiz Night</strong> bölümünde, " +
        "geçmiş olanlar <strong>Arşiv</strong> bölümünde videolarıyla listelenir. " +
        "Yayında yaklaşan etkinlik yoksa ziyaretçiler " +
        '&quot;Çok Yakında Yeni Etkinlik!&quot; kartını görür.' +
        "</div>" +

        etkinlikTablosu("Yaklaşan etkinlikler", yaklasanlar, "🎬",
          "Yaklaşan etkinlik yok. Yeni bir tema ve tarih ekleyin.", true) +

        etkinlikTablosu("Geçmiş etkinlikler (arşiv)", gecmisler, "🗂️",
          "Henüz geçmiş etkinlik yok.", false);

      var yeni = $("#yeniEtkinlik");
      if (yeni) yeni.addEventListener("click", function () { etkinlikModal(null); });
      etkinlikOlaylari();
    }).catch(function (e) {
      $("#icerikAlani").innerHTML = '<div class="uyari uyari-hata">' + kacis(e.message) + "</div>";
    });
  }

  function etkinlikTablosu(baslik, liste, im, bosMesaj, dugmeVar) {
    return (
      '<div class="veri-kart"><div class="veri-bas"><h2>' + kacis(baslik) + "</h2>" +
      '<div style="display:flex;gap:.6rem;align-items:center">' +
      '<span class="yan-bilgi">' + liste.length + " kayıt</span>" +
      (dugmeVar
        ? '<button class="btn btn-ana btn-kucuk" type="button" id="yeniEtkinlik">+ Yeni Quiz Night</button>'
        : "") +
      "</div></div>" +
      '<div class="tablo-sarma"><table class="veri"><thead><tr>' +
      "<th>Tema / Film</th><th>Tarih ve saat</th><th>Video</th><th>Yayın</th><th>Geri sayım</th><th></th>" +
      "</tr></thead><tbody>" +
      (liste.length ? liste.map(etkinlikSatir).join("") : bosSatir(6, im, bosMesaj)) +
      "</tbody></table></div></div>"
    );
  }

  function etkinlikSatir(e) {
    var yaklasan = yaklasanMi(e);
    return (
      "<tr>" +
      '<td class="ad-hucre" style="display:flex;gap:.7rem;align-items:center">' +
      (e.afis_url ? '<img class="kucuk-gorsel" src="' + kacis(e.afis_url) + '" alt="">' : "") +
      "<span><b>" + kacis(e.film_adi || e.baslik || "—") + "</b>" +
      '<small><span class="durum ' + (yaklasan ? "durum-acik" : "durum-notr") + '">' +
      (yaklasan ? "Yaklaşan" : "Geçmiş") + "</span></small></span></td>" +
      "<td>" + tarihYaz(e.tarih, true) + "</td>" +
      "<td>" + (e.video_url
        ? '<span class="durum durum-acik">Var</span>'
        : '<span class="durum durum-notr">Yok</span>') + "</td>" +
      '<td><label class="anahtar"><input type="checkbox" data-eyayin="' + e.id + '"' +
      (e.yayinda ? " checked" : "") + '><span class="yol"></span></label></td>' +
      '<td><label class="anahtar"><input type="checkbox" data-egeri="' + e.id + '"' +
      (e.geri_sayim ? " checked" : "") + '><span class="yol"></span></label></td>' +
      '<td class="islem-hucre">' +
      '<button class="mini-btn" data-eduzenle="' + e.id + '">Düzenle</button> ' +
      '<button class="mini-btn tehlike" data-esil="' + e.id + '">Sil</button></td></tr>'
    );
  }

  function etkinlikOlaylari() {
    $$("[data-eyayin]").forEach(function (c) {
      c.addEventListener("change", function () {
        LM.db.update("lm_etkinlikler", c.dataset.eyayin, { yayinda: c.checked }).then(function () {
          bildir(c.checked ? "Etkinlik sitede yayınlandı." : "Etkinlik yayından kaldırıldı.", "basari");
        }).catch(function (e) { c.checked = !c.checked; hataGoster(e); });
      });
    });
    $$("[data-egeri]").forEach(function (c) {
      c.addEventListener("change", function () {
        LM.db.update("lm_etkinlikler", c.dataset.egeri, { geri_sayim: c.checked }).then(function () {
          bildir(c.checked ? "Geri sayım kartı açıldı." : "Geri sayım kartı kapatıldı.", "basari");
        }).catch(function (e) { c.checked = !c.checked; hataGoster(e); });
      });
    });
    $$("[data-eduzenle]").forEach(function (b) {
      b.addEventListener("click", function () {
        etkinlikModal(durum.etkinlikler.filter(function (x) { return x.id === b.dataset.eduzenle; })[0]);
      });
    });
    $$("[data-esil]").forEach(function (b) {
      b.addEventListener("click", function () {
        var e = durum.etkinlikler.filter(function (x) { return x.id === b.dataset.esil; })[0];
        onayIste(
          '"' + (e.film_adi || e.baslik) + '" etkinliği silinecek. ' +
          "Yüklenmiş afiş ve video dosyaları da depodan kaldırılır.",
          function () {
            Promise.all([LM.storage.sil(e.afis_path), LM.storage.sil(e.video_path)])
              .then(function () { return LM.db.remove("lm_etkinlikler", e.id); })
              .then(function () {
                bildir("Etkinlik silindi.", "basari");
                cizQuiz();
              }).catch(hataGoster);
          }
        );
      });
    });
  }

  /* Yeni etkinlik için varsayılan: yarın 20:30 (quiz geceleri 20:30'da başlar) */
  function varsayilanTarih() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(20, 30, 0, 0);
    return isoToYerel(d.toISOString());
  }

  var VIDEO_SINIRI = 50 * 1024 * 1024; // 50 MB

  function etkinlikModal(e) {
    var yeni = !e;
    modal.ac(
      yeni ? "Yeni Quiz Night" : "Quiz Night'ı düzenle",
      '<div class="form-izgara">' +

      alanHtml("Film / Tema adı", "eFilm", "text", e ? e.film_adi || "" : "", true,
               "Örn. Yüzüklerin Efendisi", true) +

      '<div class="alan"><label for="eTarih">Tarih ve saat <span class="zorunlu">*</span></label>' +
      '<input type="datetime-local" id="eTarih" value="' +
      (e ? isoToYerel(e.tarih) : varsayilanTarih()) + '">' +
      '<span class="alan-hata" style="color:var(--muted);font-weight:400">Quiz geceleri 20:30\'da başlar.</span></div>' +

      alanHtml("Konum", "eKonum", "text",
               e ? e.konum || "" : "La'mondes Cafe & Bakery — Körfez, Kocaeli", false, "") +

      '<div class="alan alan-tam"><label for="eAciklama">Açıklama</label>' +
      '<textarea id="eAciklama" style="min-height:80px" placeholder="Bu geceyi kısaca anlatın (isteğe bağlı).">' +
      kacis(e ? e.aciklama || "" : "") + "</textarea><span class=\"alan-hata\"></span></div>" +

      /* --- VİDEO --- */
      '<div class="alan alan-tam" style="border-top:1px solid var(--line);padding-top:1rem">' +
      '<label for="eVideoUrl">Video bağlantısı</label>' +
      '<input type="text" id="eVideoUrl" value="' + kacis(e ? e.video_url || "" : "") + '" ' +
      'placeholder="Instagram, YouTube bağlantısı veya embed kodu yapıştırın">' +
      '<span class="alan-hata" style="color:var(--muted);font-weight:400">' +
      "Instagram gönderi/reels bağlantısı, YouTube bağlantısı veya hazır embed kodu olabilir." +
      "</span></div>" +

      '<div class="alan alan-tam"><label for="eVideoDosya">…veya video dosyası yükleyin</label>' +
      '<input type="file" id="eVideoDosya" accept="video/mp4,video/webm,video/quicktime">' +
      '<span class="alan-hata" style="color:var(--muted);font-weight:400">' +
      "En fazla 50 MB. Bağlantı kullanmak daha hızlıdır ve depolama kotanızı doldurmaz." +
      "</span></div>" +

      /* --- AFİŞ --- */
      '<div class="alan alan-tam" style="border-top:1px solid var(--line);padding-top:1rem">' +
      '<label for="eAfis">Etkinlik afişi</label>' +
      '<input type="file" id="eAfis" accept="image/*">' +
      (e && e.afis_url
        ? '<img class="onizleme" id="eOnizleme" src="' + kacis(e.afis_url) + '" alt="">'
        : '<img class="onizleme" id="eOnizleme" style="display:none" alt="">') +
      "<span class=\"alan-hata\"></span></div>" +

      '<div class="alan alan-tam"><label for="eKatilim">Katılım detayları</label>' +
      '<textarea id="eKatilim" style="min-height:90px" ' +
      'placeholder="Her satır sitede ayrı bir madde olarak görünür.">' +
      kacis(e ? e.katilim || "" : "") + "</textarea>" +
      '<span class="alan-hata" style="color:var(--muted);font-weight:400">' +
      "Ücretsiz katılım, 20:30 başlangıç ve ödüller sitede zaten sabit yazıyor — burada tekrarlamanıza gerek yok." +
      "</span></div>" +

      '<div class="alan"><label class="anahtar"><input type="checkbox" id="eYayin"' +
      (e && e.yayinda ? " checked" : "") + '><span class="yol"></span> Sitede yayınla</label></div>' +
      '<div class="alan"><label class="anahtar"><input type="checkbox" id="eGeri"' +
      (!e || e.geri_sayim ? " checked" : "") + '><span class="yol"></span> Geri sayım göster</label></div>' +
      "</div>",

      '<button class="btn btn-cizgi" type="button" data-kapat>Vazgeç</button>' +
      '<button class="btn btn-ana" type="button" id="eKaydet">Kaydet</button>'
    );

    var afis = $("#eAfis"), onizleme = $("#eOnizleme"), videoDosya = $("#eVideoDosya");

    afis.addEventListener("change", function () {
      if (!afis.files[0]) return;
      onizleme.src = URL.createObjectURL(afis.files[0]);
      onizleme.style.display = "";
    });

    videoDosya.addEventListener("change", function () {
      var d = videoDosya.files[0];
      if (!d) return;
      if (d.size > VIDEO_SINIRI) {
        bildir("Video 50 MB sınırını aşıyor (" + Math.round(d.size / 1048576) + " MB). " +
               "Instagram veya YouTube bağlantısı kullanmayı deneyin.", "hata");
        videoDosya.value = "";
      }
    });

    $("#eKaydet").addEventListener("click", function () {
      var btn = this;
      var film = $("#eFilm").value.trim();
      var tarih = yerelToIso($("#eTarih").value);

      if (film.length < 2) { bildir("Film / tema adı gerekli.", "hata"); return; }
      if (!tarih) { bildir("Geçerli bir tarih ve saat seçin.", "hata"); return; }

      var vd = videoDosya.files[0];
      if (vd && vd.size > VIDEO_SINIRI) { bildir("Video 50 MB sınırını aşıyor.", "hata"); return; }

      btn.disabled = true;
      btn.textContent = "Kaydediliyor…";

      Promise.all([
        afis.files[0] ? LM.storage.yukle(afis.files[0], "etkinlik") : Promise.resolve(null),
        vd ? LM.storage.yukle(vd, "quiz-video") : Promise.resolve(null)
      ]).then(function (sonuc) {
        var yeniAfis = sonuc[0], yeniVideo = sonuc[1];

        var veri = {
          baslik: "Quiz Night",
          film_adi: film,
          tarih: tarih,
          konum: $("#eKonum").value.trim() || null,
          aciklama: $("#eAciklama").value.trim() || null,
          katilim: $("#eKatilim").value.trim() || null,
          yayinda: $("#eYayin").checked,
          geri_sayim: $("#eGeri").checked
        };

        if (yeniAfis) { veri.afis_url = yeniAfis.url; veri.afis_path = yeniAfis.yol; }

        if (yeniVideo) {
          /* Dosya yüklendiyse dosya kazanır; metin kutusundaki adres yok sayılır. */
          veri.video_url = yeniVideo.url;
          veri.video_path = yeniVideo.yol;
        } else {
          var url = $("#eVideoUrl").value.trim();
          veri.video_url = url || null;
          /* Adres elle değiştirildiyse eski yüklenmiş dosyanın izini bırakma */
          if (!yeni && e.video_path && url !== e.video_url) veri.video_path = null;
        }

        if (yeni) return LM.db.insert("lm_etkinlikler", veri);

        /* Yenisi yüklendiyse eski dosyaları depodan temizle */
        if (yeniAfis && e.afis_path) LM.storage.sil(e.afis_path);
        if (e.video_path && veri.video_path !== e.video_path) LM.storage.sil(e.video_path);

        return LM.db.update("lm_etkinlikler", e.id, veri);
      }).then(function () {
        modal.kapat();
        bildir(yeni ? "Quiz Night oluşturuldu." : "Quiz Night güncellendi.", "basari");
        cizQuiz();
      }).catch(function (err) {
        hataGoster(err);
        btn.disabled = false;
        btn.textContent = "Kaydet";
      });
    });
  }

  /* ================================================================== */
  /* MESAJLAR                                                           */
  /* ================================================================== */
  function cizMesajlar() {
    tumVeriler().then(function () {
      $("#icerikAlani").innerHTML =
        '<div class="veri-kart"><div class="veri-bas"><h2>Gelen mesajlar</h2>' +
        '<span class="yan-bilgi">' + durum.mesajlar.length + " kayıt · " +
        durum.mesajlar.filter(function (m) { return !m.okundu; }).length + " okunmamış</span></div>" +
        (durum.mesajlar.length
          ? durum.mesajlar.map(mesajKartHtml).join("")
          : '<div class="bos-satir"><span class="im">📭</span>Henüz mesaj gelmedi.</div>') +
        "</div>";
      mesajOlaylari();
    }).catch(function (e) {
      $("#icerikAlani").innerHTML = '<div class="uyari uyari-hata">' + kacis(e.message) + "</div>";
    });
  }

  function mesajKartHtml(m) {
    return (
      '<div class="mesaj-kart' + (m.okundu ? "" : " okunmadi") + '">' +
      '<div class="mesaj-ust"><b>' + kacis(m.ad) + "</b>" +
      '<span class="durum durum-notr">' + kacis(m.konu) + "</span>" +
      '<span class="zaman">' + tarihYaz(m.created_at, true) + "</span></div>" +
      '<p class="mesaj-govde">' + kacis(m.mesaj) + "</p>" +
      '<div class="mesaj-meta">' +
      '<a href="mailto:' + kacis(m.eposta) + '">✉️ ' + kacis(m.eposta) + "</a>" +
      (m.telefon ? '<a href="tel:' + kacis(m.telefon.replace(/\s/g, "")) + '">📞 ' + kacis(m.telefon) + "</a>" : "") +
      '<button class="mini-btn" data-mokundu="' + m.id + '" style="margin-left:auto">' +
      (m.okundu ? "Okunmadı yap" : "Okundu işaretle") + "</button>" +
      '<button class="mini-btn tehlike" data-msil="' + m.id + '">Sil</button>' +
      "</div></div>"
    );
  }

  function mesajOlaylari() {
    $$("[data-mokundu]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = durum.mesajlar.filter(function (x) { return x.id === b.dataset.mokundu; })[0];
        LM.db.update("lm_mesajlar", m.id, { okundu: !m.okundu }).then(function () {
          cizMesajlar();
        }).catch(hataGoster);
      });
    });
    $$("[data-msil]").forEach(function (b) {
      b.addEventListener("click", function () {
        onayIste("Bu mesaj kalıcı olarak silinecek.", function () {
          LM.db.remove("lm_mesajlar", b.dataset.msil).then(function () {
            bildir("Mesaj silindi.", "basari");
            cizMesajlar();
          }).catch(hataGoster);
        });
      });
    });
  }

  /* ================================================================== */
  /* HESAP                                                              */
  /* ================================================================== */
  function cizHesap() {
    $("#icerikAlani").innerHTML =
      '<div class="veri-kart" style="max-width:520px">' +
      '<div class="veri-bas"><h2>Şifre değiştir</h2></div>' +
      '<div style="padding:1.4rem">' +
      '<div class="form-izgara" style="grid-template-columns:1fr">' +
      '<div class="alan"><label for="sYeni">Yeni şifre</label>' +
      '<input type="password" id="sYeni" autocomplete="new-password" placeholder="En az 8 karakter">' +
      '<span class="alan-hata"></span></div>' +
      '<div class="alan"><label for="sTekrar">Yeni şifre (tekrar)</label>' +
      '<input type="password" id="sTekrar" autocomplete="new-password">' +
      '<span class="alan-hata"></span></div>' +
      '<button class="btn btn-ana" type="button" id="sKaydet">Şifreyi Güncelle</button>' +
      "</div></div></div>" +

      '<div class="veri-kart" style="max-width:520px">' +
      '<div class="veri-bas"><h2>Oturum</h2></div>' +
      '<div style="padding:1.4rem">' +
      '<p style="color:var(--muted);font-size:.9rem">Giriş yapan: <strong>' +
      kacis(admin ? admin.eposta : "") + "</strong></p>" +
      '<button class="btn btn-cizgi" type="button" id="cikisYap2">Çıkış Yap</button>' +
      "</div></div>";

    $("#sKaydet").addEventListener("click", function () {
      var yeni = $("#sYeni").value, tekrar = $("#sTekrar").value;
      if (yeni.length < 8) { bildir("Şifre en az 8 karakter olmalı.", "hata"); return; }
      if (yeni !== tekrar) { bildir("Şifreler eşleşmiyor.", "hata"); return; }

      this.disabled = true;
      LM.auth.sifreDegistir(yeni).then(function () {
        bildir("Şifreniz güncellendi.", "basari");
        $("#sYeni").value = ""; $("#sTekrar").value = "";
      }).catch(hataGoster).then(function () {
        var b = $("#sKaydet");
        if (b) b.disabled = false;
      });
    });

    $("#cikisYap2").addEventListener("click", cikis);
  }

  /* ================================================================== */
  /* Yan menü / mobil                                                   */
  /* ================================================================== */
  function yanKapat() {
    var y = $("#yanMenu"), p = $("#yanPerde");
    if (y) y.classList.remove("acik");
    if (p) p.classList.remove("gorunur");
  }

  function yanKur() {
    var dugme = $("#yanDugme"), y = $("#yanMenu"), p = $("#yanPerde");
    if (dugme) {
      dugme.addEventListener("click", function () {
        y.classList.toggle("acik");
        p.classList.toggle("gorunur", y.classList.contains("acik"));
      });
    }
    if (p) p.addEventListener("click", yanKapat);
  }

  function cikis() {
    LM.auth.cikisYap().then(function () {
      window.location.replace("login.html");
    });
  }

  /* ================================================================== */
  /* Başlat                                                             */
  /* ================================================================== */
  function basla() {
    modalKur();
    yanKur();

    koru().then(function (s) {
      if (!s) return;
      $("#panel").style.visibility = "visible";

      $$(".yan-link").forEach(function (b) {
        b.addEventListener("click", function () { bolumAc(b.dataset.bolum); });
      });
      $("#cikisYap").addEventListener("click", cikis);

      bolumAc((location.hash || "").replace("#", "") || "ozet");
      bildirimIzle();
    }).catch(function (e) {
      hataGoster(e);
      window.location.replace("login.html");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", basla);
  else basla();
})();
