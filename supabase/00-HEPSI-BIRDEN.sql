-- ============================================================================
--  La'mondes - HEPSI BIRDEN
--  Supabase -> SQL Editor -> bu dosyanin TAMAMINI yapistirin -> Run
--
--  Dort dosyayi dogru sirayla calistirir. Tekrar calistirilabilir.
--  ONCE 01-sema-ve-guvenlik.sql calistirilmis olmalidir.
-- ============================================================================


-- ###########################################################################
-- 1/4 - Quiz Night alanlari + video yukleme izni
-- ###########################################################################

-- ============================================================================
--  La'mondes — Quiz Night Modülü
--  Supabase → SQL Editor'e yapıştırıp "Run" deyin.
--
--  Bu script:
--    1) Quiz Night tablosuna film/tema adı ve video alanlarını ekler
--    2) Depolama kovasını video yüklemeye açar (şu an sadece görsel kabul ediyor)
--
--  Tekrar çalıştırılabilir; var olan sütunlar ikinci kez eklenmez.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. QUIZ NIGHT TABLOSU
--
--    Quiz geceleri, kurulumda oluşturulan public.lm_etkinlikler tablosunda
--    tutulur. Sizin listenizle karşılığı:
--
--      id           → id            (uuid, birincil anahtar)
--      film_name    → film_adi      (VARCHAR — filmin / temanın ismi)   ★ YENİ
--      event_date   → tarih         (timestamptz — etkinlik zamanı)
--      video_url    → video_url     (TEXT — Instagram/YouTube veya dosya) ★ YENİ
--      status       → tarih'ten HESAPLANIR (aşağıdaki nota bakın)
--
--    Ek olarak: yayinda (sitede görünsün mü), geri_sayim (geri sayım kartı),
--    afis_url (etkinlik afişi), katilim (katılım detayları).
--
--    ⚠ NOT — "yaklaşan / geçmiş" alanı hakkında:
--    Ayrı bir BOOLEAN alan koymadım. Sebebi: tarih zaten bu bilgiyi taşıyor
--    ve iki ayrı alan tutulursa her etkinlikten sonra elle "geçmiş" işaretlemek
--    gerekir; unutulduğunda site yanlış bilgi gösterir. Site ve panel,
--    etkinliğin tarihi geçmişse otomatik olarak "Geçmiş" kabul eder.
--    Elle kontrol isterseniz söyleyin, boolean alanı ekleyeyim.
-- ----------------------------------------------------------------------------
alter table public.lm_etkinlikler
  add column if not exists film_adi   text,
  add column if not exists video_url  text,
  add column if not exists video_path text;

comment on column public.lm_etkinlikler.film_adi   is 'Quiz gecesinin film / tema adı';
comment on column public.lm_etkinlikler.video_url  is 'Instagram, YouTube veya yüklenen video dosyasının adresi';
comment on column public.lm_etkinlikler.video_path is 'Video dosya olarak yüklendiyse depodaki yolu (silmek için)';

-- Geçmiş etkinlikleri hızlı listelemek için
create index if not exists lm_etkinlik_gecmis_idx
  on public.lm_etkinlikler (tarih desc)
  where yayinda = true;

-- ----------------------------------------------------------------------------
-- 2. DEPOLAMA — VİDEO YÜKLEMEYE İZİN VER
--
--    Kova şu an yalnızca görsel kabul ediyor ve 5 MB ile sınırlı; bu hâliyle
--    video yükleme başarısız olurdu. Sınırı 50 MB'a çıkarıp video tiplerini
--    ekliyoruz.
--
--    💡 Öneri: Videoları dosya olarak yüklemek yerine Instagram veya YouTube
--    bağlantısı kullanın. Depolama kotanız dolmaz, video daha hızlı açılır ve
--    Instagram gönderiniz de etkileşim alır.
-- ----------------------------------------------------------------------------
update storage.buckets
set file_size_limit    = 52428800,   -- 50 MB
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','image/avif','image/gif',
      'video/mp4','video/webm','video/quicktime'
    ]
where id = 'lm-medya';

-- ----------------------------------------------------------------------------
-- 3. ÖRNEK ETKİNLİĞİ GÜNCELLE
--    Kurulumdaki örnek kaydı yeni alanlarla uyumlu hâle getirir ve saatini
--    20:30'a çeker. Kendi etkinliğinizi panelden ekleyeceğiniz için bu kaydı
--    silebilirsiniz.
-- ----------------------------------------------------------------------------
update public.lm_etkinlikler
set baslik   = 'Quiz Night',
    film_adi = coalesce(film_adi, 'Tema panelden girilecek'),
    tarih    = ((date_trunc('day', tarih at time zone 'Europe/Istanbul')
                 + interval '20 hours 30 minutes') at time zone 'Europe/Istanbul')
