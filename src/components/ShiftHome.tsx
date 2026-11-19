import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useState } from 'react'
import { formatDateFull } from '../lib/date'
import type { Hospital, PatientRecord, ThemeMode } from '../types/aneslog'

interface ShiftHomeProps {
  todayISO: string
  theme: ThemeMode
  hospitals: Hospital[]
  activeHospitalId: string
  patientsToday: PatientRecord[]
  onToggleTheme: () => void
  onOpenSettings: () => void
  onSelectHospital: (id: string) => void
  onOpenAdd: () => void
  onOpenPatient: (patient: PatientRecord) => void
  onConsultPatient: (patient: PatientRecord) => void
  onOpenTab: (tab: 'consult' | 'vault' | 'rekap') => void
}

export function ShiftHome({
  todayISO,
  theme,
  hospitals,
  activeHospitalId,
  patientsToday,
  onToggleTheme,
  onOpenSettings,
  onSelectHospital,
  onOpenAdd,
  onOpenPatient,
  onConsultPatient,
  onOpenTab,
}: ShiftHomeProps) {
  const [filter, setFilter] = useState<'all' | 'pending'>('all')

  const totalCount = patientsToday.length
  const pendingCount = patientsToday.filter((p) => p.emrStatus === 'pending').length
  const doneCount = patientsToday.filter((p) => p.emrStatus === 'done').length

  const visiblePatients =
    filter === 'pending' ? patientsToday.filter((p) => p.emrStatus === 'pending') : patientsToday

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) ?? hospitals[0]

  return (
    <div className="flex flex-col pb-28">
      {/* Medscape Signature Clinical Navy Hero Header */}
      <header className="medscape-hero rounded-b-[24px] px-4 pt-4 pb-5 shadow-md">
        <div className="mx-auto max-w-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-[18px] font-extrabold leading-none tracking-tight text-white">
                  AnesLog
                </h1>
                <p className="mt-0.5 text-[11px] font-medium text-white/75">
                  Perioperative &amp; 3-Tier Reference
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Ganti mode terang/gelap"
                title={theme === 'clinical-bone' ? 'Mode OR Midnight Dark' : 'Mode Clinical Light'}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
              >
                {theme === 'clinical-bone' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Pengaturan RS, Backup, & PIN"
                title="Pengaturan RS, Backup, & PIN"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Universal Clinical Search Launcher */}
          <button
            type="button"
            onClick={() => onOpenTab('consult')}
            className="flex w-full items-center gap-2.5 rounded-xl border border-white/15 bg-white/12 px-3.5 py-2.5 text-left text-xs text-white/80 transition hover:bg-white/18"
          >
            <Search className="h-4 w-4 shrink-0 text-white/75" />
            <span className="truncate">Cari dosis, blok, 9 buku teks, atau PubMed...</span>
          </button>

          {/* Hospital Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Pilih Rumah Sakit">
            {hospitals.map((hospital) => {
              const isActive = hospital.id === activeHospitalId
              return (
                <button
                  key={hospital.id}
                  type="button"
                  onClick={() => onSelectHospital(hospital.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${
                    isActive
                      ? 'bg-white text-[#0A2540] shadow-xs'
                      : 'bg-white/12 text-white/85 hover:bg-white/20'
                  }`}
                >
                  {hospital.shortName || hospital.name}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-lg space-y-4 px-4 pt-4">
        {/* Medscape 4-Tile Quick Clinical Tools */}
        <section aria-label="Akses Cepat Klinis" className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={onOpenAdd}
            className="medscape-card flex flex-col items-center gap-1.5 border border-base-300 bg-base-200 px-1 py-3 transition hover:border-primary/40 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-base-content">Log Pasien</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTab('consult')}
            className="medscape-card flex flex-col items-center gap-1.5 border border-base-300 bg-base-200 px-1 py-3 transition hover:border-accent/40 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-base-content">Consult AI</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTab('vault')}
            className="medscape-card flex flex-col items-center gap-1.5 border border-base-300 bg-base-200 px-1 py-3 transition hover:border-warning/40 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/12 text-warning">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-base-content">9 Buku</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTab('rekap')}
            className="medscape-card flex flex-col items-center gap-1.5 border border-base-300 bg-base-200 px-1 py-3 transition hover:border-primary/40 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-base-100 text-base-content">
              <BarChart3 className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-base-content">Rekap</span>
          </button>
        </section>

        {/* Shift Summary Strip */}
        <section
          aria-label="Ringkasan Pasien Hari Ini"
          className="medscape-card grid grid-cols-3 border border-base-300 bg-base-200 py-3 text-center"
        >
          <div className="px-2">
            <div className="text-[10px] font-semibold tracking-wide text-secondary uppercase">
              Total Shift
            </div>
            <div className="mt-1 text-2xl font-extrabold leading-none text-base-content tabular-nums">
              {totalCount}
            </div>
          </div>
          <div className="border-x border-base-300 px-2">
            <div className="text-[10px] font-semibold tracking-wide text-error uppercase">
              Belum EMR
            </div>
            <div className="mt-1 text-2xl font-extrabold leading-none text-error tabular-nums">
              {pendingCount}
            </div>
          </div>
          <div className="px-2">
            <div className="text-[10px] font-semibold tracking-wide text-success uppercase">
              EMR Selesai
            </div>
            <div className="mt-1 text-2xl font-extrabold leading-none text-success tabular-nums">
              {doneCount}
            </div>
          </div>
        </section>

        {/* Shift Header + Filter Pills */}
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-base-content">
              {formatDateFull(todayISO)}
            </div>
            <div className="truncate text-[11px] text-secondary">{activeHospital?.name}</div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                filter === 'all'
                  ? 'bg-primary text-primary-content'
                  : 'border border-base-300 bg-base-200 text-secondary'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                filter === 'pending'
                  ? 'bg-error text-error-content'
                  : 'border border-base-300 bg-base-200 text-secondary'
              }`}
            >
              Pending ({pendingCount})
            </button>
          </div>
        </div>

        {/* Patient List or Empty State */}
        {visiblePatients.length === 0 ? (
          <div className="medscape-card border border-base-300 bg-base-200 p-6 text-center">
            <p className="text-xs font-bold text-primary">{activeHospital?.name}</p>
            <p className="mt-1.5 text-base font-bold text-base-content">
              {filter === 'pending' && totalCount > 0
                ? 'Semua pasien hari ini sudah masuk EMR'
                : 'Belum ada pasien di shift ini'}
            </p>
            <p className="mt-1 text-xs text-secondary">
              {filter === 'pending' && totalCount > 0
                ? 'Kerja bagus, Bakuk. Ganti filter ke Semua untuk melihat daftar lengkap.'
                : 'Tap Log Pasien di atas untuk mencatat pasien pre-op pertama.'}
            </p>
            {!(filter === 'pending' && totalCount > 0) && (
              <button
                type="button"
                onClick={onOpenAdd}
                className="btn btn-primary mt-4 h-10 rounded-xl border-0 px-5 text-xs font-bold oneui-pill-shadow"
              >
                <Plus className="h-4 w-4" />
                Catat Pasien Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {visiblePatients.map((patient) => {
              const isHighASA =
                patient.asaClass === 'III' ||
                patient.asaClass === 'IV' ||
                patient.asaClass === 'V'
              const isDone = patient.emrStatus === 'done'
              const isCritical = isHighASA || patient.isEmergency

              return (
                <div
                  key={patient.id}
                  onClick={() => onOpenPatient(patient)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onOpenPatient(patient)
                    }
                  }}
                  className={`medscape-card flex w-full cursor-pointer overflow-hidden border border-base-300 bg-base-200 text-left transition hover:border-primary/35 active:scale-[0.99] ${
                    isDone ? 'opacity-80' : ''
                  }`}
                >
                  {/* Subtle Clinical Acuity Stripe */}
                  <div
                    className={`w-1 shrink-0 ${isCritical ? 'bg-error' : 'bg-primary'}`}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1 space-y-2 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-[15px] font-bold text-base-content">
                            {patient.fullName}
                          </h3>
                          <span
                            className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                              isCritical
                                ? 'bg-error/12 text-error'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            ASA {patient.asaClass}
                            {patient.isEmergency ? 'E' : ''}
                          </span>
                        </div>
                        {patient.diagnosisProcedure && (
                          <p className="mt-0.5 truncate text-xs text-base-content/80">
                            {patient.diagnosisProcedure}
                          </p>
                        )}
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          isDone ? 'bg-success/12 text-success' : 'bg-warning/15 text-warning'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            EMR OK
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Pending
                          </>
                        )}
                      </span>
                    </div>

                    {patient.hasAllergy && (
                      <div className="inline-flex items-center gap-1 rounded-md bg-error/10 px-2 py-0.5 text-[11px] font-bold text-error">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Alergi: {patient.allergyNote || 'Ada'}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 border-t border-base-300/80 pt-2 text-[11px] tabular-nums">
                      <span className="truncate font-mono text-secondary">
                        {patient.age ? `${patient.age}th` : '-'} ·{' '}
                        {patient.weightKg ? `${patient.weightKg}kg` : '-'} · MP {patient.mallampati}{' '}
                        · <strong className="text-base-content">{patient.anesthesiaPlan}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onConsultPatient(patient)
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition hover:bg-primary/15"
                      >
                        <Sparkles className="h-3 w-3" />
                        Bedah 3-Tier
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
