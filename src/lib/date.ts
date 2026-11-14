const HARI_PANJANG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const
const HARI_PENDEK = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'] as const
const BULAN_PENDEK = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'] as const
const BULAN_PANJANG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

/** Returns local YYYY-MM-DD without UTC timezone shift. */
export function getTodayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns local YYYY-MM for monthly filtering. */
export function getCurrentMonthISO(): string {
  return getTodayISO().slice(0, 7)
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** Format: "SAB, 14 NOV 2026" */
export function formatDateMono(iso: string): string {
  const dt = parseISODate(iso)
  const day = HARI_PENDEK[dt.getDay()]
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = BULAN_PENDEK[dt.getMonth()]
  return `${day}, ${dd} ${mm} ${dt.getFullYear()}`
}

/** Format: "Sabtu, 14 November 2026" */
export function formatDateFull(iso: string): string {
  const dt = parseISODate(iso)
  const day = HARI_PANJANG[dt.getDay()]
  return `${day}, ${dt.getDate()} ${BULAN_PANJANG[dt.getMonth()]} ${dt.getFullYear()}`
}

/** Format: "November 2026" */
export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const monthName = BULAN_PANJANG[(m || 1) - 1] ?? ''
  return `${monthName} ${y}`
}
