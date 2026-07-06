# URGEN Laboratory — موقع مختبر اورجين

موقع ويب لمختبر التحليلات الوراثية URGEN: كتالوج الفحوصات، الحجز، الأخبار والفعاليات، وبوابات الطبيب والمختبرات الشريكة ولوحة الإدارة.

## التقنيات

React 19 · TypeScript · Vite · Tailwind CSS · Supabase

## أوامر التطوير

```bash
npm install
npm run dev
```

## البناء للإنتاج

```bash
npm run build
npm run preview
```

يُولَّد `public/sitemap.xml` تلقائياً أثناء البناء. اضبط `SITE_URL` في `.env` إن لزم.

## متغيرات البيئة

انسخ `.env.example` إلى `.env` واملأ:

| المتغير | الوصف |
|---------|--------|
| `VITE_SUPABASE_URL` | عنوان مشروع Supabase |
| `VITE_SUPABASE_ANON_KEY` | المفتاح العام (anon) |
| `SITE_URL` | عنوان الموقع العام (للخريطة) |
| `VITE_ADMIN_PASSWORD` | اختياري — للتطوير المحلي فقط بدون Supabase |

## قاعدة البيانات

نفّذ ملفات SQL من مجلد `supabase/` في Supabase SQL Editor، بدءاً من `schema.sql` ثم migrations الإضافية حسب الحاجة.
