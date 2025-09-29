# Verida Kurumsal Bilgi Uygulaması

Kurumsal bilgi yönetimi ve paylaşım platformu. Güvenli, merkezi olmayan veri depolama ile bilgilerinizi yönetin.

## Teknolojiler

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Prisma** - Database ORM
- **NextAuth.js** - Authentication
- **Zod** - Schema validation
- **PostgreSQL** - Database

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Çevre değişkenlerini ayarlayın:
```bash
cp .env.example .env
```

3. Veritabanını ayarlayın:
```bash
npm run db:generate
npm run db:push
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## Komutlar

- `npm run dev` - Geliştirme sunucusunu başlatır
- `npm run build` - Üretim için build alır
- `npm run start` - Üretim sunucusunu başlatır
- `npm run lint` - ESLint kontrolü yapar
- `npm run format` - Prettier ile formatlar
- `npm run type-check` - TypeScript kontrolü yapar
- `npm run db:generate` - Prisma client oluşturur
- `npm run db:push` - Veritabanı şemasını günceller
- `npm run db:studio` - Prisma Studio'yu açar

## Proje Yapısı

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # UI components
│   ├── layout/        # Layout components
│   └── forms/         # Form components
├── lib/               # Utility functions
│   ├── prisma.ts      # Prisma client
│   ├── utils.ts       # General utilities
│   ├── errors.ts      # Error handling
│   ├── logger.ts      # Logging
│   └── validations.ts # Zod schemas
└── types/             # TypeScript types
    └── index.ts       # Common types
```

## Çevre Değişkenleri

```env
DATABASE_URL="postgresql://username:password@localhost:5432/verida_kurumsal_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.