where film_adi is null;

-- ============================================================================
--  KONTROL
-- ============================================================================
select id, baslik, film_adi, tarih,
       case when tarih >= now() then 'Yaklaşan' else 'Geçmiş' end as durum,
       yayinda, video_url
from public.lm_etkinlikler
order by tarih desc;


-- ###########################################################################
-- 2/4 - MENU: 6 kategori, 44 urun, gorsellerle
-- ###########################################################################

-- ============================================================================
--  La'mondes — GÜNCEL MENÜ  (görsellerle birlikte, tam liste)
--  Supabase → SQL Editor'e yapıştırıp "Run" deyin.
--
--  ⭐ MENÜ İÇİN TEK DOSYA BUDUR.
--     Eski 06, 07, 08, 09 numaralı dosyalar kaldırıldı; hepsinin sonucu
--     bu dosyanın içinde. Menüyle ilgili bir şey değiştiğinde yalnızca
--     burayı güncelleyip tekrar çalıştırmanız yeterli.
--
--  İçerik: 6 kategori · 44 ürün · 43 ürün görselli
--
--  Görseller dosya olarak yüklenmez, doğrudan bağlantı ile gösterilir —
--  Supabase depolama kotanızı hiç kullanmaz.
--
--  ⚠ Panelden ürünlere fotoğraf yüklediyseniz, bu script ürünleri silip
--    yeniden kuracağı için o dosyalar depoda sahipsiz kalır. Kontrol:
--       select ad, gorsel_path from public.lm_urunler where gorsel_path is not null;
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. ESKİ MENÜYÜ TEMİZLE
-- ----------------------------------------------------------------------------
delete from public.lm_urunler;
delete from public.lm_kategoriler;

-- ----------------------------------------------------------------------------
-- 2. KATEGORİLER
-- ----------------------------------------------------------------------------
insert into public.lm_kategoriler (ad, slug, sira, aktif) values
  ('Tatlılar & Waffle',                'tatli-waffle',  1, true),
  ('Soğuk Kahveler',                   'soguk-kahve',   2, true),
  ('Sıcak Kahveler',                   'sicak-kahve',   3, true),
  ('Diğer Sıcak İçecekler & Çaylar',   'sicak-icecek',  4, true),
  ('Soğuk İçecekler & Ferahlatıcılar', 'soguk-icecek',  5, true),
  ('Ekstralar',                        'ekstralar',     6, true);

-- ----------------------------------------------------------------------------
-- 3. ÜRÜNLER
--    one_cikan = true olanlar ana sayfadaki "Öne çıkanlar" bölümünde görünür.
--    gorsel boş (null) olanlar menüde sadece ad ve fiyatla listelenir.
-- ----------------------------------------------------------------------------
insert into public.lm_urunler
  (kategori_id, ad, fiyat, sira, one_cikan, gorsel_url, stokta, aktif)
