# La'mondes Cafe & Bakery — Web Sitesi ve Yönetim Paneli

Statik site + Supabase (PostgreSQL, Auth, Storage). Backend sunucusu gerekmez;
`public/` klasörünü herhangi bir statik hosting'e yükleyip yayına alabilirsiniz.

**İşletme:** Mimar Sinan Mah., Ayık Sk. No:18, 41780 Körfez / Kocaeli
· +90 542 406 20 95 · coskunmmustafa@gmail.com · [@lamondescafe](https://www.instagram.com/lamondescafe)
· Her gün 11:00 – 00:00

---

## 1. Klasör yapısı

```
public/                          ← Yayına alınacak tek klasör
├── index.html                   Ana sayfa
├── hakkimizda.html              Hakkımızda
├── menu.html                    Menü (Supabase'den dinamik)
├── galeri.html                  Galeri (dinamik + lightbox)
├── quiz.html                    Etkinlikler (dinamik + geri sayım)
├── iletisim.html                Harita + iletişim formu
├── yasal/                       5 yasal sayfa
├── admin/
│   ├── login.html               Giriş  (/admin/login)
│   └── index.html               Yönetim paneli
└── assets/
    ├── css/site.css · admin.css
    └── js/config.js · supa.js · site.js · admin.js

supabase/
├── 01-sema-ve-guvenlik.sql      Tablolar + RLS + Storage
├── 02-baslangic-verisi.sql      Galeri + örnek etkinlik
├── 03-mesaj-bildirimi.sql       Yeni mesaj → e-posta tetikleyicisi
├── 04-guncel-menu.sql           ★ GÜNCEL MENÜ (6 kategori, 43 ürün)
├── 05-quiz-night.sql            ★ Quiz Night alanları + video yükleme izni
├── 06-fiyat-guncelleme.sql      ★ Fiyat güncellemesi (menü kuruluysa bunu kullanın)
├── 07-badem-sutu.sql            ★ Badem sütlü ürünleri kaldırır, ekstra olarak ekler
└── edge-functions/
    └── yeni-mesaj-bildirimi/index.ts    Gmail gönderen fonksiyon

sunucu.js                        Yerel önizleme (node sunucu.js)
arsiv-eski-site/                 İlk sürüm, yedek olarak duruyor
```

**İşletme bilgilerini değiştirmek için tek dosya:**
`public/assets/js/config.js` → `ISLETME` bölümü. Adres, telefon, saatler,
Instagram, harita — hepsi buradan tüm sayfalara yayılır.

---

## 1b. QR kodlar

Ana sayfada iki QR kod var: **Menü** ve **Web Sitemiz**. İkisi de
`config.js` içindeki tek satırdan üretilir:

```js
SITE_ADRESI: "https://lamondescafe.com",
```

- Menü QR → `SITE_ADRESI + "/menu.html"`
- Site QR → `SITE_ADRESI`

Alan adınızı aldığınızda **sadece bu satırı** değiştirin; QR kodları
kendiliğinden yeniden çizilir, ayrıca bir işlem gerekmez.

> ⚠️ **Şu anki adres yer tutucudur.** Alan adı alınmadan QR kodlarını
> masaya/vitrine BASMAYIN — kod çalışmayan bir adrese gider.
> Bastırmadan önce mutlaka telefonunuzla okutup test edin.

QR üretimi `qrcode-generator` (MIT) kütüphanesiyle yapılır; dosya
`public/assets/js/vendor/qrcode.js` içinde yereldir, internet bağlantısı
veya CDN gerektirmez. Yalnızca ana sayfada, sayfa çizildikten sonra yüklenir.

Sayfayı yazdırırsanız (Ctrl+P) menü ve başlık gizlenir, yalnızca QR kartları
çıkar — masa kartı basmak için kullanabilirsiniz.

---

## 1c. Gizli yönetim girişi

Sitede görünür bir "Admin" bağlantısı **yoktur**. Panele girmek için:

> Alt bilgideki telif satırının **en sonundaki noktaya** tıklayın:
> `© 2026 La'mondes Cafe & Bakery. Tüm hakları saklıdır` **`.`** ← burası

Bu nokta her sayfanın altında bulunur ve sizi `/admin/login` adresine götürür.
Normal metin gibi göründüğü için ziyaretçilerin dikkatini çekmez.
Doğrudan adres yazarak da girebilirsiniz.

---

## 1d. Menüyü güncelleme

Güncel menü `supabase/04-guncel-menu.sql` dosyasında tutulur:
**6 kategori, 42 ürün.** Dosyayı SQL Editor'de çalıştırmak menüyü sıfırlayıp
bu listeye eşitler — istediğiniz kadar tekrar çalıştırabilirsiniz.

| Hangi durumda | Hangi dosya |
|---|---|
| Menü hiç kurulmadı / baştan kurmak istiyorum | `04-guncel-menu.sql` — tek başına yeterlidir |
| Menü kurulu, üstüne güncelleme yapacağım | `06` sonra `07` (bu sırayla) |

`04` dosyası `06` ve `07`'nin sonucunu zaten içerir; hangi yolu seçerseniz
menü aynı yere varır.

**Badem sütü:** Ayrı ürün değildir. Müşteri istediği içeceği seçer, üstüne
Ekstralar'daki **Badem Sütü (+30 ₺)** eklenir.

| Kategori | Ürün |
|---|---|
| Tatlılar & Waffle | 5 |
| Soğuk Kahveler | 7 |
| Sıcak Kahveler | 15 |
| Diğer Sıcak İçecekler & Çaylar | 6 |
| Soğuk İçecekler & Ferahlatıcılar | 8 |
| Ekstralar | 2 |

Tek tük fiyat/ürün değişikliği için SQL'e gerek yok — **panelden** yapın.
SQL'i yalnızca menüyü topluca yenilemek istediğinizde kullanın.

> Ürünlerde açıklama ve fotoğraf **yok** (siz vermediniz, ben uydurmadım).
> Menüde yalnızca ad ve fiyat görünür. Dilerseniz panelden her ürüne açıklama
> ve fotoğraf ekleyebilirsiniz.

**Ana sayfadaki "Öne çıkanlar"** için 6 ürün işaretli: Krema Bardak,
San Sebastyan, Duble Waffle, Ice Latte, Filtre Kahve, Sıcak Çikolata.
Panelden ürünü düzenleyip "Ana sayfada öne çıkar" anahtarıyla değiştirebilirsiniz.
Hiçbiri seçili değilse bölüm ana sayfada tamamen gizlenir.

---

## 2. Yerel çalıştırma

```bash
node sunucu.js
```

Site `http://localhost:4000` · Panel `http://localhost:4000/admin/login`

> Dosyalara çift tıklayarak (`file://`) açmayın; tarayıcı güvenlik kuralları
> Supabase isteklerini engeller.

---

## 3. Gmail bildirim sistemi (kurulacak)

Yeni mesaj geldiğinde Gmail'inize otomatik bildirim gider. Dört adım:

### Adım 1 · Google uygulama şifresi alın

1. Google Hesabınızda **2 Adımlı Doğrulama**'yı açın (zorunlu).
2. https://myaccount.google.com/apppasswords adresine gidin.
3. "Uygulama adı" olarak `La'mondes Site` yazıp oluşturun.
4. Çıkan **16 haneli şifreyi** kopyalayın — bu, Gmail şifreniz değildir ve
   sadece bu iş için kullanılır. İstediğiniz an iptal edebilirsiniz.

### Adım 2 · Edge Function'ı dağıtın

```bash
npx supabase login
npx supabase link --project-ref jaqqekhriltecdoqghaw
npx supabase functions deploy yeni-mesaj-bildirimi --no-verify-jwt
```

> Fonksiyon dosyası `supabase/edge-functions/yeni-mesaj-bildirimi/index.ts`.
> Supabase CLI, klasörü `supabase/functions/` altında arar — dağıtımdan önce
> klasörü oraya kopyalayın ya da `--project-dir` ile yol verin.

### Adım 3 · Gizli anahtarları tanımlayın

Supabase paneli → **Edge Functions → Secrets** → şunları ekleyin:

| Anahtar | Değer |
|---|---|
| `GMAIL_ADRES` | coskunmmustafa@gmail.com |
| `GMAIL_UYGULAMA_SIFRESI` | Adım 1'deki 16 haneli şifre (boşluksuz) |
| `BILDIRIM_ALICI` | Bildirimin gideceği adres (boş bırakılırsa yukarıdaki) |
| `WEBHOOK_GIZLI` | Uzun, rastgele bir metin (siz belirleyin) |
| `PANEL_ADRESI` | Yayına aldıktan sonra `https://siteniz.com/admin/` |

### Adım 4 · Tetikleyiciyi kurun

`supabase/03-mesaj-bildirimi.sql` dosyasını açın, içindeki
`BURAYA_UZUN_BIR_GIZLI_ANAHTAR_YAZIN` satırını `WEBHOOK_GIZLI` ile **aynı**
değerle değiştirin ve SQL Editor'de çalıştırın.

Dosyanın sonunda bir test sorgusu ve sorun giderme adımları var.

> **SMTP çalışmazsa:** Bazı ortamlarda Gmail SMTP bağlantısı engellenebiliyor.
> Bu durumda `index.ts` içindeki gönderim bölümünü Resend'e çevirmek 10 dakikalık
> bir iş — söyleyin, yapayım.

---

## 4. Panel kullanımı

| Bölüm | Ne yapar |
|---|---|
| **Özet** | Sayılar, yaklaşan etkinlik, stokta olmayanlar, son mesajlar |
| **Menü** | Kategori ve ürün ekle/düzenle/sil/sırala · fiyat · görsel · **Stokta var/yok** · "Ana sayfada öne çıkar" |
| **Galeri** | Sürükle-bırak yükleme · başlık · ↑↓ sıralama · silme |
| **Quiz Night Yönetimi** | Film/tema adı · tarih-saat (yeni kayıtta 21:00 hazır gelir) · **video** (Instagram/YouTube bağlantısı, embed kodu veya dosya) · afiş · katılım detayları · **Yayınla** / **Geri sayım** anahtarları. Yaklaşan ve geçmiş etkinlikler ayrı tablolarda listelenir. |
| **Mesajlar** | Gelen talepler · okundu işaretleme · silme |
| **Hesap** | Şifre değiştirme, çıkış |

**Canlı bildirim:** Panel açıkken 45 saniyede bir yeni mesaj kontrol edilir;
geldiğinde rozet, tarayıcı sekme başlığı `(2) Yönetim Paneli` ve bir bildirim
kutusu belirir.

### Quiz Night nasıl çalışıyor?

Quiz sayfasında **sabit bilgiler** her zaman görünür (katılım ücretsiz, saat 21:00,
kolay test → bardak waffle, zor test → normal waffle). Bunlar sayfaya yazılıdır,
panelden girilmez — değişirse söyleyin, güncelleyeyim.

Panelden eklediğiniz etkinlikler ise **tarihine göre** otomatik ayrılır:

- **Tarihi gelecekte** → "Yaklaşan Quiz Night" bölümünde tema adı, tarih,
  geri sayım ve varsa afiş/video ile çıkar
- **Tarihi geçmiş** → "Geçmiş Quiz Night'lardan" arşivinde videosuyla listelenir
- **Yayında yaklaşan etkinlik yoksa** → ziyaretçi *"Çok Yakında Yeni Etkinlik!"*
  kartını görür
- **Hiç geçmiş etkinlik yoksa** → arşiv bölümü tamamen gizlenir

Etkinlik günü boyunca (6 saat pay) kayıt hâlâ "yaklaşan" sayılır, gece yarısı
kendiliğinden arşive düşer. Elle işaretleme yapmanız gerekmez.

**Video eklerken:** Instagram gönderi/reels bağlantısı, YouTube bağlantısı,
hazır embed kodu veya doğrudan dosya yükleyebilirsiniz. Yapıştırdığınız embed
kodundan yalnızca video adresi alınır, kodun kalanı sayfaya basılmaz — güvenlik
için böyle. Desteklenenler: YouTube, Instagram, Vimeo ve mp4/webm/mov dosyaları.

> 💡 Dosya yüklemek yerine **Instagram bağlantısı** kullanmanızı öneririm:
> depolama kotanız dolmaz, video daha hızlı açılır ve Instagram gönderiniz de
> etkileşim alır. Dosya yüklerseniz sınır 50 MB.

---

## 5. Güvenlik

- `config.js` içindeki anahtar **anon (public)** anahtardır; tarayıcıda görünmesi
  tasarım gereğidir. **`service_role` anahtarını asla buraya koymayın.**
- Gerçek koruma RLS politikalarındadır. Test edildi:
  - Ziyaretçi ürün/kategori/galeri/etkinlik **ekleyemez, değiştiremez, silemez**
  - Ziyaretçi mesaj **yazabilir**, ama mesajları **okuyamaz**
  - Kendini yönetici yapamaz
- Görsel yüklemeleri 5 MB ve yalnızca resim tipleriyle sınırlı.
- Panel sayfalarında `noindex, nofollow`.

---

## 6. Yayına almadan önce

1. **Yasal metinler şablondur.** Beş sayfada `[TİCARİ UNVAN]`, `[VERGİ DAİRESİ]`,
   `[VERGİ NO]`, `[MERSİS NO]`, `[KEP ADRESİ]` alanları boş. Doldurun ve bir
   hukuk danışmanına kontrol ettirin. VERBİS yükümlülüğünüzü de kontrol edin.

2. **Görseller stok fotoğraftır.** Menü, galeri ve Hakkımızda sayfasındaki
   fotoğrafları kendi çekimlerinizle değiştirin — galeri ve ürünler için
   panelden yükleyebilirsiniz.

3. **SQL dosyalarını sırayla çalıştırın:**
   - `supabase/04-guncel-menu.sql` — örnek menüyü silip gerçek menünüzü kurar
   - `supabase/05-quiz-night.sql` — "San Sebastian" yazımını düzeltir, Quiz Night'a
     film/tema ve video alanlarını ekler, depolamayı video yüklemeye açar
     (kova şu an sadece görsel kabul ediyor, bu script olmadan video yüklenemez)

4. **Alan adını alınca `SITE_ADRESI` satırını güncelleyin** ve QR kodlarını
   telefonla okutup test edin (bkz. bölüm 1b).

5. **Veritabanındaki "Quiz Night #181" etkinliği örnektir** — içindeki ödül
   ve program bilgileri gerçek değil. Panelden düzenleyin ya da silin.

6. **Test mesajlarını silin.** Mesajlar bölümünde kurulum sırasında bıraktığım
   iki test kaydı var ("Test Kullanici" ve "Site Testi").

7. **Google Place ID.** "Yorum yaz" butonu şu an işletme aramasına gidiyor.
   Doğrudan yorum kutusunu açmak için Place ID'nizi
   [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
   aracından alıp `config.js` içindeki `yorumYaz` satırına yazın.

---

## 7. Yayına alma

`public/` klasörünün içeriğini hosting'e yükleyin.

| Ortam | Nasıl |
|---|---|
| Netlify / Vercel / Cloudflare Pages | Klasörü sürükleyip bırakın |
| cPanel / FTP | `public_html` içine kopyalayın |

Supabase → Authentication → URL Configuration → **Site URL** ve
**Redirect URLs** alanlarına yayın adresinizi ekleyin.
`/admin/login` temiz adresi Netlify/Vercel/Cloudflare'de otomatik çalışır;
Apache/cPanel'de çalışmazsa `/admin/login.html` kullanın.
