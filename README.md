# Verida Kurumsal Bilgi Uygulaması

Kurumsal bilgi yönetimi ve paylaşım platformu. Güvenli, rol tabanlı erişim kontrolü ile bilgilerinizi yönetin.

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları yükleyin
npm install

# Çevre değişkenlerini ayarlayın
cp .env.example .env.local

# Veritabanını kurun
./scripts/setup-db.sh

# Geliştirme sunucusunu başlatın
npm run dev
```

## 📚 Dokümantasyon

Detaylı dokümantasyon için [`docs/`](./docs/) klasörüne bakın:

- **[Proje Genel Bilgileri](./docs/PROJECT_README.md)** - Teknolojiler ve temel kurulum
- **[Veritabanı Kurulumu](./docs/DATABASE_SETUP.md)** - Veritabanı kurulum rehberi
- **[Rol Yönetim Sistemi](./docs/ROLE_MANAGEMENT.md)** - Kullanıcı rolleri ve yetkilendirme
- **[API Dokümantasyonu](./docs/API_DOCUMENTATION.md)** - REST API endpoint'leri
- **[Güvenlik Rehberi](./docs/SECURITY_GUIDE.md)** - Güvenlik özellikleri ve en iyi uygulamalar
- **[Geliştirme Ortamı](./docs/DEVELOPMENT_SETUP.md)** - Geliştirme ortamı kurulumu
- **[Test Rehberi](./docs/TESTING_GUIDE.md)** - Test yazma ve çalıştırma
- **[Sistem Mimarisi](./docs/ARCHITECTURE.md)** - Uygulama mimarisi ve bileşenler

## 🔧 Temel Komutlar

```bash
# Geliştirme
npm run dev              # Geliştirme sunucusu
npm run build            # Üretim build'i
npm run start            # Üretim sunucusu

# Kod Kalitesi
npm run lint             # ESLint kontrolü
npm run format           # Prettier formatı
npm run type-check       # TypeScript kontrolü

# Veritabanı
npm run db:generate      # Prisma client oluştur
npm run db:migrate       # Migration uygula
npm run db:studio        # Prisma Studio aç
npm run db:seed          # Test verisi ekle

# AI Test Scripts
npm run test:role-management    # Rol yönetimi testleri
npm run test:api-validation     # API validation testleri
npx tsx scripts/test-*.ts       # Tüm test script'leri
```

## 🏗️ Teknoloji Stack'i

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js, Prisma ORM
- **Database**: PostgreSQL
- **Validation**: Zod schemas
- **Testing**: AI-generated TypeScript test scripts

## 🔐 Güvenlik Özellikleri

- **Domain Kısıtlaması**: Sadece @dgmgumruk.com email adresleri
- **Rol Tabanlı Erişim**: 4 seviyeli yetki sistemi (MEMBER → EDITOR → ADMIN → SYSTEM_ADMIN)
- **Session Güvenliği**: NextAuth.js ile JWT tabanlı authentication
- **Input Validation**: Tüm girişlerde Zod schema validation
- **Activity Logging**: Tüm kritik işlemlerin audit kaydı

## 📊 Proje Durumu

### ✅ Tamamlanan Özellikler
- [x] Veritabanı şeması ve migration'lar
- [x] Kullanıcı authentication sistemi
- [x] Rol tabanlı yetkilendirme sistemi
- [x] User management API'leri
- [x] Middleware ve güvenlik katmanları
- [x] Comprehensive dokümantasyon

### 🚧 Devam Eden Çalışmalar
- [ ] Content management sistemi
- [ ] File upload/management
- [ ] Notification sistemi
- [ ] Frontend UI bileşenleri

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- **Proje Sahibi**: DGM Gümrük Müşavirliği
- **Geliştirici**: Kiro AI Assistant
- **Dokümantasyon**: [`docs/`](./docs/) klasörü