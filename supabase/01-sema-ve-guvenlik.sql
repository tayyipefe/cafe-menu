-- ============================================================================
--  La'mondes Cafe & Bakery — Veritabanı Şeması ve Güvenlik Politikaları
--  Supabase → SQL Editor'e yapıştırıp "Run" deyin. Tek seferde çalışır.
--  Tüm tablolar "lm_" öneki taşır; projedeki diğer tablolarla çakışmaz.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLOLAR
-- ----------------------------------------------------------------------------

-- Yetkili yöneticiler. Bu tabloda kaydı OLMAYAN hiç kimse yazma yapamaz.
-- Kayıt ekleme yalnızca buradan (SQL Editor) yapılır, API üzerinden yapılamaz.
create table if not exists public.lm_adminler (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  eposta     text not null,
  ad         text,
  created_at timestamptz not null default now()
);

-- Menü kategorileri (Başlangıçlar, İçecekler, Tatlılar ...)
create table if not exists public.lm_kategoriler (
  id         uuid primary key default gen_random_uuid(),
  ad         text not null,
  slug       text not null unique,
  aciklama   text,
  sira       integer not null default 0,
  aktif      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Menü ürünleri
create table if not exists public.lm_urunler (
  id           uuid primary key default gen_random_uuid(),
  kategori_id  uuid not null references public.lm_kategoriler(id) on delete cascade,
  ad           text not null,
  aciklama     text,
  fiyat        numeric(10,2) not null default 0 check (fiyat >= 0),
  gorsel_url   text,
  gorsel_path  text,
  stokta       boolean not null default true,
  one_cikan    boolean not null default false,
  sira         integer not null default 0,
  aktif        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Galeri fotoğrafları
create table if not exists public.lm_galeri (
  id          uuid primary key default gen_random_uuid(),
  baslik      text,
  aciklama    text,
  gorsel_url  text not null,
  gorsel_path text,
  sira        integer not null default 0,
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Quiz Night etkinlikleri
create table if not exists public.lm_etkinlikler (
  id           uuid primary key default gen_random_uuid(),
  baslik       text not null,
  aciklama     text,
  tarih        timestamptz not null,
  konum        text,
  katilim      text,                                  -- katılım detayları / koşulları
  afis_url     text,
  afis_path    text,
  yayinda      boolean not null default false,        -- sitede görünsün mü?
  geri_sayim   boolean not null default true,         -- geri sayım kartı gösterilsin mi?
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- İletişim formu mesajları
create table if not exists public.lm_mesajlar (
  id         uuid primary key default gen_random_uuid(),
  ad         text not null check (char_length(ad) between 2 and 120),
  eposta     text not null check (eposta ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  telefon    text check (telefon is null or char_length(telefon) <= 30),
  konu       text not null check (char_length(konu) between 2 and 120),
  mesaj      text not null check (char_length(mesaj) between 10 and 4000),
  okundu     boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. İNDEKSLER
-- ----------------------------------------------------------------------------
create index if not exists lm_urunler_kategori_idx on public.lm_urunler (kategori_id, sira);
create index if not exists lm_urunler_aktif_idx    on public.lm_urunler (aktif);
create index if not exists lm_kategoriler_sira_idx on public.lm_kategoriler (sira);
create index if not exists lm_galeri_sira_idx      on public.lm_galeri (sira);
create index if not exists lm_etkinlik_tarih_idx   on public.lm_etkinlikler (tarih desc);
create index if not exists lm_mesajlar_tarih_idx   on public.lm_mesajlar (created_at desc);

-- ----------------------------------------------------------------------------
-- 3. updated_at OTOMATİK GÜNCELLEME
-- ----------------------------------------------------------------------------
create or replace function public.lm_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['lm_kategoriler','lm_urunler','lm_galeri','lm_etkinlikler'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I
       for each row execute function public.lm_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 4. YETKİ KONTROLÜ
--    Yazma izni yalnızca lm_adminler tablosunda kaydı olan kullanıcılara açıktır.
--    Böylece biri Supabase'e kayıt olsa bile içeriğe dokunamaz.
-- ----------------------------------------------------------------------------
create or replace function public.lm_yetkili()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.lm_adminler where user_id = auth.uid());
$$;

revoke all on function public.lm_yetkili() from public;
grant execute on function public.lm_yetkili() to authenticated;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.lm_adminler    enable row level security;
alter table public.lm_kategoriler enable row level security;
alter table public.lm_urunler     enable row level security;
alter table public.lm_galeri      enable row level security;
alter table public.lm_etkinlikler enable row level security;
alter table public.lm_mesajlar    enable row level security;

-- Eski politikaları temizle (script tekrar çalıştırılabilsin diye)
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename like 'lm_%'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- --- lm_adminler: her yönetici yalnızca KENDİ kaydını görebilir ---------------
-- (lm_yetkili() SECURITY DEFINER olduğu için bu kısıt yetki kontrolünü etkilemez)
create policy "adminler_kendi_kaydi" on public.lm_adminler
  for select to authenticated using (user_id = auth.uid());

-- --- Kategoriler --------------------------------------------------------------
create policy "kategori_herkes_okur" on public.lm_kategoriler
  for select to anon, authenticated using (aktif = true);
create policy "kategori_admin_okur" on public.lm_kategoriler
  for select to authenticated using (public.lm_yetkili());
create policy "kategori_admin_yazar" on public.lm_kategoriler
  for insert to authenticated with check (public.lm_yetkili());
create policy "kategori_admin_gunceller" on public.lm_kategoriler
  for update to authenticated using (public.lm_yetkili()) with check (public.lm_yetkili());
create policy "kategori_admin_siler" on public.lm_kategoriler
  for delete to authenticated using (public.lm_yetkili());

-- --- Ürünler ------------------------------------------------------------------
create policy "urun_herkes_okur" on public.lm_urunler
  for select to anon, authenticated using (aktif = true);
create policy "urun_admin_okur" on public.lm_urunler
  for select to authenticated using (public.lm_yetkili());
create policy "urun_admin_yazar" on public.lm_urunler
  for insert to authenticated with check (public.lm_yetkili());
create policy "urun_admin_gunceller" on public.lm_urunler
  for update to authenticated using (public.lm_yetkili()) with check (public.lm_yetkili());
create policy "urun_admin_siler" on public.lm_urunler
  for delete to authenticated using (public.lm_yetkili());

-- --- Galeri -------------------------------------------------------------------
create policy "galeri_herkes_okur" on public.lm_galeri
  for select to anon, authenticated using (aktif = true);
create policy "galeri_admin_okur" on public.lm_galeri
  for select to authenticated using (public.lm_yetkili());
create policy "galeri_admin_yazar" on public.lm_galeri
  for insert to authenticated with check (public.lm_yetkili());
create policy "galeri_admin_gunceller" on public.lm_galeri
  for update to authenticated using (public.lm_yetkili()) with check (public.lm_yetkili());
create policy "galeri_admin_siler" on public.lm_galeri
  for delete to authenticated using (public.lm_yetkili());

-- --- Etkinlikler --------------------------------------------------------------
create policy "etkinlik_herkes_okur" on public.lm_etkinlikler
  for select to anon, authenticated using (yayinda = true);
create policy "etkinlik_admin_okur" on public.lm_etkinlikler
  for select to authenticated using (public.lm_yetkili());
create policy "etkinlik_admin_yazar" on public.lm_etkinlikler
  for insert to authenticated with check (public.lm_yetkili());
create policy "etkinlik_admin_gunceller" on public.lm_etkinlikler
  for update to authenticated using (public.lm_yetkili()) with check (public.lm_yetkili());
create policy "etkinlik_admin_siler" on public.lm_etkinlikler
  for delete to authenticated using (public.lm_yetkili());

-- --- Mesajlar -----------------------------------------------------------------
-- Ziyaretçi YALNIZCA mesaj bırakabilir; kimse mesajları okuyamaz.
create policy "mesaj_herkes_yazar" on public.lm_mesajlar
  for insert to anon, authenticated with check (true);
create policy "mesaj_admin_okur" on public.lm_mesajlar
  for select to authenticated using (public.lm_yetkili());
create policy "mesaj_admin_gunceller" on public.lm_mesajlar
  for update to authenticated using (public.lm_yetkili()) with check (public.lm_yetkili());
create policy "mesaj_admin_siler" on public.lm_mesajlar
  for delete to authenticated using (public.lm_yetkili());

-- ----------------------------------------------------------------------------
-- 6. DEPOLAMA (Storage) — görsel yüklemeleri
--
-- NOT: Bazı Supabase projelerinde storage.objects üzerinde politika oluşturmak
-- için yetki kısıtlı olabilir ve bu bölüm "must be owner of table objects"
-- hatası verebilir. Böyle bir durumda bu bölümü atlayın ve aynı 4 politikayı
-- panelden tanımlayın:  Storage → lm-medya → Policies → New policy
--   • SELECT  : anon, authenticated   → bucket_id = 'lm-medya'
--   • INSERT  : authenticated         → bucket_id = 'lm-medya' AND public.lm_yetkili()
--   • UPDATE  : authenticated         → aynı koşul
--   • DELETE  : authenticated         → aynı koşul
-- Kovanın kendisini de Storage → New bucket ile "lm-medya" adıyla ve
-- "Public bucket" işaretli olarak oluşturabilirsiniz.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lm-medya', 'lm-medya', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lm_medya_herkes_okur"  on storage.objects;
drop policy if exists "lm_medya_admin_yazar"  on storage.objects;
drop policy if exists "lm_medya_admin_gunceller" on storage.objects;
drop policy if exists "lm_medya_admin_siler"  on storage.objects;

create policy "lm_medya_herkes_okur" on storage.objects
  for select to anon, authenticated using (bucket_id = 'lm-medya');
create policy "lm_medya_admin_yazar" on storage.objects
  for insert to authenticated with check (bucket_id = 'lm-medya' and public.lm_yetkili());
create policy "lm_medya_admin_gunceller" on storage.objects
  for update to authenticated using (bucket_id = 'lm-medya' and public.lm_yetkili());
create policy "lm_medya_admin_siler" on storage.objects
  for delete to authenticated using (bucket_id = 'lm-medya' and public.lm_yetkili());

-- ----------------------------------------------------------------------------
-- 7. KURULUM SONRASI — YÖNETİCİ TANIMLAMA
-- ----------------------------------------------------------------------------
-- ADIM 1: Supabase panelinde  Authentication → Users → "Add user"
--         E-posta + şifre girin, "Auto Confirm User" işaretli olsun.
--
-- ADIM 2: Aşağıdaki satırdaki e-postayı kendi yönetici e-postanızla değiştirip
--         SQL Editor'de çalıştırın:
--
--   insert into public.lm_adminler (user_id, eposta, ad)
--   select id, email, 'Yönetici' from auth.users where email = 'sizin@epostaniz.com'
--   on conflict (user_id) do nothing;
--
-- ADIM 3 (önemli): Authentication → Providers → Email bölümünde
--         "Allow new users to sign up" seçeneğini KAPATIN.
--         Böylece dışarıdan kimse hesap açamaz.
-- ============================================================================
