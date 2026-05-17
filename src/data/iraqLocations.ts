/** بيانات مواقع العراق للقوائم المتسلسلة (بلد → محافظة → منطقة). */
export type LocationOption = {
  id: string
  label_ar: string
  label_en: string
}

export const COUNTRIES: LocationOption[] = [
  { id: 'IQ', label_ar: 'العراق', label_en: 'Iraq' },
]

export const GOVERNORATES_BY_COUNTRY: Record<string, LocationOption[]> = {
  IQ: [
    { id: 'baghdad', label_ar: 'بغداد', label_en: 'Baghdad' },
    { id: 'basra', label_ar: 'البصرة', label_en: 'Basra' },
    { id: 'nineveh', label_ar: 'نينوى', label_en: 'Nineveh' },
    { id: 'erbil', label_ar: 'أربيل', label_en: 'Erbil' },
    { id: 'sulaymaniyah', label_ar: 'السليمانية', label_en: 'Sulaymaniyah' },
    { id: 'duhok', label_ar: 'دهوك', label_en: 'Duhok' },
    { id: 'kirkuk', label_ar: 'كركوك', label_en: 'Kirkuk' },
    { id: 'anbar', label_ar: 'الأنبار', label_en: 'Anbar' },
    { id: 'diyala', label_ar: 'ديالى', label_en: 'Diyala' },
    { id: 'salahuddin', label_ar: 'صلاح الدين', label_en: 'Saladin' },
    { id: 'babil', label_ar: 'بابل', label_en: 'Babil' },
    { id: 'karbala', label_ar: 'كربلاء', label_en: 'Karbala' },
    { id: 'najaf', label_ar: 'النجف', label_en: 'Najaf' },
    { id: 'qadisiyyah', label_ar: 'القادسية', label_en: 'Qadisiyyah' },
    { id: 'maysan', label_ar: 'ميسان', label_en: 'Maysan' },
    { id: 'dhi_qar', label_ar: 'ذي قار', label_en: 'Dhi Qar' },
    { id: 'muthanna', label_ar: 'المثنى', label_en: 'Muthanna' },
    { id: 'wasit', label_ar: 'واسط', label_en: 'Wasit' },
  ],
}

