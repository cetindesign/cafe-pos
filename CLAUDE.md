# CLAUDE.md — Cafe POS (OZ Coffee Shelter)

Bu dosya, projede çalışan AI asistanına (Claude Code) kalıcı bağlam sağlar.
Her oturumda bu dosyayı oku ve aşağıdaki kurallara uy.

## Proje Özeti

OZ Coffee Shelter adlı bir kahveci için geliştirilmiş, tablet-first bir
Satış Noktası (POS) uygulaması. V1 tamamlandı ve canlıda.

- Repo: github.com/cetindesign/cafe-pos
- Canlı: cafe-pos-six-red.vercel.app
- Kapsam: menü yönetimi, bölgeli masa yönetimi, sipariş alma, nakit/kart ile
  hesap kapatma, zaman aralığına göre satış raporu.

## Benimle (Murat) Çalışma Şekli — ÖNEMLİ

- Ben bir ürün tasarımcısıyım, yazılım geçmişim yok. Teknik kararları sen ver,
  ama HER kararı sade bir dille açıkla: ne yaptın, neden yaptın, alternatifi neydi.
- Açıklamasız kod verme. Kör kabul etmiyorum.
- Aynı anda TEK görev. Bir görev bitip doğrulanmadan diğerine geçme.
- Küçük, doğrulanabilir adımlarla ilerle. Devasa refactor'lardan kaçın.
- İyimser tahmin değil, gerçekçi planlama isterim.
- Açıklamalar Türkçe, teknik terimler İngilizce (Server Component, RLS vb.).
- Kod içi yorumlar Türkçe.

## Komutlar

- Geliştirme sunucusu: `npm run dev` (localhost:3000)
- Push ÖNCESİ ZORUNLU build kontrolü: `npm run build` (Vercel'in katı kontrolünü
  önceden yakalar; dev'de geçen TypeScript hataları build'de patlar)
- Dağıtım: `git add .` → `git commit -m "..."` → `git push`. Vercel main branch'e
  her push'ta otomatik build + deploy alır.
- Turbopack crash olursa: `rm -rf .next` sonra tekrar `npm run dev`.

## Teknoloji Yığını

Next.js (App Router, src/ YOK) + TypeScript + Tailwind CSS v4 + Supabase
(PostgreSQL + Auth + RLS) + Vercel. İkonlar: lucide-react. Fontlar: Inter
(gövde), Playfair Display (başlık), next/font/google ile latin-ext subset.

## Mimari ve Konvansiyonlar

- Sayfalar varsayılan olarak Server Component. Sadece etkileşim gereken parçalar
  (`'use client'`): butonlar, formlar, modal, dropdown.
- Yazma işlemleri Server Action ile yapılır. Her route'un kendi `actions.ts`'i var,
  en üstte `'use server'`. Pattern: işlemi yap → `revalidatePath(...)` → gerekiyorsa
  `redirect(...)`.
