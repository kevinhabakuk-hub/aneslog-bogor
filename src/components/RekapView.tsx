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

  const planBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of filteredPatients) {
      counts.set(p.anesthesiaPlan, (counts.get(p.anesthesiaPlan) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [filteredPatients])

  const emrDonePct = useMemo(() => {
    if (filteredPatients.length === 0) return 0
    const done = filteredPatients.filter((p) => p.emrStatus === 'done').length
    return Math.round((done / filteredPatients.length) * 100)
  }, [filteredPatients])

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
    <div className="flex flex-col pb-24">
      {/* Clinical Navy Header */}
      <div className="medscape-hero px-4 pt-4 pb-4 shadow-sm">
        <div className="mx-auto max-w-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold tracking-tight">Rekap &amp; Analitik Shift</h1>
              <p className="mt-0.5 text-[11px] text-white/75">
                Logbook Perioperatif per Tanggal &amp; Rumah Sakit
              </p>
            </div>
            <span className="rounded-lg bg-white/15 px-2.5 py-1 font-mono text-[11px] font-bold text-white tabular-nums">
              {filteredPatients.length} Kasus
            </span>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Filter Rumah Sakit"
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="select select-sm h-9 w-full rounded-xl border-white/20 bg-white/12 text-xs font-semibold text-white"
            >
              <option value="all" className="text-base-content">
                Semua RS
              </option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id} className="text-base-content">
                  {h.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Bulan"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="select select-sm h-9 w-full rounded-xl border-white/20 bg-white/12 text-xs font-semibold text-white"
            >
              {availableMonths.map((ym) => (
                <option key={ym} value={ym} className="text-base-content">
                  {formatMonthLabel(ym)}
                </option>
              ))}
              <option value="all" className="text-base-content">
                Semua Waktu
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-lg space-y-3.5 px-4 pt-4">
        {/* KPI Pair */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="medscape-card border border-base-300 bg-base-200 p-3.5">
            <div className="text-[11px] font-semibold text-secondary">Total Periode Ini</div>
            <div className="mt-1 text-3xl font-extrabold leading-none text-primary tabular-nums">
              {filteredPatients.length}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-secondary">
              {hospitals.map((h) => (
                <span key={h.id}>
                  {h.shortName || h.name}:{' '}
                  <strong className="font-mono text-base-content tabular-nums">
                    {hospitalBreakdown.get(h.id) ?? 0}
                  </strong>
                </span>
              ))}
            </div>
          </div>

          <div className="medscape-card border border-base-300 bg-base-200 p-3.5">
            <div className="text-[11px] font-semibold text-secondary">Kelengkapan EMR</div>
            <div className="mt-1 text-3xl font-extrabold leading-none text-success tabular-nums">
              {emrDonePct}%
            </div>
            <div className="mt-1.5 text-[11px] text-secondary tabular-nums">
              {filteredPatients.filter((p) => p.emrStatus === 'pending').length} kasus belum EMR
            </div>
          </div>
        </div>

        {/* Technique Breakdown */}
        {planBreakdown.length > 0 && (
          <section className="medscape-card space-y-2.5 border border-base-300 bg-base-200 p-4">
            <div className="text-xs font-bold text-base-content">Distribusi Teknik Anestesi</div>
            {planBreakdown.map(([plan, count]) => {
              const pct = Math.round((count / filteredPatients.length) * 100)
              return (
                <div key={plan} className="space-y-1">
                  <div className="flex justify-between text-[11px] tabular-nums">
                    <span className="font-semibold text-base-content">{plan}</span>
                    <span className="text-secondary">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-base-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* Daily Grouped List */}
        {dailyGroups.length === 0 ? (
          <div className="medscape-card border border-base-300 bg-base-200 p-6 text-center">
            <p className="text-sm font-bold text-base-content">
              Belum ada data pasien pada filter ini.
            </p>
            <p className="mt-1 text-xs text-secondary">
              Setiap pasien yang dicatat di tab Hari Ini akan otomatis direkap berdasarkan tanggal
              dan rumah sakit di sini.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {dailyGroups.map((group) => {
              const isExpanded = expandedKey === group.key
              return (
                <div
                  key={group.key}
                  className="medscape-card overflow-hidden border border-base-300 bg-base-200"
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
                        <span className="rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                          {group.pendingCount} Pending
                        </span>
                      )}
                      <span className="rounded-md bg-base-100 px-2.5 py-1 font-mono text-xs font-bold tabular-nums">
                        {group.items.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-secondary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-secondary" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-base-300 bg-base-100/60">
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
                              RM: {p.rmNumber || '-'} · ASA {p.asaClass}
                              {p.isEmergency ? 'E' : ''} · {p.anesthesiaPlan}
                            </div>
                          </div>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              p.emrStatus === 'done'
                                ? 'bg-success/12 text-success'
                                : 'bg-warning/15 text-warning'
                            }`}
                          >
                            {p.emrStatus === 'done' ? 'EMR OK' : 'Pending'}
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
    </div>
  )
}
