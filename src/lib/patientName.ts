export type PatientNameParts = readonly [string, string, string, string]

export function isPatientNameComplete(parts: PatientNameParts): boolean {
  return parts.every((p) => p.trim().length > 0)
}

export function buildPatientFullName(parts: PatientNameParts): string {
  return parts.map((p) => p.trim()).join(' ')
}

/** تقسيم الاسم الرباعي المخزّن إلى أربعة حقول (لنموذج التعديل) */
export function splitPatientFullName(full: string): PatientNameParts {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ['', '', '', '']
  if (parts.length === 1) return [parts[0], '', '', '']
  if (parts.length === 2) return [parts[0], parts[1], '', '']
  if (parts.length === 3) return [parts[0], parts[1], parts[2], '']
  if (parts.length === 4) return [parts[0], parts[1], parts[2], parts[3]]
  return [parts[0], parts[1], parts[2], parts.slice(3).join(' ')]
}
