/* ============================================================================
   La'mondes — Yerel Geliştirme Sunucusu
   Siteyi bilgisayarınızda önizlemek için. Harici paket gerektirmez.

   Çalıştırma:  node sunucu.js
   Adres:       http://localhost:4000
   Panel:       http://localhost:4000/admin/login

   NOT: Bu dosya yalnızca geliştirme içindir; yayına alırken sunucuya
   yüklemeniz gereken tek klasör "public/" klasörüdür.
   ========================================================================== */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 4000;

/* Site dosyaları proje kökündedir (GitHub Pages bu yapıyı bekliyor).
   Yayına girmeyen klasörler aşağıda engellenir. */
const KOK = __dirname;
const GIZLI = [".git", "supabase", "arsiv-eski-site", ".claude", "node_modules"];

const TIPLER = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v"
};

function govdeGonder(yanit, kod, icerik, tip) {
  yanit.writeHead(kod, {
    "Content-Type": tip || "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  yanit.end(icerik);
}

const sunucu = http.createServer((istek, yanit) => {
  let yol;
  try {
    yol = decodeURIComponent(new URL(istek.url, "http://localhost").pathname);
  } catch {
    return govdeGonder(yanit, 400, "Hatalı istek");
  }

  if (yol.endsWith("/")) yol += "index.html";

  // Dizin dışına çıkmayı engelle
  const hedef = path.join(KOK, path.normalize(yol));
  if (!hedef.startsWith(KOK)) return govdeGonder(yanit, 403, "Erişim reddedildi");

  // Yayına girmeyen klasörleri gizle
  const ilkParca = yol.split("/").filter(Boolean)[0];
  if (ilkParca && GIZLI.includes(ilkParca)) {
    return govdeGonder(yanit, 404, "Bulunamadı");
  }

  const adaylar = [hedef];
  // Uzantısız temiz adresler: /admin/login -> /admin/login.html
  if (!path.extname(hedef)) {
    adaylar.push(hedef + ".html", path.join(hedef, "index.html"));
  }

  const bulunan = adaylar.find((a) => fs.existsSync(a) && fs.statSync(a).isFile());

  if (!bulunan) {
    return govdeGonder(
      yanit,
      404,
      "<!doctype html><meta charset=utf-8><title>404</title>" +
        '<div style="font-family:system-ui;padding:3rem;text-align:center">' +
        "<h1>404 — Sayfa bulunamadı</h1>" +
        '<p><a href="/">Ana sayfaya dön</a></p></div>',
      "text/html; charset=utf-8"
    );
  }

  const tip = TIPLER[path.extname(bulunan).toLowerCase()] || "application/octet-stream";

  // Video/ses için parçalı indirme (Range) — olmadan ileri-geri sarma çalışmaz
  if (tip.startsWith("video/") || tip.startsWith("audio/")) {
    const boyut = fs.statSync(bulunan).size;
    const aralik = istek.headers.range;

    if (aralik) {
      const eslesme = /bytes=(\d*)-(\d*)/.exec(aralik);
      const bas = eslesme && eslesme[1] ? parseInt(eslesme[1], 10) : 0;
      const son = eslesme && eslesme[2] ? parseInt(eslesme[2], 10) : boyut - 1;

      if (bas >= boyut || son >= boyut || bas > son) {
        yanit.writeHead(416, { "Content-Range": `bytes */${boyut}` });
        return yanit.end();
      }
      yanit.writeHead(206, {
        "Content-Type": tip,
        "Content-Range": `bytes ${bas}-${son}/${boyut}`,
        "Accept-Ranges": "bytes",
        "Content-Length": son - bas + 1
      });
      return fs.createReadStream(bulunan, { start: bas, end: son }).pipe(yanit);
    }

    yanit.writeHead(200, {
      "Content-Type": tip,
      "Content-Length": boyut,
      "Accept-Ranges": "bytes"
    });
    return fs.createReadStream(bulunan).pipe(yanit);
  }

  fs.readFile(bulunan, (hata, veri) => {
    if (hata) return govdeGonder(yanit, 500, "Sunucu hatası");
    govdeGonder(yanit, 200, veri, tip);
  });
});

sunucu.listen(PORT, () => {
  console.log("");
  console.log("  La'mondes yerel sunucu calisiyor");
  console.log("  ---------------------------------");
  console.log("  Site  : http://localhost:" + PORT);
  console.log("  Panel : http://localhost:" + PORT + "/admin/login");
  console.log("");
  console.log("  Durdurmak icin Ctrl+C");
  console.log("");
});