- Supabase iki client: `lib/supabase/client.ts` (browser, Client Component'ler) ve
  `lib/supabase/server.ts` (server, Server Component'ler + Server Action'lar).
- Her korumalı sayfa kendi auth kontrolünü yapar (getUser → profil → rol → redirect).
  Frontend kontrolü + DB seviyesinde RLS = defense in depth.
- TypeScript tipleri: `lib/types/database.ts`.
- Tarih aralığı yardımcıları: `lib/date-ranges.ts`.
- Brand renkleri `app/globals.css` içinde Tailwind v4 `@theme` bloğunda tanımlı:
  brand-primary #1a1a1a, brand-accent #c9a96e (mat altın), brand-muted #f5f3ef (krem),
  brand-border #e8e4dc. Arka plan krem, içerik beyaz. Para tutarları sans-serif,
  başlıklar serif (font-serif).

## Akış Notu

Giriş sonrası HERKES (yönetici dahil) doğrudan /pos'a düşer. Yönetici, POS
header'ındaki "Yönetim" dropdown'undan (SettingsMenu) menü/masa/raporlara erişir.
/admin/* sayfaları hâlâ var ve korumalı; geri linkleri /pos'a döner.

## Veri Modeli (6 tablo)

- profiles: id (uuid, FK auth.users), full_name, role ('manager'|'cashier'), created_at
- categories: id, name, display_order, is_available, created_at
- products: id, category_id (FK categories), name, price (numeric 10,2),
  display_order, is_available, created_at
- tables: id, name, section (text, default 'Genel'), display_order, is_active, created_at
- orders: id, table_id (FK, restrict), cashier_id (FK auth.users, restrict),
  status ('open'|'paid'|'cancelled'), payment_method ('cash'|'card', nullable),
  created_at, closed_at (nullable)
- order_items: id, order_id (FK orders, CASCADE), product_id (FK products, restrict),
  quantity (int > 0), unit_price (numeric 10,2), note (text, nullable), created_at
- payments: id, order_id (FK orders, CASCADE), amount (numeric 10,2),
  method ('cash'|'card'), created_at. Her paid siparişin en az bir ödeme satırı var.

Önemli kararlar:
- Hesap kapatma public.close_order_with_payments(p_order_id, p_payments jsonb) RPC'si
  üzerinden atomik yapılır: ödemeleri payments tablosuna yazar, tutarı sunucuda doğrular
  (ödemeler toplamı = hesap tutarı) ve siparişi 'paid' yapar. Hesap bölme (eşit; karışık
  nakit/kart) desteklenir. orders.payment_method artık set edilmez (legacy).
- Raporlarda nakit/kart dağılımı payments tablosundan hesaplanır;
  orders.payment_method legacy'dir (artık bu split için kullanılmaz).
- Soft delete: ürün/kategori silinmez, is_available = false ile gizlenir.
  Geçmiş raporların bozulmaması için.
- Denormalize fiyat: order_items.unit_price, ürün eklenirken o anki fiyatı kopyalar.
  Yönetici sonradan fiyatı değiştirse bile geçmiş siparişler etkilenmez.
- RLS recursion'ı kırmak için public.get_user_role(user_id uuid) adında
  SECURITY DEFINER bir fonksiyon var; politikalarda rol kontrolü bununla yapılır.

## RLS Kuralları

6 tabloda da RLS açık. Okuma: giriş yapmış herkes (authenticated). Yazma:
menü ve masa tabloları → sadece manager. orders ve order_items → siparişin
sahibi (cashier_id = auth.uid()) VEYA manager. YENİ TABLO EKLERSEN: ilişkili
tüm tablolara select/insert/update/delete politikalarını eksiksiz yaz ve
manager'ı kapsadığından emin ol (order_items'ta bu unutulmuştu, 500 hatası verdi).

## Proje Yapısı (özet)

- app/page.tsx — /login veya /pos'a yönlendirir
- app/login/page.tsx, app/actions.ts (signOut)
- app/admin/page.tsx (yönetici paneli)
- app/admin/menu/ — page.tsx, actions.ts, new-category/, categories/[id]/edit/,
  new-product/, products/[id]/edit/
- app/admin/tables/ — page.tsx, actions.ts, new/, [id]/edit/
- app/admin/reports/ — page.tsx, RangeSelector.tsx
- app/pos/ — page.tsx, actions.ts, OpenTableButton, SettingsMenu, MenuGrid,
  OrderSummary, CancelEmptyOrderButton, BackToTablesLink
- app/pos/orders/[id]/ — page.tsx, success/page.tsx
- lib/supabase/{client,server}.ts, lib/types/database.ts, lib/date-ranges.ts
- app/layout.tsx (fontlar), app/globals.css (Tailwind v4 + brand renkleri)

## Kritik Tuzaklar (zor yoldan öğrenildi)

- Heredoc (cat << EOF) bu ortamda çalışmıyor. Dosyaları doğrudan oluştur/düzenle.
- Production cache: masa durumu gibi anlık veride router.refresh() YETMEDİ.
  window.location.href ile tam yenileme kullan. POS sayfalarında
  `export const dynamic = 'force-dynamic'` var.
- TypeScript generic'leri kopyala-yapıştırda bozulabiliyor (Map<K,V>). Mümkünse
  plain object / Record tercih et.
- Supabase: auth.users'a kullanıcı eklemek otomatik profiles satırı oluşturmaz.
  Manuel insert gerekir (ileride trigger yazılabilir).
- Vercel build, dev'den katı. Push öncesi MUTLAKA `npm run build` çalıştır.

## V2 Roadmap (bilinçli ertelenenler)

Hesap bölme, indirim sistemi, raporlarda özel tarih aralığı (calendar picker),
masa ismini POS'tan inline düzenleme, sipariş notları, yazıcı entegrasyonu,
POS cihazı entegrasyonu, stok yönetimi, mutfak ekranı (KDS), sadakat programı,
çoklu şube, eski açık siparişleri otomatik temizleyen cron job.