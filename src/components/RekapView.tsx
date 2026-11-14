import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatDateFull, formatMonthLabel, getCurrentMonthISO } from '../lib/date'
import type { Hospital, PatientRecord } from '../types/aneslog'

interface RekapViewProps {
  hospitals: Hospital[]
  patients: PatientRecord[]
  onOpenPatient: (patient: PatientRecord) => void
}

interface DailyGroup {
  key: string
  date: string
  hospitalId: string
  hospitalName: string
  items: PatientRecord[]
  pendingCount: number
}

export function RekapView({ hospitals, patients, onOpenPatient }: RekapViewProps) {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthISO())
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const hospitalMap = useMemo(() => new Map(hospitals.map((h) => [h.id, h.name])), [hospitals])

  const availableMonths = useMemo(() => {
    const months = new Set<string>([getCurrentMonthISO()])
    for (const p of patients) {
      months.add(p.date.slice(0, 7))
    }
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [patients])

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchMonth = selectedMonth === 'all' || p.date.startsWith(selectedMonth)
      const matchHospital = selectedHospitalId === 'all' || p.hospitalId === selectedHospitalId
      return matchMonth && matchHospital
    })
  }, [patients, selectedMonth, selectedHospitalId])

  const hospitalBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const h of hospitals) counts.set(h.id, 0)
    for (const p of filteredPatients) {
      counts.set(p.hospitalId, (counts.get(p.hospitalId) ?? 0) + 1)
    }
    return counts
  }, [hospitals, filteredPatients])

  const dailyGroups = useMemo<DailyGroup[]>(() => {
    const map = new Map<string, DailyGroup>()
    const sorted = [...filteredPatients].sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    )

    for (const p of sorted) {
      const key = `${p.date}__${p.hospitalId}`
      const existing = map.get(key)
      if (existing) {
        existing.items.push(p)
        if (p.emrStatus === 'pending') existing.pendingCount += 1
      } else {
        map.set(key, {
          key,
          date: p.date,
          hospitalId: p.hospitalId,
          hospitalName: hospitalMap.get(p.hospitalId) ?? p.hospitalId,
          items: [p],
          pendingCount: p.emrStatus === 'pending' ? 1 : 0,
        })
      }
    }
    return Array.from(map.values())
  }, [filteredPatients, hospitalMap])

  return (
    <div className="flex flex-col gap-3.5 pb-24">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold tracking-wide text-secondary uppercase">
          Rekap & Logbook
        </span>
        <span className="rounded-full bg-base-200 px-2.5 py-0.5 font-mono text-[11px] font-bold text-base-content shadow-xs">
          {filteredPatients.length} Pasien
        </span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Filter Rumah Sakit"
          value={selectedHospitalId}
          onChange={(e) => setSelectedHospitalId(e.target.value)}
          className="select select-sm h-10 w-full rounded-xl border-base-300 bg-base-200 font-semibold shadow-xs"
        >
          <option value="all">Semua RS</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter Bulan"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="select select-sm h-10 w-full rounded-xl border-base-300 bg-base-200 text-xs font-semibold shadow-xs"
        >
          {availableMonths.map((ym) => (
            <option key={ym} value={ym}>
              {formatMonthLabel(ym)}
            </option>
          ))}
          <option value="all">Semua Waktu</option>
        </select>
      </div>

      {/* Monthly Breakdown Card */}
      <section className="oneui-card border border-base-300/60 bg-base-200 p-4">
        <div className="flex items-baseline justify-between border-b border-base-300 pb-2.5">
          <span className="text-xs font-semibold text-secondary">Total Periode Ini</span>
          <span className="text-3xl font-extrabold leading-none text-primary tabular-nums">
            {filteredPatients.length}
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {hospitals.map((h) => (
            <div key={h.id} className="flex items-center gap-1.5">
              <span className="text-secondary">{h.shortName || h.name}:</span>
              <span className="font-mono font-bold text-base-content tabular-nums">
                {hospitalBreakdown.get(h.id) ?? 0}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Grouped List */}
      {dailyGroups.length === 0 ? (
        <div className="oneui-card border border-base-300/60 bg-base-200 p-6 text-center">
          <p className="text-sm font-bold text-base-content">
            Belum ada data pasien pada filter ini.
          </p>
          <p className="mt-1 text-xs text-secondary">
            Setiap pasien yang Anda catat di tab Hari Ini akan otomatis direkap berdasarkan tanggal,
            hari, dan rumah sakit di sini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {dailyGroups.map((group) => {
            const isExpanded = expandedKey === group.key
            return (
              <div
                key={group.key}
                className="oneui-card overflow-hidden border border-base-300/60 bg-base-200"
              >
                <button
                  type="button"
                  onClick={() => setExpandedKey(isExpanded ? null : group.key)}
                  className="flex w-full items-center justify-between gap-2 p-3.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-base-content">
                      {formatDateFull(group.date)}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-medium text-secondary">
                      {group.hospitalName}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {group.pendingCount > 0 && (
                      <span className="rounded-full bg-error/12 px-2 py-0.5 text-[10px] font-bold text-error">
                        {group.pendingCount} Belum EMR
                      </span>
                    )}
                    <span className="rounded-full bg-base-100 px-2.5 py-1 font-mono text-xs font-bold tabular-nums">
                      {group.items.length} Pasien
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-secondary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-secondary" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-base-300 bg-base-100/50">
                    {group.items.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onOpenPatient(p)}
                        className="flex w-full items-center justify-between gap-2 border-b border-base-300/70 px-4 py-3 text-left last:border-b-0 hover:bg-base-200"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold">{p.fullName}</div>
                          <div className="truncate font-mono text-[11px] text-secondary">
                            RM: {p.rmNumber || '-'} • ASA {p.asaClass}
                            {p.isEmergency ? 'E' : ''} • {p.anesthesiaPlan}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.emrStatus === 'done'
                              ? 'bg-success/12 text-success'
                              : 'bg-error/12 text-error'
                          }`}
                        >
                          {p.emrStatus === 'done' ? 'EMR OK' : 'Belum EMR'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