export const REGIONS_BY_GOVERNORATE: Record<string, LocationOption[]> = {
  /** مناطق وأحياء بغداد (تظهر بعد اختيار محافظة بغداد) */
  baghdad: [
    { id: 'abu_ghraib', label_ar: 'أبو غريب', label_en: 'Abu Ghraib' },
    { id: 'adhamiya', label_ar: 'الأعظمية', label_en: 'Adhamiya' },
    { id: 'al_ameen', label_ar: 'الأمين', label_en: 'Al-Ameen' },
    { id: 'al_allawi', label_ar: 'العلاوي', label_en: 'Al-Allawi' },
    { id: 'al_bayaa', label_ar: 'البياع', label_en: 'Al-Bayaa' },
    { id: 'al_baladiyat', label_ar: 'البلديات', label_en: 'Al-Baladiyat' },
    { id: 'al_dora', label_ar: 'الدورة', label_en: 'Al-Dora' },
    { id: 'al_ghadir', label_ar: 'الغدير', label_en: 'Al-Ghadir' },
    { id: 'al_ghazaliya', label_ar: 'الغزالية', label_en: 'Al-Ghazaliya' },
    { id: 'al_harithiya', label_ar: 'الحارثية', label_en: 'Al-Harithiya' },
    { id: 'al_hurriya', label_ar: 'الحرية', label_en: 'Al-Hurriya' },
    { id: 'al_husseiniya', label_ar: 'الحسينية', label_en: 'Al-Husseiniya' },
    { id: 'al_jadriya', label_ar: 'الجادرية', label_en: 'Al-Jadriya' },
    { id: 'al_jami_a', label_ar: 'الجامعة', label_en: 'Al-Jami’a' },
    { id: 'kadhimiya', label_ar: 'الكاظمية', label_en: 'Al-Kadhimiya' },
    { id: 'al_kamaliya', label_ar: 'الكمالية', label_en: 'Al-Kamaliya' },
    { id: 'al_karrada', label_ar: 'الكرادة', label_en: 'Al-Karrada' },
    { id: 'al_khadra', label_ar: 'الخضراء', label_en: 'Al-Khadra' },
    { id: 'al_mansour', label_ar: 'المنصور', label_en: 'Al-Mansour' },
    { id: 'al_maamoun', label_ar: 'المأمون', label_en: 'Al-Maamoun' },
    { id: 'al_nasr', label_ar: 'النصر', label_en: 'Al-Nasr' },
    { id: 'al_rashidiya', label_ar: 'الراشدية', label_en: 'Al-Rashidiya' },
    { id: 'al_salam', label_ar: 'السلام', label_en: 'Al-Salam' },
    { id: 'al_salihiya', label_ar: 'الصالحية', label_en: 'Al-Salihiya' },
    { id: 'al_saydiya', label_ar: 'السيدية', label_en: 'Al-Saydiya' },
    { id: 'al_shaab', label_ar: 'الشعب', label_en: 'Al-Shaab' },
    { id: 'al_shuala', label_ar: 'الشعلة', label_en: 'Al-Shuala' },
    { id: 'al_toubji', label_ar: 'الطوبجي', label_en: 'Al-Toubji' },
    { id: 'al_utayfiya', label_ar: 'العطيفية', label_en: 'Al-Utayfiya' },
    { id: 'al_waziriya', label_ar: 'الوزيرية', label_en: 'Al-Waziriya' },
    { id: 'al_yarmouk', label_ar: 'اليرموك', label_en: 'Al-Yarmouk' },
    { id: 'al_zaafaraniya', label_ar: 'الزعفرانية', label_en: 'Al-Zaafaraniya' },
    { id: 'al_ameriya', label_ar: 'العامرية', label_en: 'Al-Ameriya' },
    { id: 'al_adl', label_ar: 'العدل', label_en: 'Al-Adl' },
    { id: 'bab_al_muadham', label_ar: 'باب المعظم', label_en: 'Bab Al-Muadham' },
    { id: 'hurriyah_ur', label_ar: 'حي أور', label_en: 'Ur District' },
    { id: 'karkh', label_ar: 'الكرخ (عام)', label_en: 'Karkh (general)' },
    { id: 'karrada_inner', label_ar: 'الكرادة الداخلية', label_en: 'Inner Karrada' },
    { id: 'nahrawan', label_ar: 'النهروان', label_en: 'Nahrawan' },
    { id: 'rusafa', label_ar: 'الرصافة (عام)', label_en: 'Rusafa (general)' },
    { id: 'sabaa_abkar', label_ar: 'سبع أبكار', label_en: 'Sabaa Abkar' },
    { id: 'sadr_city', label_ar: 'مدينة الصدر', label_en: 'Sadr City' },
    { id: 'al_senak', label_ar: 'السنك', label_en: 'Al-Senak' },
    { id: 'taji', label_ar: 'التاجي', label_en: 'Taji' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  basra: [
    { id: 'basra_center', label_ar: 'مركز البصرة', label_en: 'Basra Center' },
    { id: 'zubair', label_ar: 'الزبير', label_en: 'Zubair' },
    { id: 'abu_al_khaseeb', label_ar: 'أبو الخصيب', label_en: 'Abu Al-Khaseeb' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  nineveh: [
    { id: 'mosul', label_ar: 'الموصل', label_en: 'Mosul' },
    { id: 'tel_afar', label_ar: 'تلعفر', label_en: 'Tel Afar' },
    { id: 'sinjar', label_ar: 'سنجار', label_en: 'Sinjar' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  erbil: [
    { id: 'erbil_center', label_ar: 'مركز أربيل', label_en: 'Erbil Center' },
    { id: 'shaqlawa', label_ar: 'شقلاوة', label_en: 'Shaqlawa' },
    { id: 'soran', label_ar: 'سوران', label_en: 'Soran' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  sulaymaniyah: [
    { id: 'suli_center', label_ar: 'مركز السليمانية', label_en: 'Sulaymaniyah Center' },
    { id: 'halabja', label_ar: 'حلبجة', label_en: 'Halabja' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  duhok: [
    { id: 'duhok_center', label_ar: 'مركز دهوك', label_en: 'Duhok Center' },
    { id: 'zaxo', label_ar: 'زاخو', label_en: 'Zakho' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  kirkuk: [
    { id: 'kirkuk_center', label_ar: 'مركز كركوك', label_en: 'Kirkuk Center' },
    { id: 'hawija', label_ar: 'الحويجة', label_en: 'Hawija' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  anbar: [
    { id: 'ramadi', label_ar: 'الرمادي', label_en: 'Ramadi' },
    { id: 'fallujah', label_ar: 'الفلوجة', label_en: 'Fallujah' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  diyala: [
    { id: 'baqubah', label_ar: 'بعقوبة', label_en: 'Baqubah' },
    { id: 'khanaqin', label_ar: 'خانقين', label_en: 'Khanaqin' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  salahuddin: [
    { id: 'tikrit', label_ar: 'تكريت', label_en: 'Tikrit' },
    { id: 'samarra', label_ar: 'سامراء', label_en: 'Samarra' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  babil: [
    { id: 'hillah', label_ar: 'الحلة', label_en: 'Hillah' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  karbala: [
    { id: 'karbala_center', label_ar: 'مركز كربلاء', label_en: 'Karbala Center' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  najaf: [
    { id: 'najaf_center', label_ar: 'مركز النجف', label_en: 'Najaf Center' },
    { id: 'kufa', label_ar: 'الكوفة', label_en: 'Kufa' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  qadisiyyah: [
    { id: 'diwaniyah', label_ar: 'الديوانية', label_en: 'Diwaniyah' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  maysan: [
    { id: 'amarah', label_ar: 'العمارة', label_en: 'Amarah' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  dhi_qar: [
    { id: 'nasiriyah', label_ar: 'الناصرية', label_en: 'Nasiriyah' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  muthanna: [
    { id: 'samawah', label_ar: 'السماوة', label_en: 'Samawah' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
  wasit: [
    { id: 'kut', label_ar: 'الكوت', label_en: 'Kut' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' },
  ],
}

export function locationLabel(
  options: LocationOption[],
  id: string | null | undefined,
  locale: 'ar' | 'en',
): string {
  if (!id) return '—'
  const hit = options.find((o) => o.id === id)
  if (hit) return locale === 'ar' ? hit.label_ar : hit.label_en
  return id
}

export function governorateLabel(id: string | null | undefined, locale: 'ar' | 'en'): string {
  return locationLabel(GOVERNORATES_BY_COUNTRY.IQ ?? [], id, locale)
}

export function regionLabel(governorateId: string | null | undefined, regionId: string | null | undefined, locale: 'ar' | 'en'): string {
  if (!governorateId) return '—'
  return locationLabel(REGIONS_BY_GOVERNORATE[governorateId] ?? [], regionId, locale)
}
