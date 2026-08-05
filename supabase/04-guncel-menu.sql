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
