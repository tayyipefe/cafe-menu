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
