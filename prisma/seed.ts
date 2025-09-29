import { PrismaClient, UserRole, ContentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create system admin user
  const systemAdmin = await prisma.user.upsert({
    where: { email: 'admin@dgmgumruk.com' },
    update: {},
    create: {
      email: 'admin@dgmgumruk.com',
      name: 'Sistem Yöneticisi',
      role: UserRole.SYSTEM_ADMIN,
      emailVerified: new Date(),
      notificationPrefs: {
        create: {
          inAppNotifications: true,
        },
      },
    },
  });

  console.log('✅ Created system admin user:', systemAdmin.email);

  // Create sample admin user
  const admin = await prisma.user.upsert({
    where: { email: 'yonetici@dgmgumruk.com' },
    update: {},
    create: {
      email: 'yonetici@dgmgumruk.com',
      name: 'Yönetici',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      notificationPrefs: {
        create: {
          inAppNotifications: true,
        },
      },
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample editor user
  const editor = await prisma.user.upsert({
    where: { email: 'editor@dgmgumruk.com' },
    update: {},
    create: {
      email: 'editor@dgmgumruk.com',
      name: 'İçerik Editörü',
      role: UserRole.EDITOR,
      emailVerified: new Date(),
      notificationPrefs: {
        create: {
          inAppNotifications: true,
        },
      },
    },
  });

  console.log('✅ Created editor user:', editor.email);

  // Create sample member user
  const member = await prisma.user.upsert({
    where: { email: 'calisan@dgmgumruk.com' },
    update: {},
    create: {
      email: 'calisan@dgmgumruk.com',
      name: 'Çalışan',
      role: UserRole.MEMBER,
      emailVerified: new Date(),
      notificationPrefs: {
        create: {
          inAppNotifications: true,
        },
      },
    },
  });

  console.log('✅ Created member user:', member.email);

  // Create sample pages
  const infoPage = await prisma.page.create({
    data: {
      title: 'Şirket Hakkında Bilgiler',
      content: `
        <h2>Şirket Misyonu</h2>
        <p>DGM Gümrük, müşterilerine en kaliteli gümrük hizmetlerini sunmayı amaçlar.</p>
        
        <h2>Vizyon</h2>
        <p>Gümrük sektöründe lider konumda olmak ve müşteri memnuniyetini en üst düzeyde tutmak.</p>
        
        <h2>Değerlerimiz</h2>
        <ul>
          <li>Güvenilirlik</li>
          <li>Şeffaflık</li>
          <li>Müşteri odaklılık</li>
          <li>Sürekli gelişim</li>
        </ul>
      `,
      pageType: ContentType.INFO,
      authorId: editor.id,
      tags: ['şirket', 'hakkında', 'misyon', 'vizyon'],
      published: true,
    },
  });

  console.log('✅ Created info page:', infoPage.title);

  const procedurePage = await prisma.page.create({
    data: {
      title: 'Gümrük Beyannamesi Hazırlama Prosedürü',
      content: `
        <h2>Gümrük Beyannamesi Hazırlama Adımları</h2>
        
        <h3>1. Ön Hazırlık</h3>
        <p>Gerekli belgeler toplanır ve kontrol edilir.</p>
        
        <h3>2. Beyanname Doldurma</h3>
        <p>Sistem üzerinden beyanname bilgileri girilir.</p>
        
        <h3>3. Kontrol ve Onay</h3>
        <p>Girilen bilgiler kontrol edilir ve onaylanır.</p>
        
        <h3>4. Gönderim</h3>
        <p>Beyanname gümrük idaresine gönderilir.</p>
      `,
      pageType: ContentType.PROCEDURE,
      authorId: editor.id,
      tags: ['prosedür', 'beyanname', 'gümrük'],
      published: true,
    },
  });

  console.log('✅ Created procedure page:', procedurePage.title);

  const announcementPage = await prisma.page.create({
    data: {
      title: 'Yeni Sistem Güncellemesi',
      content: `
        <h2>Sistem Güncellemesi Duyurusu</h2>
        <p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
        
        <p>Değerli çalışanlar,</p>
        
        <p>Verida bilgi yönetim sistemi başarıyla devreye alınmıştır. 
        Artık tüm kurumsal bilgilere bu platform üzerinden erişebilirsiniz.</p>
        
        <h3>Yeni Özellikler:</h3>
        <ul>
          <li>Gelişmiş arama fonksiyonu</li>
          <li>Gerçek zamanlı bildirimler</li>
          <li>Dosya paylaşım sistemi</li>
          <li>Yorum ve geri bildirim sistemi</li>
        </ul>
        
        <p>Herhangi bir sorunuz olması durumunda IT departmanı ile iletişime geçebilirsiniz.</p>
      `,
      pageType: ContentType.ANNOUNCEMENT,
      authorId: admin.id,
      tags: ['duyuru', 'sistem', 'güncelleme'],
      published: true,
    },
  });

  console.log('✅ Created announcement page:', announcementPage.title);

  const warningPage = await prisma.page.create({
    data: {
      title: 'Güvenlik Uyarısı: Şifre Politikası',
      content: `
        <h2>⚠️ ÖNEMLİ GÜVENLİK UYARISI</h2>
        
        <p><strong>Konu:</strong> Şifre Güvenliği Politikası</p>
        
        <h3>Zorunlu Şifre Kriterleri:</h3>
        <ul>
          <li>En az 8 karakter uzunluğunda olmalı</li>
          <li>Büyük ve küçük harf içermeli</li>
          <li>En az bir rakam içermeli</li>
          <li>Özel karakter içermeli</li>
        </ul>
        
        <h3>Yapılmaması Gerekenler:</h3>
        <ul>
          <li>Şifrenizi kimseyle paylaşmayın</li>
          <li>Aynı şifreyi farklı sistemlerde kullanmayın</li>
          <li>Şifrenizi not alarak bırakmayın</li>
        </ul>
        
        <p><strong>Hatırlatma:</strong> Şifrelerinizi düzenli olarak değiştirmeyi unutmayın.</p>
      `,
      pageType: ContentType.WARNING,
      authorId: systemAdmin.id,
      tags: ['güvenlik', 'şifre', 'uyarı'],
      published: true,
    },
  });

  console.log('✅ Created warning page:', warningPage.title);

  // Create sample notifications
  await prisma.notification.create({
    data: {
      userId: member.id,
      title: 'Hoş Geldiniz!',
      message: 'Verida bilgi yönetim sistemine hoş geldiniz. Sistemi keşfetmeye başlayabilirsiniz.',
      type: 'welcome',
    },
  });

  await prisma.notification.create({
    data: {
      userId: member.id,
      title: 'Yeni Duyuru',
      message: 'Yeni sistem güncellemesi hakkında duyuru yayınlandı.',
      type: 'announcement',
    },
  });

  console.log('✅ Created sample notifications');

  // Log sample activities
  await prisma.activityLog.create({
    data: {
      userId: editor.id,
      action: 'CREATE_PAGE',
      resourceType: 'Page',
      resourceId: infoPage.id,
      details: {
        pageTitle: infoPage.title,
        pageType: infoPage.pageType,
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: 'CREATE_PAGE',
      resourceType: 'Page',
      resourceId: announcementPage.id,
      details: {
        pageTitle: announcementPage.title,
        pageType: announcementPage.pageType,
      },
    },
  });

  console.log('✅ Created sample activity logs');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample Users Created:');
  console.log(`   System Admin: ${systemAdmin.email}`);
  console.log(`   Admin: ${admin.email}`);
  console.log(`   Editor: ${editor.email}`);
  console.log(`   Member: ${member.email}`);
  console.log('\n📄 Sample Pages Created:');
  console.log(`   Info: ${infoPage.title}`);
  console.log(`   Procedure: ${procedurePage.title}`);
  console.log(`   Announcement: ${announcementPage.title}`);
  console.log(`   Warning: ${warningPage.title}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });