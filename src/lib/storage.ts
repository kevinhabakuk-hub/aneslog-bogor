import { AnesLogStoreSchema, type AnesLogStore, type Hospital, type PatientRecord } from '../types/aneslog'
import { formatDateFull } from './date'

const STORAGE_KEY = 'aneslog.store.v1'

export const DEFAULT_HOSPITALS: Hospital[] = [
  { id: 'rs-hermina-bogor', name: 'RS Hermina Bogor', shortName: 'Hermina Bogor' },
  { id: 'rs-vania-bogor', name: 'RS Vania Bogor', shortName: 'Vania Bogor' },
]

export function getInitialStore(): AnesLogStore {
  return {
    hospitals: DEFAULT_HOSPITALS,
    patients: [],
    activeHospitalId: DEFAULT_HOSPITALS[0].id,
    theme: 'clinical-bone',
  }
}

export function loadStore(): AnesLogStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getInitialStore()
    const parsed = JSON.parse(raw)
    const validated = AnesLogStoreSchema.safeParse(parsed)
    if (!validated.success) {
      return getInitialStore()
    }
    const data = validated.data
    const activeExists = data.hospitals.some((h) => h.id === data.activeHospitalId)
    return {
      ...data,
      activeHospitalId: activeExists ? data.activeHospitalId : data.hospitals[0].id,
    }
  } catch {
    return getInitialStore()
  }
}

export function saveStore(store: AnesLogStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Storage quota exceeded or restricted; fail silently without crashing UI
  }
}

export function formatComorbiditiesText(p: PatientRecord): string {
  const list = p.comorbidities.filter((c) => c !== 'Tidak Ada')
  if (p.otherComorbidity.trim()) {
    list.push(p.otherComorbidity.trim())
  }
  return list.length > 0 ? list.join(', ') : 'Tidak ada'
}

export function formatPatientForEMR(p: PatientRecord, hospitalName: string): string {
  const asa = `ASA ${p.asaClass}${p.isEmergency ? 'E' : ''}`
  const lines = [
    `[PRE-OP ANESTESI] ${hospitalName} — ${formatDateFull(p.date)}`,
    `Nama: ${p.fullName}${p.rmNumber ? ` | No. RM: ${p.rmNumber}` : ''}`,
    `Usia/BB: ${p.age || '-'} th / ${p.weightKg || '-'} kg`,
    `Dx / Tindakan: ${p.diagnosisProcedure || '-'}`,
    `Rencana Anestesi: ${p.anesthesiaPlan}`,
    `Riwayat Penyakit: ${formatComorbiditiesText(p)}`,
    `Alergi: ${p.hasAllergy ? p.allergyNote || 'Ada (lihat catatan)' : 'Tidak ada'}`,
    `Obat Rutin: ${p.medications || '-'}`,
    `Status Fisik & Airway: ${asa} | Mallampati ${p.mallampati} | Puasa: ${p.npoHours || '-'}`,
  ]
  if (p.notes.trim()) {
    lines.push(`Catatan: ${p.notes.trim()}`)
  }
  return lines.join('\n')
}

function escapeCSV(value: string): string {
  const str = String(value ?? '')
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportPatientsCSV(patients: PatientRecord[], hospitals: Hospital[]): void {
  const hospitalMap = new Map(hospitals.map((h) => [h.id, h.name]))
  const headers = [
    'Tanggal',
    'Hari_Tanggal',
    'Rumah_Sakit',
    'Nama_Pasien',
    'No_RM',
    'Usia_Th',
    'BB_Kg',
    'Diagnosis_Tindakan',
    'Rencana_Anestesi',
    'Riwayat_Penyakit',
    'Alergi',
    'Obat_Rutin',
    'ASA',
    'Mallampati',
    'Puasa_NPO',
    'Status_EMR',
    'Catatan',
  ]

  const rows = [...patients]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map((p) => [
      p.date,
      formatDateFull(p.date),
      hospitalMap.get(p.hospitalId) ?? p.hospitalId,
      p.fullName,
      p.rmNumber,
      p.age,
      p.weightKg,
      p.diagnosisProcedure,
      p.anesthesiaPlan,
      formatComorbiditiesText(p),
      p.hasAllergy ? p.allergyNote || 'Ada' : 'Tidak ada',
      p.medications,
      `ASA ${p.asaClass}${p.isEmergency ? 'E' : ''}`,
      `Mallampati ${p.mallampati}`,
      p.npoHours,
      p.emrStatus === 'done' ? 'Selesai EMR' : 'Belum EMR',
      p.notes,
    ])

  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(',')).join('\n')
  triggerDownload(csv, `aneslog-rekap-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;')
}

export function exportStoreJSON(store: AnesLogStore): void {
  const json = JSON.stringify(store, null, 2)
  triggerDownload(json, `aneslog-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
