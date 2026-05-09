import type { LabTestCatalogEntry } from '../../types/labTest'
import {
  LIMIT_GENERAL_AR,
  LIMIT_GENERAL_EN,
  PREP_STD_AR,
  PREP_STD_EN,
} from './sharedCopy'

const L = LIMIT_GENERAL_AR
const Le = LIMIT_GENERAL_EN
const P = PREP_STD_AR
const Pe = PREP_STD_EN

/** الأطفال وحديثي الولادة — من دليل المحتوى */
export const pediatricNewbornCatalog: Omit<LabTestCatalogEntry, 'sort_order'>[] = [
  {
    slug: 'karyotyping-pediatric',
    title_ar: 'تحليل الكاريوتيب التقليدي (أطفال)',
    description_ar: 'تحليل الصبغيات للكشف عن تشوهات عددية أو بنيوية كبيرة.',
    long_description_ar: 'تحليل الصبغيات للكشف عن تشوهات عددية أو بنيوية كبيرة.',
    image_url: null,
    category: 'pediatric_newborn',
    title_en: 'Conventional Karyotyping',
    description_en:
      'Chromosome analysis to detect large numerical or structural chromosomal abnormalities.',
    clinical_use_ar:
      'عقم، إجهاض متكرر، اشتباه اضطرابات صبغية، تأخر نمو، أو تشوهات خلقية.',
    clinical_use_en:
      'Patients with infertility, recurrent miscarriage, suspected chromosomal disorders, developmental delay, or congenital anomalies.',
    sample_ar: '٣ مل دم بالهيبارين',
    sample_en: '3ml Heparin Blood',
    method_ar: 'تحليل الكاريوتيب',
    method_en: 'Karyotyping',
    turnaround_ar: '30 يوماً',
    turnaround_en: '30 Days',
    price_display_ar: 'السعر القائمة: ٣٠٠٬٠٠٠ د.ع | صافي: ٢٥٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 300,000 IQD | Net price: 250,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'nbs-basic',
    title_ar: 'فحص حديثي الولادة NBS (أساسي) — ٧ أمراض',
    description_ar:
      'فحص تمهيدي لحديثي الولادة للكشف المبكر عن أمراض أيضية وميتابولية وهرمونية ووراثية مختارة.',
    long_description_ar:
      'يشمل PKU، مرضى الجلاكتوز، فرط نشاط الغدة الدرقية الخلقي، نقص البيوتينيداز، G6PD، التليف الكيسي، وفرط نشاط الكظر الخلقي CAH — وفق دليل المختبر.',
    image_url: null,
    category: 'pediatric_newborn',
    title_en: 'Newborn Screening NBS (Basic)',
    description_en:
      'Screening test for newborns to detect selected inherited metabolic, endocrine, hematologic, and genetic disorders early.',
    clinical_use_ar:
      'مواليد حديثاً، يُفضّل فحصهم مبكراً بعد الولادة لدعم التشخيص والتدخل المبكر.',
    clinical_use_en:
      'Newborn babies, ideally screened early after birth to support early diagnosis and intervention.',
    sample_ar: 'DBS (ورق ترشيح) — غرفة يوم واحد، بارد حتى ١٥ يوماً',
    sample_en: 'DBS (Filter Paper) Ambient 1 day Refrigerated 15 days',
    method_ar: 'LC-MS/MS',
    method_en: 'Mass spectrometry LC-MS/MS',
    turnaround_ar: '٨–١٥ يوماً',
    turnaround_en: '8-15 days',
    price_display_ar: 'السعر القائمة: ١٠٠٬٠٠٠ د.ع | صافي: ٧٥٬٠٠٠ د.ع',
    price_display_en: 'List price: 100,000 IQD | Net price: 75,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'nbs-expanded',
    title_ar: 'فحص حديثي الولادة NBS (موسّع) — ٧٢ فحصاً',
    description_ar:
      'فحص تمهيدي موسّع لحديثي الولادة يشمل أحماضاً أمينية وأحماضاً عضوية واضطرابات أكسدة الأحماض الدهنية إضافة إلى أمراض التخزين الليزوسومي LSD.',
    long_description_ar:
      'فحص تمهيدي موسّع لحديثي الولادة يشمل أحماضاً أمينية وأحماضاً عضوية واضطرابات أكسدة الأحماض الدهنية إضافة إلى أمراض التخزين الليزوسومي LSD.',
    image_url: null,
    category: 'pediatric_newborn',
    title_en: 'Newborn Screening NBS (Expanded)',
    description_en:
      'Screening test for newborns to detect selected inherited metabolic, endocrine, hematologic, and genetic disorders early.',
    clinical_use_ar:
      'مواليد حديثاً، يُفضّل فحصهم مبكراً بعد الولادة لدعم التشخيص والتدخل المبكر.',
    clinical_use_en:
      'Newborn babies, ideally screened early after birth to support early diagnosis and intervention.',
    sample_ar: 'DBS (ورق ترشيح) — غرفة يوم واحد، بارد حتى ١٥ يوماً',
    sample_en: 'DBS (Filter Paper) Ambient 1 day Refrigerated 15 days',
    method_ar: 'LC-MS/MS',
    method_en: 'Mass spectrometry LC-MS/MS',
    turnaround_ar: '٨–١٥ يوماً',
    turnaround_en: '8-15 days',
    price_display_ar: 'السعر القائمة: ٢٥٠٬٠٠٠ د.ع | صافي: ٢٠٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 250,000 IQD | Net price: 200,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'allergy-screen-295',
    title_ar: 'فحص الحساسية — ٢٩٥ مسبباً',
    description_ar:
      'لوحة شاملة لقياس التحسس من مصل الدم لمسببات متعددة.',
    long_description_ar:
      'لوحة شاملة لقياس التحسس من مصل الدم لمسببات متعددة.',
    image_url: null,
    category: 'pediatric_newborn',
    title_en: 'Allergy Screen (Comprehensive Panel): 295 allergens',
    description_en:
      'Comprehensive allergy screening panel measuring sensitization to multiple allergens from a serum sample.',
    clinical_use_ar:
      'أطفال أو بالغون بأعراض شبيهة بالحساسية: طفح متكرر، رينيت، أزمة، أطعمة، أو حكة مزمنة.',
    clinical_use_en:
      'Children or adults with allergy-like symptoms such as recurrent rash, rhinitis, asthma symptoms, food reactions, or chronic itching.',
    sample_ar: 'مصل',
    sample_en: 'Serum',
    method_ar: 'ImmunoCAP',
    method_en: 'ImmunoCA',
    turnaround_ar: '5 أيام',
    turnaround_en: '5 Days',
    price_display_ar: 'السعر القائمة: ٣٥٠٬٠٠٠ د.ع | صافي: ٣٠٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 350,000 IQD | Net price: 300,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'newborn-genetic-screening-246',
    title_ar: 'الفحص الجيني لحديثي الولادة (٢٤٦ جيناً — ١١٢ حالة)',
    description_ar:
      'تحليل لأمراض وراثية شائعة يشمل ٢٤٦ جيناً مرتبطة بـ ١١٢ نوعاً من الأمراض الوراثية.',
    long_description_ar:
      'تحليل لأمراض وراثية شائعة يشمل ٢٤٦ جيناً مرتبطة بـ ١١٢ نوعاً من الأمراض الوراثية.',
    image_url: null,
    category: 'pediatric_newborn',
    title_en: 'Newborn Genetic Screening (246 genes / 112 conditions)',
    description_en:
      'Analysis of common genetic diseases including 246 genes related to 112 kinds of genetic diseases.',
    clinical_use_ar:
      'مواليد حديثاً، يُفضّل فحصهم مبكراً بعد الولادة لدعم التشخيص والتدخل المبكر.',
    clinical_use_en:
      'Newborn babies, ideally screened early after birth to support early diagnosis and intervention.',
    sample_ar: '٣ مل دم EDTA',
    sample_en: '3ml EDTA Blood',
    method_ar: 'تسلسل الجيل التالي (NGS)',
    method_en: 'NGS',
    turnaround_ar: '30 يوماً',
    turnaround_en: '30 Days',
    price_display_ar: 'السعر القائمة: ١٬٣٥٠٬٠٠٠ د.ع | صافي: ١٬٠٠٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 1,350,000 IQD | Net price: 1,000,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'thalassemia-ab-pediatric',
    title_ar: 'ثلاسيميا α+β (NGS — أطفال)',
    description_ar:
      'فحص NGS لـ ٥٠٨ متغيراً للثلاسيميا ألفا وبيتا بدقة تحليلية عالية.',
    long_description_ar:
      'فحص NGS لـ ٥٠٨ متغيراً للثلاسيميا ألفا وبيتا بدقة تحليلية عالية.',
    image_url: null,
    category: 'pediatric_newborn',
    title_en: 'Thalassemia (α+β) — NGS Panel',
    description_en:
      'NGS screening for common and uncommon alpha and beta thalassemia variants with high analytical accuracy.',
    clinical_use_ar:
      'أزواج يخططون للحمل، حوامل، أطفال أو بالغون باشتباه ثلاسيميا أو فقر دم أو تاريخ عائلي.',
    clinical_use_en:
      'Couples planning pregnancy, pregnant women, children or adults with suspected thalassemia, anemia, or family history of hemoglobin disorders.',
    sample_ar: '٣ مل دم EDTA',
    sample_en: '3ml EDTA Blood',
    method_ar: 'تسلسل الجيل التالي (NGS)',
    method_en: 'NGS',
    turnaround_ar: '30 يوماً',
    turnaround_en: '30 Days',
    price_display_ar: 'السعر القائمة: ٥٠٠٬٠٠٠ د.ع | صافي: ٤٠٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 500,000 IQD | Net price: 400,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'wes-pediatric',
    title_ar: 'تسلسل الجينوم الكامل للأكسومات WES (أطفال)',
    description_ar:
      'تسلسل المناطق المشفرة لنحو ٢٠٬٠٠٠ جين للتحقيق في مرض وراثي مشتبه أو حالات معقدة.',
    long_description_ar:
      'تسلسل المناطق المشفرة لنحو ٢٠٬٠٠٠ جين للتحقيق في مرض وراثي مشتبه أو حالات معقدة.',
    image_url: null,
    category: 'pediatric_newborn',
    title_en: 'Whole-Exome Sequencing',
    description_en:
      'Sequencing of coding regions of approximately 20,000 genes to investigate suspected genetic disease or complex hereditary conditions.',
    clinical_use_ar:
      'أطفال أو بالغون بمرض وراثي مشتبه، أعراض غير مفسَّرة، تشوهات خلقية، تأخر نمو، أو حالات وراثية معقدة.',
    clinical_use_en:
      'Children or adults with suspected genetic disease, unexplained symptoms, congenital anomalies, developmental delay, or complex inherited conditions.',
    sample_ar: '٣ مل دم EDTA',
    sample_en: '3ml EDTA Blood',
    method_ar: 'تسلسل الجيل التالي (NGS)',
    method_en: 'NGS',
    turnaround_ar: '45 يوماً',
    turnaround_en: '45 Days',
    price_display_ar: 'السعر القائمة: ١٬٣٥٠٬٠٠٠ د.ع | صافي: ١٬٠٠٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 1,350,000 IQD | Net price: 1,000,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'wgs-pediatric',
    title_ar: 'تسلسل الجينوم الكامل WGS (أطفال)',
    description_ar:
      'تسلسل على مستوى الجينوم للكشف عن متغيرات في مناطق مشفرة وغير مشفرة.',
    long_description_ar:
      'تسلسل على مستوى الجينوم للكشف عن متغيرات في مناطق مشفرة وغير مشفرة.',
    image_url: null,
    category: 'pediatric_newborn',
    title_en: 'Whole Genome Sequencing',
    description_en:
      'Genome-wide sequencing to detect variants across coding and non-coding regions for broad genetic investigation.',
    clinical_use_ar:
      'أطفال أو بالغون بمرض وراثي مشتبه، أعراض غير مفسَّرة، تشوهات خلقية، تأخر نمو، أو حالات وراثية معقدة.',
    clinical_use_en:
      'Children or adults with suspected genetic disease, unexplained symptoms, congenital anomalies, developmental delay, or complex inherited conditions.',
    sample_ar: '٣ مل دم EDTA',
    sample_en: '3ml EDTA Blood',
    method_ar: 'تسلسل الجيل التالي (NGS)',
    method_en: 'NGS',
    turnaround_ar: '45 يوماً',
    turnaround_en: '45 Days',
    price_display_ar: 'السعر القائمة: ١٬٧٥٠٬٠٠٠ د.ع | صافي: ١٬٥٠٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 1,750,000 IQD | Net price: 1,500,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
]
