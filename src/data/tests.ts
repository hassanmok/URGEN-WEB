import type { TestRow } from '../types/database'

/** بيانات احتياطية عند عدم ربط Supabase أو فارغة الجداول */
export const fallbackTests: Omit<TestRow, 'id' | 'created_at'>[] = [
  {
    slug: 'prenatal',
    title_ar: 'التحليل الجيني قبل الولادة',
    description_ar:
      'فحص شامل للحمل يهدف إلى تقييم مخاطر الصبغيات والاضطرابات الوراثية الشائعة مع تقارير واضحة للأسرة وللفريق الطبي.',
    long_description_ar:
      'يشمل هذا الفحص تقييماً للمخاطر الوراثية خلال الحمل وفق بروتوكولات طبية محددة، مع مراعاة الخصوصية وسرعة إصدار النتائج المبدئية عند توفر العينات.',
    image_url:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80',
    sort_order: 1,
  },
  {
    slug: 'genetic-disease',
    title_ar: 'تحليل الأمراض الوراثية',
    description_ar:
      'استكشاف الطفرات المرتبطة بالأمراض الوراثية المعروفة لدعم التشخيص والمتابعة العلاجية.',
    long_description_ar:
      'يستخدم مختبرنا تقنيات متقدمة لقراءة المناطق ذات الصلة سريرياً، مع تقارير تفسيرية تساعد الطبيب المعالج على بناء خطة الرعاية.',
    image_url:
      'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=800&q=80',
    sort_order: 2,
  },
  {
    slug: 'molecular',
    title_ar: 'التحليل الجزيئي',
    description_ar:
      'تحليل على مستوى الجزيئات للجينات المستهدفة بدقة عالية وزمن تقرير محسّن.',
    long_description_ar:
      'مناسب للحالات التي تحتاج استهدافاً دقيقاً لجينات محددة، مع ضمان جودة العينات والتحكم بالخطوات التحليلية.',
    image_url:
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80',
    sort_order: 3,
  },
  {
    slug: 'compatibility',
    title_ar: 'التوافق الجيني',
    description_ar:
      'تقييم التوافق الوراثي بين الشركاء أو ضمن العائلة لدعم قرارات الأسرة المستنيرة.',
    long_description_ar:
      'يساعدكم على فهم احتمالات انتقال صفات وراثية معينة، ضمن إطار استشاري يكمّل الرأي الطبي المتخصص.',
    image_url:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    sort_order: 4,
  },
]
