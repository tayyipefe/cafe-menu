/* ============================================================================
   La'mondes — Yeni Mesaj Bildirimi (Supabase Edge Function)

   lm_mesajlar tablosuna yeni kayıt düştüğünde Gmail üzerinden bildirim
   e-postası gönderir. Veritabanı webhook'u tarafından tetiklenir.

   Gerekli gizli anahtarlar (Supabase → Edge Functions → Secrets):
     GMAIL_ADRES              gonderen@gmail.com
     GMAIL_UYGULAMA_SIFRESI   Google "uygulama şifresi" (16 hane, boşluksuz)
     BILDIRIM_ALICI           bildirimlerin gideceği adres (boşsa GMAIL_ADRES)
     WEBHOOK_GIZLI            webhook'un göndereceği gizli anahtar

   Dağıtım:
     supabase functions deploy yeni-mesaj-bildirimi --no-verify-jwt
   ========================================================================== */

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const GMAIL_ADRES = Deno.env.get("GMAIL_ADRES") ?? "";
const GMAIL_SIFRE = Deno.env.get("GMAIL_UYGULAMA_SIFRESI") ?? "";
const ALICI = Deno.env.get("BILDIRIM_ALICI") || GMAIL_ADRES;
const GIZLI = Deno.env.get("WEBHOOK_GIZLI") ?? "";

const PANEL_ADRESI = Deno.env.get("PANEL_ADRESI") || "http://localhost:4000/admin/";

function kacis(m: unknown): string {
  return String(m ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function yanit(kod: number, govde: Record<string, unknown>) {
  return new Response(JSON.stringify(govde), {
    status: kod,
    headers: { "Content-Type": "application/json" }
  });
}

Deno.serve(async (istek: Request) => {
  if (istek.method !== "POST") {
    return yanit(405, { hata: "Yalnızca POST kabul edilir." });
  }

  // --- Güvenlik: paylaşılan gizli anahtar --------------------------------
  // Fonksiyon adresi herkese açıktır; bu kontrol olmadan biri sahte
  // bildirim tetikleyebilir.
  if (!GIZLI || istek.headers.get("x-lm-gizli") !== GIZLI) {
    return yanit(401, { hata: "Yetkisiz istek." });
  }

  if (!GMAIL_ADRES || !GMAIL_SIFRE) {
    console.error("GMAIL_ADRES veya GMAIL_UYGULAMA_SIFRESI tanımlı değil.");
    return yanit(500, { hata: "E-posta ayarları eksik." });
  }

  let govde: any;
  try {
    govde = await istek.json();
  } catch {
    return yanit(400, { hata: "Geçersiz JSON." });
  }

  // Supabase webhook'u { type, table, record, old_record } gönderir.
  const kayit = govde?.record ?? govde;
  if (!kayit || !kayit.ad || !kayit.mesaj) {
    return yanit(400, { hata: "Beklenen mesaj alanları bulunamadı." });
  }

  const tarih = new Date(kayit.created_at ?? Date.now()).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "long",
    timeStyle: "short"
  });

  const konu = `🔔 Yeni mesaj: ${kayit.konu ?? "İletişim formu"} — ${kayit.ad}`;

  const duzMetin = [
    "La'mondes web sitesinden yeni bir mesaj var.",
    "",
    `Ad Soyad : ${kayit.ad}`,
    `E-posta  : ${kayit.eposta ?? "-"}`,
    `Telefon  : ${kayit.telefon ?? "-"}`,
    `Konu     : ${kayit.konu ?? "-"}`,
    `Tarih    : ${tarih}`,
    "",
    "Mesaj:",
    kayit.mesaj,
    "",
    `Panel: ${PANEL_ADRESI}#mesajlar`
  ].join("\n");

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#fbfaf8;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e4df;border-radius:14px;overflow:hidden">
      <div style="background:#8a5a3b;color:#fff;padding:18px 22px">
        <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.85">La'mondes</div>
        <div style="font-size:19px;font-weight:600;margin-top:2px">Yeni mesaj geldi</div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#453d38">
        <tr><td style="padding:12px 22px;border-bottom:1px solid #f0ece7;width:110px;color:#6f6763">Ad Soyad</td>
            <td style="padding:12px 22px;border-bottom:1px solid #f0ece7"><strong>${kacis(kayit.ad)}</strong></td></tr>
        <tr><td style="padding:12px 22px;border-bottom:1px solid #f0ece7;color:#6f6763">E-posta</td>
            <td style="padding:12px 22px;border-bottom:1px solid #f0ece7">
              <a href="mailto:${kacis(kayit.eposta)}" style="color:#8a5a3b">${kacis(kayit.eposta)}</a></td></tr>
        <tr><td style="padding:12px 22px;border-bottom:1px solid #f0ece7;color:#6f6763">Telefon</td>
            <td style="padding:12px 22px;border-bottom:1px solid #f0ece7">${
              kayit.telefon
                ? `<a href="tel:${kacis(String(kayit.telefon).replace(/\s/g, ""))}" style="color:#8a5a3b">${kacis(kayit.telefon)}</a>`
                : "—"
            }</td></tr>
        <tr><td style="padding:12px 22px;border-bottom:1px solid #f0ece7;color:#6f6763">Konu</td>
            <td style="padding:12px 22px;border-bottom:1px solid #f0ece7">${kacis(kayit.konu)}</td></tr>
        <tr><td style="padding:12px 22px;border-bottom:1px solid #f0ece7;color:#6f6763">Tarih</td>
            <td style="padding:12px 22px;border-bottom:1px solid #f0ece7">${kacis(tarih)}</td></tr>
      </table>

      <div style="padding:18px 22px">
        <div style="color:#6f6763;font-size:13px;margin-bottom:6px">Mesaj</div>
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#1a1614;background:#f5f2ee;border-radius:10px;padding:14px">${kacis(kayit.mesaj)}</div>
      </div>

      <div style="padding:0 22px 22px">
        <a href="${kacis(PANEL_ADRESI)}#mesajlar"
           style="display:inline-block;background:#8a5a3b;color:#fff;text-decoration:none;padding:11px 20px;border-radius:999px;font-size:14px;font-weight:600">
          Panelde Aç
        </a>
        ${
          kayit.eposta
            ? `<a href="mailto:${kacis(kayit.eposta)}" style="display:inline-block;margin-left:8px;border:1px solid #e8e4df;color:#453d38;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:14px">Yanıtla</a>`
            : ""
        }
      </div>
    </div>
    <div style="text-align:center;color:#9a918b;font-size:12px;margin-top:14px">
      Bu e-posta La'mondes web sitesi tarafından otomatik gönderildi.
    </div>
  </div>`;

  const istemci = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: GMAIL_ADRES, password: GMAIL_SIFRE }
    }
  });

  try {
    await istemci.send({
      from: `La'mondes Web Sitesi <${GMAIL_ADRES}>`,
      to: ALICI,
      replyTo: kayit.eposta || undefined,
      subject: konu,
      content: duzMetin,
      html: html
    });
    await istemci.close();
    return yanit(200, { durum: "gonderildi", alici: ALICI });
  } catch (e) {
    console.error("E-posta gönderilemedi:", e);
    try { await istemci.close(); } catch { /* yoksay */ }
    return yanit(500, { hata: "E-posta gönderilemedi", detay: String(e) });
  }
});
