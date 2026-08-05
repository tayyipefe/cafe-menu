/* ============================================================================
   La'mondes — Minimal Supabase İstemcisi
   Supabase'in REST (PostgREST), Auth (GoTrue) ve Storage API'lerini düz fetch
   ile kullanır. Harici kütüphane gerektirmez (~7 KB).

   Kullanım:
     LM.db.select("lm_urunler", { esit: { aktif: true }, sirala: "sira" })
     LM.db.insert("lm_urunler", { ad: "..." })
     LM.db.update("lm_urunler", id, { fiyat: 120 })
     LM.db.remove("lm_urunler", id)
     LM.auth.girisYap(eposta, sifre) / cikisYap() / oturum() / kullanici()
     LM.storage.yukle(file, "galeri") / sil(path) / url(path)
   ========================================================================== */
(function (window) {
  "use strict";

  var CFG = window.LM_CONFIG || {};
  var URL_BASE = (CFG.SUPABASE_URL || "").replace(/\/+$/, "");
  var ANON = CFG.SUPABASE_ANON_KEY || "";
  var BUCKET = CFG.BUCKET || "lm-medya";
  var DEPO = "lm_oturum";

  /* ------------------------------------------------------------------ */
  /* Oturum saklama                                                     */
  /* ------------------------------------------------------------------ */
  var oturumOnbellek = null;

  function oturumOku() {
    if (oturumOnbellek) return oturumOnbellek;
    try {
      var ham = window.localStorage.getItem(DEPO);
      oturumOnbellek = ham ? JSON.parse(ham) : null;
    } catch (e) {
      oturumOnbellek = null;
    }
    return oturumOnbellek;
  }

  function oturumYaz(s) {
    oturumOnbellek = s;
    try {
      if (s) window.localStorage.setItem(DEPO, JSON.stringify(s));
      else window.localStorage.removeItem(DEPO);
    } catch (e) {
      /* localStorage kapalıysa sessizce geç */
    }
  }

  function suAn() {
    return Math.floor(Date.now() / 1000);
  }

  /* Token süresi dolmak üzereyse yenile (60 sn pay bırakılır). */
  function tokenTazele() {
    var s = oturumOku();
    if (!s || !s.refresh_token) return Promise.resolve(null);
    if (s.expires_at && s.expires_at - 60 > suAn()) return Promise.resolve(s);

    return istek(URL_BASE + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    })
      .then(function (veri) {
        var yeni = oturumBicimle(veri);
        oturumYaz(yeni);
        return yeni;
      })
      .catch(function () {
        oturumYaz(null);
        return null;
      });
  }

  function oturumBicimle(veri) {
    return {
      access_token: veri.access_token,
      refresh_token: veri.refresh_token,
      expires_at: veri.expires_at || suAn() + (veri.expires_in || 3600),
      user: veri.user || null
    };
  }

  /* ------------------------------------------------------------------ */
  /* Ortak fetch sarmalayıcı                                            */
  /* ------------------------------------------------------------------ */
  function istek(url, secenek) {
    return window.fetch(url, secenek).then(function (yanit) {
      var tip = yanit.headers.get("content-type") || "";
      var govde = tip.indexOf("application/json") > -1 ? yanit.json() : yanit.text();

      return govde.then(function (veri) {
        if (yanit.ok) return veri;

        var mesaj =
          (veri && (veri.message || veri.error_description || veri.error || veri.msg)) ||
          "İstek başarısız (HTTP " + yanit.status + ")";
        var hata = new Error(cevirHata(mesaj, yanit.status));
        hata.status = yanit.status;
        hata.detay = veri;
        throw hata;
      });
    });
  }

  /* Sık karşılaşılan İngilizce hataları Türkçeleştirir. */
  function cevirHata(mesaj, durum) {
    var m = String(mesaj);
    if (/invalid login credentials/i.test(m)) return "E-posta veya şifre hatalı.";
    if (/email not confirmed/i.test(m)) return "E-posta adresi henüz doğrulanmamış.";
    if (/user not found/i.test(m)) return "Böyle bir kullanıcı bulunamadı.";
    if (/rate limit|too many/i.test(m)) return "Çok fazla deneme yapıldı, biraz bekleyin.";
    if (/violates row-level security|permission denied/i.test(m))
      return "Bu işlem için yetkiniz yok. Yönetici olarak tanımlı olduğunuzdan emin olun.";
    if (/duplicate key/i.test(m)) return "Bu kayıt zaten mevcut.";
    if (/Could not find the table/i.test(m))
      return "Veritabanı tabloları bulunamadı. supabase/01-sema-ve-guvenlik.sql dosyasını çalıştırdınız mı?";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Sunucuya ulaşılamadı, internet bağlantınızı kontrol edin.";
    if (durum === 413) return "Dosya çok büyük (en fazla 5 MB).";
    return m;
  }

  /* İstek başlıkları: oturum varsa kullanıcı token'ı, yoksa anon anahtar. */
  function basliklar(ek) {
    var s = oturumOku();
    var h = {
      apikey: ANON,
      Authorization: "Bearer " + (s && s.access_token ? s.access_token : ANON)
    };
    for (var k in ek || {}) h[k] = ek[k];
    return h;
  }

  /* Yetkili istek: önce token tazelenir, sonra çağrı yapılır. */
  function yetkiliIstek(url, secenek) {
    return tokenTazele().then(function () {
      secenek.headers = basliklar(secenek.headers);
      return istek(url, secenek);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Veritabanı (PostgREST)                                             */
  /* ------------------------------------------------------------------ */
  function sorguDizesi(sec) {
    sec = sec || {};
    var p = [];
    p.push("select=" + encodeURIComponent(sec.sec || "*"));

    var esit = sec.esit || {};
    for (var alan in esit) {
      if (esit[alan] === undefined || esit[alan] === null) continue;
      p.push(encodeURIComponent(alan) + "=eq." + encodeURIComponent(esit[alan]));
    }
    if (sec.suzgec) p.push(sec.suzgec); // ham PostgREST ifadesi (örn. "tarih=gte.2026-01-01")
    if (sec.sirala) p.push("order=" + encodeURIComponent(sec.sirala));
    if (sec.limit) p.push("limit=" + sec.limit);
    return p.join("&");
  }

  var db = {
    select: function (tablo, sec) {
      var url = URL_BASE + "/rest/v1/" + tablo + "?" + sorguDizesi(sec);
      return yetkiliIstek(url, { method: "GET" });
    },

    tek: function (tablo, sec) {
      sec = sec || {};
      sec.limit = 1;
      return db.select(tablo, sec).then(function (l) {
        return l && l.length ? l[0] : null;
      });
    },

    /* sec.donus === false ise eklenen kayıt geri OKUNMAZ.
       Bu şart: ziyaretçinin yazabildiği ama okuyamadığı tablolarda
       (örn. lm_mesajlar) "return=representation" kullanılırsa PostgREST
       ekleme sonrası SELECT dener, RLS engeller ve kayıt geri alınır. */
    insert: function (tablo, kayit, sec) {
      var geriDon = !sec || sec.donus !== false;
      return yetkiliIstek(URL_BASE + "/rest/v1/" + tablo, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: geriDon ? "return=representation" : "return=minimal"
        },
        body: JSON.stringify(kayit)
      }).then(function (l) {
        return Array.isArray(l) ? l[0] : l;
      });
    },

    update: function (tablo, id, degisiklik) {
      return yetkiliIstek(
        URL_BASE + "/rest/v1/" + tablo + "?id=eq." + encodeURIComponent(id),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(degisiklik)
        }
      ).then(function (l) {
        return Array.isArray(l) ? l[0] : l;
      });
    },

    remove: function (tablo, id) {
      return yetkiliIstek(
        URL_BASE + "/rest/v1/" + tablo + "?id=eq." + encodeURIComponent(id),
        { method: "DELETE", headers: { Prefer: "return=minimal" } }
      );
    }
  };

  /* ------------------------------------------------------------------ */
  /* Kimlik doğrulama                                                   */
  /* ------------------------------------------------------------------ */
  var auth = {
    girisYap: function (eposta, sifre) {
      return istek(URL_BASE + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: { apikey: ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ email: eposta, password: sifre })
      }).then(function (veri) {
        var s = oturumBicimle(veri);
        oturumYaz(s);
        return s;
      });
    },

    cikisYap: function () {
      var s = oturumOku();
      oturumYaz(null);
      if (!s) return Promise.resolve();
      return istek(URL_BASE + "/auth/v1/logout", {
        method: "POST",
        headers: { apikey: ANON, Authorization: "Bearer " + s.access_token }
      }).catch(function () {
        /* token zaten geçersizse sorun değil */
      });
    },

    oturum: oturumOku,

    /* Oturumu doğrular ve kullanıcının gerçekten yönetici olup olmadığını
       lm_adminler tablosundan kontrol eder. Birden fazla yönetici olabileceği
       için kayıt, oturumdaki kullanıcı kimliğine göre süzülür. */
    yoneticiMi: function () {
      return tokenTazele().then(function (s) {
        if (!s) return null;
        var sec = { sec: "user_id,eposta,ad", limit: 1 };
        if (s.user && s.user.id) sec.esit = { user_id: s.user.id };

        return db
          .select("lm_adminler", sec)
          .then(function (satirlar) {
            return satirlar && satirlar.length ? { oturum: s, admin: satirlar[0] } : null;
          })
          .catch(function () {
            return null;
          });
      });
    },

    sifreDegistir: function (yeniSifre) {
      return yetkiliIstek(URL_BASE + "/auth/v1/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: yeniSifre })
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Depolama (Storage)                                                 */
  /* ------------------------------------------------------------------ */
  var storage = {
    url: function (yol) {
      return URL_BASE + "/storage/v1/object/public/" + BUCKET + "/" + yol;
    },

    yukle: function (dosya, klasor) {
      var uzanti = (dosya.name.split(".").pop() || "jpg").toLowerCase();
      var temiz = uzanti.replace(/[^a-z0-9]/g, "") || "jpg";
      var yol =
        (klasor || "genel") +
        "/" +
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 8) +
        "." +
        temiz;

      return tokenTazele().then(function () {
        var s = oturumOku();
        return istek(URL_BASE + "/storage/v1/object/" + BUCKET + "/" + yol, {
          method: "POST",
          headers: {
            apikey: ANON,
            Authorization: "Bearer " + (s && s.access_token ? s.access_token : ANON),
            "Content-Type": dosya.type || "application/octet-stream",
            "x-upsert": "true"
          },
          body: dosya
        }).then(function () {
          return { yol: yol, url: storage.url(yol) };
        });
      });
    },

    sil: function (yol) {
      if (!yol) return Promise.resolve();
      return yetkiliIstek(URL_BASE + "/storage/v1/object/" + BUCKET + "/" + yol, {
        method: "DELETE"
      }).catch(function () {
        /* dosya zaten yoksa akışı bozma */
      });
    }
  };

  window.LM = { db: db, auth: auth, storage: storage, cfg: CFG };
})(window);
