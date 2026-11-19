import type { PatientRecord } from '../types/aneslog'

const PIN_STORAGE_KEY = 'aneslog_consult_pin_v1'

export interface AnonymizedPatientContext {
  age: string
  weightKg: string
  diagnosisProcedure: string
  comorbidities: string[]
  otherComorbidity: string
  hasAllergy: boolean
  allergyNote: string
  medications: string
  asaClass: string
  isEmergency: boolean
  mallampati: string
  npoHours: string
  anesthesiaPlan: string
  notes: string
}

export interface ConsultDosingItem {
  drug: string
  rule: string
  calculatedDose: string
  note: string
}

export interface ConsultTargetItem {
  label: string
  value: string
}

export interface ConsultResult {
  safetyAlert?: string
  bottomLine: string
  hemodynamicTargets: ConsultTargetItem[]
  clinicalPlan: string[]
  dosing: ConsultDosingItem[]
  pearlsAndPitfalls: string[]
  evidenceConflict?: string
  references: {
    tier1: string[]
    tier2: string[]
    tier3: string[]
  }
}

export interface ConsultResponse {
  result: ConsultResult
  meta: {
    vaultConnected: boolean
    tier1Hits: number
    tier2Hits: number
    tier3Hits: number
    weightKg: number | null
  }
}

/**
 * Strictly strips PHI (fullName, rmNumber, id, hospitalId, date)
 * before any patient data leaves the browser.
 */
export function buildAnonymizedContext(patient: PatientRecord): AnonymizedPatientContext {
  return {
    age: patient.age,
    weightKg: patient.weightKg,
    diagnosisProcedure: patient.diagnosisProcedure,
    comorbidities: patient.comorbidities,
    otherComorbidity: patient.otherComorbidity,
    hasAllergy: patient.hasAllergy,
    allergyNote: patient.allergyNote,
    medications: patient.medications,
    asaClass: patient.asaClass,
    isEmergency: patient.isEmergency,
    mallampati: patient.mallampati,
    npoHours: patient.npoHours,
    anesthesiaPlan: patient.anesthesiaPlan,
    notes: patient.notes,
  }
}

export function getSavedConsultPin(): string {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function saveConsultPin(pin: string): void {
  try {
    const trimmed = pin.trim()
    if (trimmed) {
      localStorage.setItem(PIN_STORAGE_KEY, trimmed)
    } else {
      localStorage.removeItem(PIN_STORAGE_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

export async function requestConsult3Tier(params: {
  query: string
  patient: PatientRecord | null
  focusBookSlug?: string | null
  pin?: string
}): Promise<ConsultResponse> {
  const pin = (params.pin ?? getSavedConsultPin()).trim()
  const res = await fetch('/api/consult', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pin ? { 'x-aneslog-pin': pin } : {}),
    },
    body: JSON.stringify({
      query: params.query,
      patientContext: params.patient ? buildAnonymizedContext(params.patient) : null,
      focusBookSlug: params.focusBookSlug ?? null,
    }),
  })

  const data = (await res.json().catch(() => ({}))) as Partial<ConsultResponse> & { error?: string }
  if (!res.ok || !data.result) {
    throw new Error(data.error || `Gagal memproses Consult AI (HTTP ${res.status}).`)
  }
  return data as ConsultResponse
}
