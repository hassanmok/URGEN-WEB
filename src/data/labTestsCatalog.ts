import type { LabTestCatalogEntry } from '../types/labTest'
import { hereditaryCancerCatalog } from './catalog/hereditaryCancer'
import { immunohistochemistryCatalog } from './catalog/immunohistochemistry'
import { niptCatalog } from './catalog/nipt'
import { oncologySomaticCatalog } from './catalog/oncologySomatic'
import { pediatricNewbornCatalog } from './catalog/pediatricNewborn'
import { reproductiveCatalog } from './catalog/reproductive'

/** ترتيب العرض كما في قائمة URGEN: IHC → أورام → وراثي → إنجاب → NIPT → أطفال */
export const labTestsCatalogEntries: LabTestCatalogEntry[] = (() => {
  const merged: Omit<LabTestCatalogEntry, 'sort_order'>[] = [
    ...immunohistochemistryCatalog,
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
