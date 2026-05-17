export type PatientNameParts = readonly [string, string, string, string]

export function isPatientNameComplete(parts: PatientNameParts): boolean {
  return parts.every((p) => p.trim().length > 0)
}

export function buildPatientFullName(parts: PatientNameParts): string {
  return parts.map((p) => p.trim()).join(' ')
}
