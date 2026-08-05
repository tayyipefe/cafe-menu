-- ============================================================================
--  La'mondes — GALERİ  (kendi fotoğraflarınız)
--  Supabase → SQL Editor'e yapıştırıp "Run" deyin.
--
--  ⭐ GALERİ İÇİN TEK DOSYA BUDUR.
--
--  11 fotoğraf: önce mekân ve marka kareleri, sonra ürünler.
--  Logo galeriye EKLENMEZ.
--
--  Görseller projeden servis edilir: public/assets/gorseller/
--  Supabase depolama kotanız kullanılmaz.
--
--  Tekrar tekrar çalıştırılabilir; her seferinde galeriyi bu listeye eşitler.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. GALERİYİ TEMİZLE
--    Panelden yüklediğiniz fotoğraflar varsa onlar da silinir. Kontrol için:
--      select baslik, gorsel_path from public.lm_galeri where gorsel_path is not null;
-- ----------------------------------------------------------------------------
delete from public.lm_galeri;

-- ----------------------------------------------------------------------------
-- 2. FOTOĞRAFLARI EKLE
-- ----------------------------------------------------------------------------
insert into public.lm_galeri (baslik, aciklama, gorsel_url, sira, aktif)
values
  -- --- Mekân ve marka ---
  ('Bahçemiz',          'Ayık Sokak · akşamüstü',
   '/assets/gorseller/galeri1.jpg',          1, true),
  ('Tezgâh Başında',    'İçeriden',
   '/assets/gorseller/arkaplan.jpg',         2, true),
  ('Biz Açıldık!',      'Açılış günümüz',
   '/assets/gorseller/galeri3.jpg',          3, true),
  ('Bar Tarafı',        'Espresso hazırlanıyor',
   '/assets/gorseller/galeri5.jpg',          4, true),
  ('Duvarımız',         'Açılıştan önce',
   '/assets/gorseller/galeri6.jpg',          5, true),
  ('Mekânımızdan',      'Masalarımız',
   '/assets/gorseller/galeri2.jpg',          6, true),

  -- --- Ürünler ---
  ('Waffle Alana 2 Çay', 'Kampanyamız',
   '/assets/gorseller/galeri4.jpg',          7, true),
  ('San Sebastian',     'Tatlılarımızdan',
   '/assets/gorseller/san-sebastian.jpg',    8, true),
  ('Krema Bardak',      'İmzamızı taşıyan tatlı',
   '/assets/gorseller/krema-bardak.jpg',     9, true),
  ('Bardak Waffle',     'Tatlılarımızdan',
   '/assets/gorseller/bardak-waffle.jpg',   10, true),
  ('Waffle Kampanya',   'Tatlılarımızdan',
   '/assets/gorseller/waffle-kampanya.jpg', 11, true);

commit;

-- ============================================================================
--  KONTROL — 11 fotoğraf olmalı, hepsi /assets/gorseller/ ile başlamalı
-- ============================================================================
select sira, baslik, gorsel_url from public.lm_galeri order by sira;
select count(*) as toplam from public.lm_galeri;

-- ============================================================================
--  YENİ FOTOĞRAF EKLEMEK İSTERSENİZ
--  1) Dosyayı public/assets/gorseller/ klasörüne koyun
--  2) Bu dosyaya yeni bir satır ekleyip tekrar çalıştırın
--     — ya da hiç SQL'e girmeden panelden yükleyin (Galeri → sürükle bırak).
--     Panelden yüklenenler Supabase depolamasına gider; bu script'i tekrar
--     çalıştırırsanız o kayıtlar silinir, dikkat edin.
-- ============================================================================
