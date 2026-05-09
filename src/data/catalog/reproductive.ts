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

/** صحة الإنجاب والنساء/الرجال — من دليل المحتوى (بدون NIPT منفصل) */
export const reproductiveCatalog: Omit<LabTestCatalogEntry, 'sort_order'>[] = [
  {
    slug: 'sperm-dna-fragmentation',
    title_ar: 'تكسُّر الحمض النووي للحيوانات المنوية',
    description_ar:
      'تقييم تكسُّر DNA الحيوانات المنوية كدليل على سلامة الحمض النووي وارتباطه بتقييم العقم الذكوري.',
    long_description_ar:
      'تقييم تكسُّر DNA الحيوانات المنوية كدليل على سلامة الحمض النووي وارتباطه بتقييم العقم الذكوري.',
    image_url: null,
    category: 'reproductive',
    title_en: 'Sperm DNA Fragmentation',
    description_en:
      'Assessment of sperm DNA fragmentation, a marker of sperm DNA integrity that can be relevant in male infertility evaluation.',
    clinical_use_ar:
      'رجال يُقيَّمون للعقم، فشل IVF المتكرر، تحليل منوي غير طبيعي، أو مشاكل خصوبة غير مفسَّرة.',
    clinical_use_en:
      'Men being evaluated for infertility, recurrent IVF failure, abnormal semen analysis, or unexplained fertility problems.',
    sample_ar: 'سائل منوي',
    sample_en: 'Seminal fluid',
    method_ar: 'انتشار كروماتين الحيوانات المنوية (SCD)',
    method_en: 'Sperm Chromatin Dispersion',
    turnaround_ar: 'يوم واحد',
    turnaround_en: '1 Day',
    price_display_ar: 'السعر القائمة: ١٥٠٬٠٠٠ د.ع | صافي: ١٠٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 150,000 IQD | Net price: 100,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'karyotyping-reproductive',
    title_ar: 'تحليل الكاريوتيب التقليدي (إنجاب)',
    description_ar: 'تحليل الصبغيات للكشف عن تشوهات عددية أو بنيوية كبيرة.',
    long_description_ar: 'تحليل الصبغيات للكشف عن تشوهات عددية أو بنيوية كبيرة.',
    image_url: null,
    category: 'reproductive',
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
    slug: 'y-chromosome-microdeletions',
    title_ar: 'حذفيات مجهرية للكروموسوم Y',
    description_ar:
      'فحص PCR للحذفيات على الكروموسوم Y المرتبطة بضعف إنتاج الحيوانات المنوية والعقم الذكوري.',
    long_description_ar:
      'فحص PCR للحذفيات على الكروموسوم Y المرتبطة بضعف إنتاج الحيوانات المنوية والعقم الذكوري.',
    image_url: null,
    category: 'reproductive',
    title_en: 'Y-Chromosome microdeletions',
    description_en:
      'PCR-based testing for Y-chromosome microdeletions associated with impaired sperm production and male infertility.',
    clinical_use_ar:
      'رجال يُقيَّمون للعقم، فشل IVF المتكرر، تحليل منوي غير طبيعي، أو مشاكل خصوبة غير مفسَّرة.',
    clinical_use_en:
      'Men being evaluated for infertility, recurrent IVF failure, abnormal semen analysis, or unexplained fertility problems.',
    sample_ar: '٣ مل دم EDTA',
    sample_en: '3ml EDTA Blood',
    method_ar: 'PCR زمن حقيقي',
    method_en: 'Real Time PCR',
    turnaround_ar: '7 أيام',
    turnaround_en: '7 Days',
    price_display_ar: 'السعر القائمة: ٢٠٠٬٠٠٠ د.ع | صافي: ١٨٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 200,000 IQD | Net price: 180,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'hpv-21-genotype',
    title_ar: 'HPV — ٢١ جنساً',
    description_ar:
      'تنميط PCR زمن حقيقي لـ ٢١ نوعاً من HPV شاملاً الأنواع عالية ومنخفضة الخطورة لتقييم مخاطر عنق الرحم.',
    long_description_ar:
      'تنميط PCR زمن حقيقي لـ ٢١ نوعاً من HPV شاملاً الأنواع عالية ومنخفضة الخطورة لتقييم مخاطر عنق الرحم.',
    image_url: null,
    category: 'reproductive',
    title_en:
      'HPV 21 Genotype (16, 18, 31, 33, 35, 39, 45, 51, 52, 56, 58, 59, 68, 26, 53, 66, 70, 73, 82, 6, 11)',
    description_en:
      'Real-time PCR genotyping for 21 HPV types, including high-risk and low-risk genotypes used in cervical cancer risk assessment and follow-up.',
    clinical_use_ar:
      'نساء تحتاج تقييم مخاطر عنق الرحم ومتابعة HPV؛ يمكن للذكور بالسائل المنوي عند الحاجة السريرية.',
    clinical_use_en:
      'Women needing cervical cancer risk assessment and HPV follow-up; men may be tested when clinically indicated using seminal fluid.',
    sample_ar: 'مسحة (أنثى) | سائل منوي (ذكر)',
    sample_en: 'Swab (Female) | Seminal fluid (Male)',
    method_ar: 'PCR زمن حقيقي',
    method_en: 'Real-time PCR',
    turnaround_ar: '7 أيام',
    turnaround_en: '7 Days',
    price_display_ar: 'السعر القائمة: ١٣٠٬٠٠٠ د.ع | صافي: ٩٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 130,000 IQD | Net price: 90,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'pap-smear',
    title_ar: 'مسحة عنق الرحم (Pap)',
    description_ar:
      'فحص خلوي عنقي للكشف المبكر عن خلايا غير طبيعية وتغيّرات ما قبل السرطان.',
    long_description_ar:
      'فحص خلوي عنقي للكشف المبكر عن خلايا غير طبيعية وتغيّرات ما قبل السرطان.',
    image_url: null,
    category: 'reproductive',
    title_en: 'Pap smear',
    description_en:
      'Cervical cytology test used to screen for abnormal cervical cells and support early detection of cervical precancerous changes.',
    clinical_use_ar:
      'نساء تحتاج فحصاً عنقياً روتينياً أو متابعة لأعراض/نتائج غير طبيعية بحسب أخصائي النساء.',
    clinical_use_en:
      'Women requiring routine cervical screening or follow-up of abnormal cervical symptoms/results, as advised by a gynecologist.',
    sample_ar: 'طقم خاص',
    sample_en: 'Special kit',
    method_ar: 'علم الأنسجة / الخلويات',
    method_en: 'Histopathology',
    turnaround_ar: '7 أيام',
    turnaround_en: '7 Days',
    price_display_ar: 'السعر القائمة: ٨٠٬٠٠٠ د.ع | صافي: ٦٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 80,000 IQD | Net price: 60,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'thalassemia-ab-reproductive',
    title_ar: 'ثلاسيميا α+β (NGS — إنجاب)',
    description_ar:
      'فحص NGS لـ ٥٠٨ متغيراً شائعاً وغير شائع للثلاسيميا ألفا وبيتا بدقة تحليلية عالية (>٩٩٪ وفق دليل المختبر).',
    long_description_ar:
      'فحص NGS لـ ٥٠٨ متغيراً شائعاً وغير شائع للثلاسيميا ألفا وبيتا بدقة تحليلية عالية.',
    image_url: null,
    category: 'reproductive',
    title_en: 'Thalassemia (α+β) — NGS Panel',
    description_en:
      'NGS screening for common and uncommon alpha and beta thalassemia variants with high analytical accuracy (508 variants; >99% accuracy per lab menu).',
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
    slug: 'wes-reproductive',
    title_ar: 'تسلسل الجينوم الكامل للأكسومات WES (إنجاب)',
    description_ar:
      'تسلسل المناطق المشفرة لنحو ٢٠٬٠٠٠ جين للتحقيق في مرض وراثي مشتبه أو حالات معقدة.',
    long_description_ar:
      'تسلسل المناطق المشفرة لنحو ٢٠٬٠٠٠ جين للتحقيق في مرض وراثي مشتبه أو حالات معقدة.',
    image_url: null,
    category: 'reproductive',
    title_en: 'Whole-Exome Sequencing',
    description_en:
      'Sequencing of coding regions of approximately 20,000 genes to investigate suspected genetic disease or complex hereditary conditions. Covers exon regions and mitochondrial genome per lab menu.',
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
    slug: 'wgs-reproductive',
    title_ar: 'تسلسل الجينوم الكامل WGS (إنجاب)',
    description_ar:
      'تسلسل على مستوى الجينوم للكشف عن متغيرات في مناطق مشفرة وغير مشفرة.',
    long_description_ar:
      'تسلسل على مستوى الجينوم للكشف عن متغيرات في مناطق مشفرة وغير مشفرة.',
    image_url: null,
    category: 'reproductive',
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
  {
    slug: 'fetal-miscarriage-genetic',
    title_ar: 'التحليل الجيني لإجهاض جنيني',
    description_ar:
      'تحليل جيني لنسيج الإجهاض للمساعدة في تحديد أسباب صبغية أو وراثية لفقدان الحمل.',
    long_description_ar:
      'تحليل جيني لنسيج الإجهاض للمساعدة في تحديد أسباب صبغية أو وراثية لفقدان الحمل.',
    image_url: null,
    category: 'reproductive',
    title_en: 'Fetal Miscarriage Genetic Testing',
    description_en:
      'Genetic analysis of fetal miscarriage tissue to help identify chromosomal or genetic causes of pregnancy loss.',
    clinical_use_ar:
      'أزواج بعد فقدان حمل، خاصة الإجهاض المتكرر أو غير المفسَّر، بإشراف طبي.',
    clinical_use_en:
      'Couples after pregnancy loss, especially recurrent miscarriage or unexplained fetal loss, under physician guidance.',
    sample_ar: 'نسيج طازج أو FFPE',
    sample_en: 'Fresh Tissue or FFPE',
    method_ar: 'تسلسل الجيل التالي (NGS)',
    method_en: 'NGS',
    turnaround_ar: '30 يوماً',
    turnaround_en: '30 Days',
    price_display_ar: 'السعر القائمة: ٤٥٠٬٠٠٠ د.ع | صافي: ٤٠٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 450,000 IQD | Net price: 400,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'pgt-a-day3',
    title_ar: 'PGT-A أنوبلويدي — يوم ٣ (حتى ٦ أجنة)',
    description_ar:
      'فحص أجنة أثناء IVF لتقييم أنوبلويدي الصبغيات قبل نقل الجنين.',
    long_description_ar:
      'فحص أجنة أثناء IVF لتقييم أنوبلويدي الصبغيات قبل نقل الجنين.',
    image_url: null,
    category: 'reproductive',
    title_en: 'Preimplantation Genetic Testing-Aneuploidies Day 3 (Up to 6 embryos)',
    description_en:
      'Embryo genetic screening during IVF to evaluate chromosome aneuploidy before embryo transfer.',
    clinical_use_ar:
      'أزواج IVF يحتاجون فحص أجنة أو حالة وراثية عائلية معروفة قبل النقل.',
    clinical_use_en:
      'IVF couples who need embryo genetic screening or testing for a known familial genetic condition before transfer.',
    sample_ar: 'خزعة خلية واحدة',
    sample_en: 'Single cell Biopsied',
    method_ar: 'تسلسل الجيل التالي (NGS)',
    method_en: 'NGS',
    turnaround_ar: 'يومان',
    turnaround_en: '2 Days',
    price_display_ar: 'السعر القائمة: ٢٬٠٠٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 2,000,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'pgt-a-day5',
    title_ar: 'PGT-A أنوبلويدي — يوم ٥ (لكل جنين)',
    description_ar:
      'فحص أجنة أثناء IVF لتقييم أنوبلويدي الصبغيات قبل نقل الجنين.',
    long_description_ar:
      'فحص أجنة أثناء IVF لتقييم أنوبلويدي الصبغيات قبل نقل الجنين.',
    image_url: null,
    category: 'reproductive',
    title_en: 'Preimplantation Genetic Testing-Aneuploidies Day 5 (each one)',
    description_en:
      'Embryo genetic screening during IVF to evaluate chromosome aneuploidy before embryo transfer.',
    clinical_use_ar:
      'أزواج IVF يحتاجون فحص أجنة أو حالة وراثية عائلية معروفة قبل النقل.',
    clinical_use_en:
      'IVF couples who need embryo genetic screening or testing for a known familial genetic condition before transfer.',
    sample_ar: 'خزعة ٣–٤ خلايا',
    sample_en: '3-4 Cells Biopsied',
    method_ar: 'تسلسل الجيل التالي (NGS)',
    method_en: 'NGS',
    turnaround_ar: '١–٢ أسبوع',
    turnaround_en: '1-2 Weeks',
    price_display_ar: 'السعر القائمة: ٢٥٠٬٠٠٠ د.ع (لكل جنين)',
    price_display_en: 'List price: 250,000 IQD (each embryo)',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
  {
    slug: 'pgt-m',
    title_ar: 'PGT-M طفرات (لكل جنين)',
    description_ar: 'فحص أجنة أثناء IVF لطفرة عائلية معروفة أو مرض أحادي الجين.',
    long_description_ar:
      'فحص أجنة أثناء IVF لطفرة عائلية معروفة أو مرض أحادي الجين.',
    image_url: null,
    category: 'reproductive',
    title_en: 'Preimplantation Genetic Testing-Mutations (each one)',
    description_en:
      'Embryo testing during IVF for a known familial mutation or monogenic condition.',
    clinical_use_ar:
      'أزواج IVF يحتاجون فحص أجنة أو حالة وراثية عائلية معروفة قبل النقل.',
    clinical_use_en:
      'IVF couples who need embryo genetic screening or testing for a known familial genetic condition before transfer.',
    sample_ar: '٣ مل دم EDTA أو خزعة',
    sample_en: '3ml EDTA Blood or Biopsy',
    method_ar: 'تسلسل الجيل التالي (NGS)',
    method_en: 'NGS',
    turnaround_ar: '30 يوماً',
    turnaround_en: '30 Days',
    price_display_ar: 'السعر القائمة: ٣٥٠٬٠٠٠ د.ع',
    price_display_en: 'List price: 350,000 IQD',
    preparation_ar: P,
    preparation_en: Pe,
    limitation_note_ar: L,
    limitation_note_en: Le,
  },
]
