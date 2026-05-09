import type { LabTestCatalogEntry } from '../types/labTest'
import { hereditaryCancerCatalog } from './catalog/hereditaryCancer'
import { niptCatalog } from './catalog/nipt'
import { oncologySomaticCatalog } from './catalog/oncologySomatic'
import { pediatricNewbornCatalog } from './catalog/pediatricNewborn'
import { reproductiveCatalog } from './catalog/reproductive'

/** ترتيب العرض: أورام/جسيمي → وراثي سرطان → إنجاب → NIPT → أطفال/مواليد */
export const labTestsCatalogEntries: LabTestCatalogEntry[] = (() => {
  const merged: Omit<LabTestCatalogEntry, 'sort_order'>[] = [
    ...oncologySomaticCatalog,
    ...hereditaryCancerCatalog,
    ...reproductiveCatalog,
    ...niptCatalog,
    ...pediatricNewbornCatalog,
  ]
  return merged.map((row, i) => ({
    ...row,
    sort_order: i + 1,
  }))
})()
