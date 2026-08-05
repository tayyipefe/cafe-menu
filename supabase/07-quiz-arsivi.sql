-- ============================================================================
--  La'mondes — QUIZ NIGHT ARŞİVİ
--  Supabase → SQL Editor'e yapıştırıp "Run" deyin.
--
--  ⭐ GEÇMİŞ QUIZ GECELERİ İÇİN TEK DOSYA BUDUR.
--
--  ⚠ ÖNCE 05-quiz-night.sql çalıştırılmış olmalı — film_adi ve video_url
--    sütunlarını o ekliyor. Çalıştırmadıysanız bu script hata verir.
--
--  Bilgilerin tamamı afişlerden okundu; gün adları takvimle doğrulandı:
--
--    AVRUPA YAKASI    18 Mayıs 2026  Pazartesi  20:30
--    YAPRAK DÖKÜMÜ    10 Haziran 2026 Çarşamba  20:30
--    AŞK-I MEMNU      23 Temmuz 2026 Perşembe   21:00   ← afişte 21:00 yazıyor
--
--  Üçü de geçmiş tarihli olduğu için site bunları otomatik ARŞİV bölümüne koyar.
--  Tekrar çalıştırılabilir; kayıtlar ikinci kez eklenmez, varsa güncellenir.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. YENİ KAYITLARI EKLE
-- ----------------------------------------------------------------------------
insert into public.lm_etkinlikler
  (baslik, film_adi, aciklama, tarih, konum, katilim,
   afis_url, video_url, yayinda, geri_sayim)
select v.baslik, v.film_adi, v.aciklama,
       (v.zaman at time zone 'Europe/Istanbul'),
       v.konum, v.katilim, v.afis, v.video, true, false
from (values
  ('Quiz Night', 'Avrupa Yakası',
   'Waffle ödüllü Quiz Night''ta tema Avrupa Yakası''ydı. Dolu masalar, çekişmeli turlar ve kazananlara waffle.',
   timestamp '2026-05-18 20:30:00',
   'La''mondes Cafe & Bakery — Körfez, Kocaeli',
   E'Kolay testi bilen Bardak Waffle kazanır.\nZor testi bilen Waffle Kampanya kazanır.\nKatılım ücretsizdir.',
   '/assets/gorseller/quiz/avrupa-yakasi.jpg',
   '/assets/gorseller/quiz/avrupa-yakasi.mp4'),

  ('Quiz Night', 'Yaprak Dökümü',
   'Waffle ödüllü Quiz Night''ta tema Yaprak Dökümü''ydü. Sorular zorladı, waffle''lar sahiplerini buldu.',
   timestamp '2026-06-10 20:30:00',
   'La''mondes Cafe & Bakery — Körfez, Kocaeli',
   E'Kolay testi bilen Bardak Waffle kazanır.\nZor testi bilen Waffle Kampanya kazanır.\nKatılım ücretsizdir.',
   '/assets/gorseller/quiz/yaprak-dokumu.jpg',
   '/assets/gorseller/quiz/yaprak-dokumu.mp4'),

  ('Quiz Night', 'Aşk-ı Memnu',
   'Waffle ödüllü Quiz Night''ta tema Aşk-ı Memnu''ydu. Salon doldu, geceyi bilen takımlar waffle ile kapattı.',
   timestamp '2026-07-23 21:00:00',
   'La''mondes Cafe & Bakery — Körfez, Kocaeli',
   E'Kolay testi bilen Bardak Waffle kazanır.\nZor testi bilen Waffle Kampanya kazanır.\nKatılım ücretsizdir.',
   '/assets/gorseller/quiz/ask-i-memnu.jpg',
   '/assets/gorseller/quiz/ask-i-memnu.mp4')
) as v(baslik, film_adi, aciklama, zaman, konum, katilim, afis, video)
where not exists (
  select 1 from public.lm_etkinlikler e where e.film_adi = v.film_adi
);

-- ----------------------------------------------------------------------------
-- 2. ZATEN VARSA AFİŞ / VİDEO / METİN GÜNCELLE
--    (ilk kurulumda "Aşk-ı Memnu" eklenmiş olabilir)
-- ----------------------------------------------------------------------------
update public.lm_etkinlikler e
set afis_url   = v.afis,
    video_url  = v.video,
    aciklama   = v.aciklama,
    tarih      = (v.zaman at time zone 'Europe/Istanbul'),
    katilim    = E'Kolay testi bilen Bardak Waffle kazanır.\nZor testi bilen Waffle Kampanya kazanır.\nKatılım ücretsizdir.',
    yayinda    = true,
    geri_sayim = false
from (values
  ('Avrupa Yakası', timestamp '2026-05-18 20:30:00',
   'Waffle ödüllü Quiz Night''ta tema Avrupa Yakası''ydı. Dolu masalar, çekişmeli turlar ve kazananlara waffle.',
   '/assets/gorseller/quiz/avrupa-yakasi.jpg', '/assets/gorseller/quiz/avrupa-yakasi.mp4'),
  ('Yaprak Dökümü', timestamp '2026-06-10 20:30:00',
   'Waffle ödüllü Quiz Night''ta tema Yaprak Dökümü''ydü. Sorular zorladı, waffle''lar sahiplerini buldu.',
   '/assets/gorseller/quiz/yaprak-dokumu.jpg', '/assets/gorseller/quiz/yaprak-dokumu.mp4'),
  ('Aşk-ı Memnu', timestamp '2026-07-23 21:00:00',
   'Waffle ödüllü Quiz Night''ta tema Aşk-ı Memnu''ydu. Salon doldu, geceyi bilen takımlar waffle ile kapattı.',
   '/assets/gorseller/quiz/ask-i-memnu.jpg', '/assets/gorseller/quiz/ask-i-memnu.mp4')
) as v(film_adi, zaman, aciklama, afis, video)
where e.film_adi = v.film_adi;

-- ----------------------------------------------------------------------------
-- 3. KURULUMDAKİ ÖRNEK KAYDI TEMİZLE
--    02-baslangic-verisi.sql'in eklediği boş "Tema panelden girilecek" kaydı.
-- ----------------------------------------------------------------------------
delete from public.lm_etkinlikler
where film_adi is null or film_adi = 'Tema panelden girilecek';

commit;

-- ============================================================================
--  KONTROL — 3 arşiv kaydı olmalı
-- ============================================================================
select film_adi,
       to_char(tarih at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as tarih_saat,
       case when tarih >= now() then 'Yaklaşan' else 'Arşiv' end as durum,
       yayinda,
       case when afis_url  is not null then 'var' else 'yok' end as afis,
       case when video_url is not null then 'var' else 'yok' end as video
from public.lm_etkinlikler
order by tarih desc;

-- ============================================================================
--  YENİ QUIZ GECESİ EKLERKEN
--  En kolayı panelden: Quiz Night Yönetimi → "+ Yeni Quiz Night".
--  Afiş ve videoyu oradan yükleyebilir ya da bu dosyaya satır ekleyip
--  tekrar çalıştırabilirsiniz.
-- ============================================================================