select k.id, v.ad, v.fiyat, v.sira, v.one_cikan, v.gorsel, true, true
from (values

  -- ========== 1. TATLILAR & WAFFLE ==========
  -- Bu kategorinin fotoğrafları kendi çekimlerinizdir; projeden servis edilir
  -- (public/assets/gorseller/). Supabase depolama kotası kullanılmaz.
  -- NOT: "Duble Waffle" geçici olarak Waffle Kampanya fotoğrafını kullanıyor.
  --      Kendi fotoğrafını çektiğinizde bu satırı değiştirin.
  ('tatli-waffle', 'Krema Bardak',    250.00, 1, true,
   '/assets/gorseller/krema-bardak.jpg'::text),
  ('tatli-waffle', 'San Sebastian',   300.00, 2, true,
   '/assets/gorseller/san-sebastian.jpg'),
  ('tatli-waffle', 'Bardak Waffle',   250.00, 3, false,
   '/assets/gorseller/bardak-waffle.jpg'),
  ('tatli-waffle', 'Duble Waffle',    500.00, 4, true,
   '/assets/gorseller/waffle-kampanya.jpg'),
  ('tatli-waffle', 'Waffle Kampanya', 350.00, 5, false,
   '/assets/gorseller/waffle-kampanya.jpg'),

  -- ========== 2. SOĞUK KAHVELER ==========
  -- Badem sütlü ayrı ürün değildir; Ekstralar'daki "Badem Sütü" (+30 ₺) ile alınır.
  ('soguk-kahve', 'Ice Americano',     185.00, 1, false,
   'https://images.unsplash.com/photo-1533007716222-4b465613a984?q=80&w=687&auto=format&fit=crop'),
  ('soguk-kahve', 'Ice Latte',         190.00, 2, true,
   'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=687&auto=format&fit=crop'),
  ('soguk-kahve', 'Ice Caramel Latte', 210.00, 3, false,
   'https://www.forkinthekitchen.com/wp-content/uploads/2022/09/220629.iced_.latte_.caramel-9182.jpg'),
  ('soguk-kahve', 'Ice Mocha',         210.00, 4, false,
   'https://images.unsplash.com/photo-1549652127-2e5e59e86a7a?q=80&w=687&auto=format&fit=crop'),
  ('soguk-kahve', 'Ice Cortado',       200.00, 5, false,
   'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=764&auto=format&fit=crop'),
  ('soguk-kahve', 'Ice Flat White',    200.00, 6, false,
   'https://images.unsplash.com/photo-1671759545218-831c32bfe92d?q=80&w=765&auto=format&fit=crop'),

  -- ========== 3. SICAK KAHVELER ==========
  ('sicak-kahve', 'Espresso',              130.00,  1, false,
   'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=1170&auto=format&fit=crop'),
  ('sicak-kahve', 'Double Espresso',       150.00,  2, false,
   'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=1170&auto=format&fit=crop'),
  ('sicak-kahve', 'Türk Kahvesi',          140.00,  3, false,
   'https://images.unsplash.com/photo-1695593217066-1e663f8524db?q=80&w=627&auto=format&fit=crop'),
  ('sicak-kahve', 'Double Türk Kahvesi',   165.00,  4, false,
   'https://images.unsplash.com/photo-1695593217066-1e663f8524db?q=80&w=627&auto=format&fit=crop'),
  ('sicak-kahve', 'Amerikano',             160.00,  5, false,
   'https://images.unsplash.com/photo-1580661869408-55ab23f2ca6e?q=80&w=1935&auto=format&fit=crop'),
  ('sicak-kahve', 'Filtre Kahve',          160.00,  6, true,
   'https://images.unsplash.com/photo-1582768772255-7fb8066357ce?q=80&w=701&auto=format&fit=crop'),
  ('sicak-kahve', 'Latte',                 170.00,  7, false,
   'https://plus.unsplash.com/premium_photo-1673459683873-a8a47e1a5ab9?q=80&w=687&auto=format&fit=crop'),
  ('sicak-kahve', 'Vanilya Latte',         190.00,  8, false,
   'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?q=80&w=735&auto=format&fit=crop'),
  ('sicak-kahve', 'Caramel Latte',         190.00,  9, false,
   'https://images.unsplash.com/photo-1708430651927-20e2e1f1e8f7?q=80&w=627&auto=format&fit=crop'),
  ('sicak-kahve', 'Laktozsuz Latte',       220.00, 10, false,
   'https://plus.unsplash.com/premium_photo-1674327105074-46dd8319164b?q=80&w=1170&auto=format&fit=crop'),
  ('sicak-kahve', 'Cappuccino',            180.00, 11, false,
   'https://images.unsplash.com/photo-1633401941646-199b6b11f1da?q=80&w=1171&auto=format&fit=crop'),
  ('sicak-kahve', 'Cortado',               180.00, 12, false,
   'https://images.unsplash.com/photo-1670217756837-34134e2e9e60?q=80&w=687&auto=format&fit=crop'),
  ('sicak-kahve', 'Flat White',            180.00, 13, false,
   'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=687&auto=format&fit=crop'),
  ('sicak-kahve', 'Mocha',                 190.00, 14, false,
   'https://plus.unsplash.com/premium_photo-1672933647933-42628e319667?q=80&w=687&auto=format&fit=crop'),
  ('sicak-kahve', 'White Chocolate Mocha', 200.00, 15, false,
   'https://images.unsplash.com/photo-1627777620905-53a332869051?q=80&w=735&auto=format&fit=crop'),

  -- ========== 4. DİĞER SICAK İÇECEKLER & ÇAYLAR ==========
  ('sicak-icecek', 'Çay',             50.00, 1, false,
   'https://images.unsplash.com/photo-1715017245420-9638115138a4?q=80&w=687&auto=format&fit=crop'),
  ('sicak-icecek', 'Fincan Çay',      80.00, 2, false,
   'https://images.unsplash.com/photo-1654169720142-1c21a3b49a53?q=80&w=687&auto=format&fit=crop'),
  ('sicak-icecek', 'Bitki Çayı',     190.00, 3, false,
   'https://plus.unsplash.com/premium_photo-1674406481284-43eba097a291?q=80&w=1170&auto=format&fit=crop'),
  ('sicak-icecek', 'Chai Tea Latte', 200.00, 4, false,
   'https://plus.unsplash.com/premium_photo-1671379526961-1aebb82b317b?q=80&w=687&auto=format&fit=crop'),
  ('sicak-icecek', 'Sıcak Çikolata', 200.00, 5, true,
   'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=687&auto=format&fit=crop'),
  ('sicak-icecek', 'Salep',          200.00, 6, false,
   'https://images.unsplash.com/photo-1724198218220-f0641254233b?q=80&w=687&auto=format&fit=crop'),

  -- ========== 5. SOĞUK İÇECEKLER & FERAHLATICILAR ==========
  ('soguk-icecek', 'Cool Lime',         200.00, 1, false,
   'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=687&auto=format&fit=crop'),
  ('soguk-icecek', 'Karadut Cool Lime', 200.00, 2, false,
   'https://images.unsplash.com/photo-1563572912886-754e26f4c4b6?q=80&w=627&auto=format&fit=crop'),
  ('soguk-icecek', 'Toz Pembe',         240.00, 3, false,
   'https://images.unsplash.com/photo-1567357771095-695c40e0da98?q=80&w=687&auto=format&fit=crop'),
  -- NOT: Churchill görseli şu an Cool Lime ile aynı. Ayrı bir fotoğraf
  --      bulursanız aşağıdaki bağlantıyı değiştirin ya da panelden düzenleyin.
  ('soguk-icecek', 'Churchill',         125.00, 4, false,
   'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=687&auto=format&fit=crop'),
  ('soguk-icecek', 'Soda',               50.00, 5, false,
   'https://images.unsplash.com/photo-1640375022816-32fa22ecb747?q=80&w=1176&auto=format&fit=crop'),
  ('soguk-icecek', 'Meyveli Soda',       70.00, 6, false,
   'https://plus.unsplash.com/premium_photo-1759760098655-22cbecc9c805?q=80&w=1170&auto=format&fit=crop'),
  ('soguk-icecek', 'Soda Limon Buz',     70.00, 7, false,
   'https://images.unsplash.com/photo-1621330716555-5cad596c4562?q=80&w=674&auto=format&fit=crop'),
  ('soguk-icecek', 'Limonlu Sade Soda', 100.00, 8, false,
   'https://images.unsplash.com/photo-1767246466534-6c6852acd2b5?q=80&w=542&auto=format&fit=crop'),
  ('soguk-icecek', 'Su',                 50.00, 9, false,
   'https://images.unsplash.com/photo-1614713899518-7ec14c1a3f00?q=80&w=1170&auto=format&fit=crop'),

  -- ========== 6. EKSTRALAR ==========
  ('ekstralar', 'Ekstra Shot', 55.00, 1, false,
   'https://images.unsplash.com/photo-1558416165-5fb04b79b0e7?q=80&w=1171&auto=format&fit=crop'),
  ('ekstralar', 'Artı 2 Shot', 84.00, 2, false,
   'https://images.unsplash.com/photo-1558416165-5fb04b79b0e7?q=80&w=1171&auto=format&fit=crop'),
  ('ekstralar', 'Badem Sütü',  30.00, 3, false,
   'https://plus.unsplash.com/premium_photo-1695042865121-f200dd9ca232?q=80&w=687&auto=format&fit=crop')

) as v(kategori_slug, ad, fiyat, sira, one_cikan, gorsel)
join public.lm_kategoriler k on k.slug = v.kategori_slug;

commit;

-- ============================================================================
--  KONTROL
-- ============================================================================
select k.sira as kat_sira, k.ad as kategori,
       count(u.id) as urun, count(u.gorsel_url) as gorselli,
       min(u.fiyat) as en_ucuz, max(u.fiyat) as en_pahali
from public.lm_kategoriler k
left join public.lm_urunler u on u.kategori_id = k.id
group by k.sira, k.ad
order by k.sira;

-- Toplam 44 ürün, 43'ü görselli olmalı
select count(*) as toplam_urun, count(gorsel_url) as gorselli
from public.lm_urunler;


-- ###########################################################################
-- 3/4 - GALERI: 11 fotograf
-- ###########################################################################

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


-- ###########################################################################
-- 4/4 - QUIZ ARSIVI: 3 etkinlik
-- ###########################################################################

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

