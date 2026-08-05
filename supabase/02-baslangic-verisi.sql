-- ============================================================================
--  La'mondes — Başlangıç Verisi (Örnek Etkinlik)
--  01-sema-ve-guvenlik.sql çalıştırıldıktan SONRA çalıştırın.
--  Tekrar çalıştırılabilir: aynı kayıt ikinci kez eklenmez.
--
--  NOT: Menü ve galeri bu dosyada DEĞİLDİR.
--       Menü   →  04-guncel-menu.sql
--       Galeri →  06-galeri.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ÖRNEK ETKİNLİK
-- Bir sonraki Perşembe 20:30 (İstanbul saatiyle). İçeriği panelden düzenleyin.
-- Yayında değil; hazır olunca panelden açarsınız.
-- ----------------------------------------------------------------------------
insert into public.lm_etkinlikler (baslik, aciklama, tarih, konum, katilim, yayinda, geri_sayim)
select
  'Quiz Night',
  'Etkinlik açıklamasını yönetim panelinden düzenleyebilirsiniz.',
  (((date_trunc('week', now() at time zone 'Europe/Istanbul')::date + 3 +
     case when extract(dow from now() at time zone 'Europe/Istanbul') >= 4 then 7 else 0 end
    )::timestamp + interval '20 hours 30 minutes') at time zone 'Europe/Istanbul'),
  'La''mondes Cafe & Bakery — Körfez, Kocaeli',
  E'Katılım detaylarını panelden yazabilirsiniz.\nHer satır sitede ayrı bir madde olarak görünür.',
  false,
  true
where not exists (select 1 from public.lm_etkinlikler);

-- ============================================================================
--  KONTROL
-- ============================================================================
select id, baslik, film_adi, tarih, yayinda from public.lm_etkinlikler order by tarih desc;
