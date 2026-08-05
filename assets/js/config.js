/* ============================================================================
   La'mondes — Yapılandırma
   İşletme bilgileri BURADAN yönetilir; tüm sayfalara otomatik yansır.

   Buradaki anahtar "anon" (public) anahtardır; tarayıcıda görünmesi normaldir.
   Güvenlik, Supabase üzerindeki RLS politikalarıyla sağlanır.
   ASLA "service_role" anahtarını buraya yazmayın.
   ========================================================================== */
window.LM_CONFIG = {
  SUPABASE_URL: "https://jaqqekhriltecdoqghaw.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXFla2hyaWx0ZWNkb3FnaGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTcxMzAsImV4cCI6MjA5ODc3MzEzMH0.C0n58Otr2gn9ACpsymJVRyxZjKsQAjyW_3h04lR02EM",
  BUCKET: "lm-medya",

  /* --------------------------------------------------------------------------
     QR KODLARI
     Ana sayfadaki iki QR kod bu adresten üretilir:
       1. Menü QR   → SITE_ADRESI + "/menu.html"
       2. Site QR   → SITE_ADRESI
     Alan adınızı aldığınızda SADECE aşağıdaki satırı değiştirin;
     QR kodları kendiliğinden güncellenir, yeniden üretmeye gerek yoktur.

     ⚠ Şu anki değer YER TUTUCUDUR. Alan adı alınmadan QR kodlarını BASMAYIN.
     -------------------------------------------------------------------------- */
  SITE_ADRESI: "https://lamondescafe.com",

  ISLETME: {
    ad: "La'mondes",
    altAd: "Cafe & Bakery",

    adres: "Mimar Sinan Mah., Ayık Sk. No:18",
    ilce: "41780 Körfez / Kocaeli",

    telefon: "+90 542 406 20 95",
    telefonLink: "tel:+905424062095",

    eposta: "coskunmmustafa@gmail.com",

    /* Çalışma saatleri. Tek satır varsa sitede her zaman vurgulanır. */
    saatler: [["Her gün", "11:00 – 00:00"]],

    sosyal: {
      instagram: "https://www.instagram.com/lamondescafe?igsh=NDM4OGh6NTMzN2Rv",
      whatsapp: "https://wa.me/905424062095"
    },

    /* --- Google Haritalar ---------------------------------------------------
       harita      : iletişim sayfasındaki gömülü harita
       haritaYol   : "Yol tarifi al" bağlantısı
       googleProfil: "Google'da görüntüle" bağlantısı
       yorumYaz    : "Google'da yorum yaz" bağlantısı

       NOT: yorumYaz şu an arama tabanlıdır — kullanıcıyı işletme kartınıza
       götürür, oradan yorum yazabilir. Doğrudan yorum kutusunu açmak için
       Place ID gerekir:
         1) https://developers.google.com/maps/documentation/places/web-service/place-id
            adresindeki "Place ID Finder" aracına işletmenizi yazın
         2) Çıkan ID'yi (ChIJ... ile başlar) aşağıdaki satıra yerleştirin:
            yorumYaz: "https://search.google.com/local/writereview?placeid=BURAYA_ID"
    ------------------------------------------------------------------------ */
    harita:
      "https://maps.google.com/maps?q=" +
      encodeURIComponent("Mimar Sinan Mahallesi, Ayık Sokak No:18, 41780 Körfez, Kocaeli") +
      "&t=&z=17&ie=UTF8&iwloc=&output=embed",

    haritaYol:
      "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent("Mimar Sinan Mahallesi, Ayık Sokak No:18, 41780 Körfez, Kocaeli"),

    googleProfil:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("La'mondes Cafe Ayık Sokak Körfez Kocaeli"),

    yorumYaz:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("La'mondes Cafe Ayık Sokak Körfez Kocaeli")
  }
};
