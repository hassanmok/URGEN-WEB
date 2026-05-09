import type { LabTestCatalogEntry } from '../types/labTest'
import { labTestsCatalogEntries } from './labTestsCatalog'

/** بيانات احتياطية عند عدم ربط Supabase أو عند كون جدول الفحوصات فارغاً — قائمة المختبر الكاملة */
export const fallbackTests: LabTestCatalogEntry[] = labTestsCatalogEntries
