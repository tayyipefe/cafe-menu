-- ============================================================================
--  La'mondes — Yeni Mesaj Bildirimi Tetikleyicisi
--
--  lm_mesajlar tablosuna yeni kayıt düştüğünde Edge Function'ı çağırır,
--  o da Gmail üzerinden bildirim e-postası gönderir.
--
--  ÖNCE Edge Function'ı dağıtın, SONRA bu dosyayı çalıştırın.
--  Aşağıdaki iki satırı kendi bilgilerinizle değiştirmeyi unutmayın:
--    - FONKSIYON_ADRESI  (proje referansınız zaten yazılı, dokunmayın)
--    - GIZLI_ANAHTAR     (Edge Function'daki WEBHOOK_GIZLI ile AYNI olmalı)
-- ============================================================================

-- 1. HTTP isteği atabilmek için pg_net eklentisi
create extension if not exists pg_net with schema extensions;

-- 2. Tetikleyici fonksiyon
create or replace function public.lm_mesaj_bildirimi()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  fonksiyon_adresi text := 'https://jaqqekhriltecdoqghaw.supabase.co/functions/v1/yeni-mesaj-bildirimi';
  gizli_anahtar    text := 'BURAYA_UZUN_BIR_GIZLI_ANAHTAR_YAZIN';
begin
  perform net.http_post(
    url     := fonksiyon_adresi,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-lm-gizli',   gizli_anahtar
               ),
    body    := jsonb_build_object('type', 'INSERT', 'table', 'lm_mesajlar',
                                  'record', to_jsonb(new)),
    timeout_milliseconds := 8000
  );
  return new;
exception when others then
  -- Bildirim gönderilemese bile mesaj kaydı KAYBOLMASIN.
  raise warning 'Mesaj bildirimi gönderilemedi: %', sqlerrm;
  return new;
end $$;

-- 3. Tetikleyiciyi bağla
drop trigger if exists lm_mesaj_bildirimi_trg on public.lm_mesajlar;
create trigger lm_mesaj_bildirimi_trg
  after insert on public.lm_mesajlar
  for each row execute function public.lm_mesaj_bildirimi();

-- ============================================================================
--  TEST
-- ============================================================================
-- Aşağıdaki satırı çalıştırıp Gmail kutunuza bakın:
--
--   insert into public.lm_mesajlar (ad, eposta, telefon, konu, mesaj)
--   values ('Test Kaydı', 'test@ornek.com', '0542 406 20 95', 'Bildirim testi',
--           'Bu bir bildirim testidir, panelden silebilirsiniz.');
--
-- E-posta gelmezse gönderim kayıtlarına bakın:
--   select id, url, status_code, error_msg, created
--   from net._http_response order by created desc limit 5;
--
-- ============================================================================
--  ALTERNATİF: Panelden webhook (SQL yerine)
-- ============================================================================
-- SQL ile uğraşmak istemezseniz aynı işi arayüzden de yapabilirsiniz:
--   Database → Webhooks → "Create a new hook"
--     Name        : yeni-mesaj-bildirimi
--     Table       : lm_mesajlar
--     Events      : Insert
--     Type        : Supabase Edge Functions
--     Edge Function: yeni-mesaj-bildirimi
--     HTTP Headers: x-lm-gizli = <WEBHOOK_GIZLI ile aynı değer>
--
-- Bu yolu seçerseniz yukarıdaki 2. ve 3. adımı ÇALIŞTIRMAYIN,
-- yoksa her mesajda iki e-posta gelir.
-- ============================================================================
