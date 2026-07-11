import type { Locale } from '../i18n/messages'

export type CategoryCard = {
  /** slug مطابق لعمود category في جدول الفحوصات — يُستخدم لفتح القسم في صفحة الفحوصات */
  slug: string
  image: string
  /** أيقونة SVG داخل الشارة الدائرية (path واحد أو أكثر) */
  icon: 'ihc' | 'oncology' | 'hereditary' | 'reproductive' | 'nipt' | 'pediatric'
  title: Record<Locale, string>
  description: Record<Locale, string>
}

export const testCategoryCards: CategoryCard[] = [
  {
    slug: 'immunohistochemistry',
    image: '/images/categories/immunohistochemistry.jpg',
    icon: 'ihc',
    title: {
      en: 'Immunohistochemistry',
      ar: 'الكيمياء المناعية النسيجية',
    },
    description: {
      en: 'IHC by VENTANA',
      ar: 'تقنية IHC من VENTANA',
    },
  },
  {
    slug: 'oncology_somatic',
    image: '/images/categories/oncology.jpg',
    icon: 'oncology',
    title: {
      en: 'Oncology',
      ar: 'الأورام',
    },
    description: {
      en: 'Advanced genetic testing to identify cancer-related mutations and guide personalized treatment decisions.',
      ar: 'فحوصات جينية متقدمة لتحديد الطفرات المرتبطة بالسرطان وتوجيه قرارات العلاج الشخصية.',
    },
  },
  {
    slug: 'hereditary_cancer',
    image: '/images/categories/hereditary-cancer.jpg',
    icon: 'hereditary',
    title: {
      en: 'Hereditary Cancer Genetics',
      ar: 'وراثة السرطان',
    },
    description: {
      en: 'Genetic risk assessment and testing to help identify inherited cancer syndromes and guide prevention.',
      ar: 'تقييم المخاطر الجينية للمساعدة في تحديد متلازمات السرطان الوراثية وتوجيه الوقاية.',
    },
  },
  {
    slug: 'reproductive',
    image: '/images/categories/reproductive.jpg',
    icon: 'reproductive',
    title: {
      en: 'Reproductive Health',
      ar: 'الصحة الإنجابية',
    },
    description: {
      en: 'Genetic insights to support family planning, fertility assessment, and reproductive wellness.',
      ar: 'رؤى جينية لدعم تنظيم الأسرة وتقييم الخصوبة والعافية الإنجابية.',
    },
  },
  {
    slug: 'nipt',
    image: '/images/categories/nipt.jpg',
    icon: 'nipt',
    title: {
      en: 'Non-Invasive Prenatal Testing (NIPT)',
      ar: 'فحص ما قبل الولادة غير التوسّعي (NIPT)',
    },
    description: {
      en: 'Non-invasive prenatal testing for early screening of chromosomal conditions with high accuracy.',
      ar: 'فحص ما قبل الولادة غير التوسّعي للكشف المبكر عن الحالات الكروموسومية بدقة عالية.',
    },
  },
  {
    slug: 'pediatric_newborn',
    image: '/images/categories/pediatric.jpg',
    icon: 'pediatric',
    title: {
      en: 'Pediatric',
      ar: 'الأطفال وحديثي الولادة',
    },
    description: {
      en: "Genetic testing for early diagnosis of inherited conditions and to support your child's health journey.",
      ar: 'فحوصات جينية للتشخيص المبكر للحالات الوراثية ودعم رحلة صحة طفلك.',
    },
  },
]
