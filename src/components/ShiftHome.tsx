import { AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react'
import { useState } from 'react'
import { formatDateFull } from '../lib/date'
import type { Hospital, PatientRecord } from '../types/aneslog'

interface ShiftHomeProps {
  todayISO: string
  hospitals: Hospital[]
  activeHospitalId: string
  patientsToday: PatientRecord[]
  onSelectHospital: (id: string) => void
  onOpenAdd: () => void
  onOpenPatient: (patient: PatientRecord) => void
}

export function ShiftHome({
  todayISO,
  hospitals,
  activeHospitalId,
  patientsToday,
  onSelectHospital,
  onOpenAdd,
  onOpenPatient,
}: ShiftHomeProps) {
  const [filter, setFilter] = useState<'all' | 'pending'>('all')

  const totalCount = patientsToday.length
  const pendingCount = patientsToday.filter((p) => p.emrStatus === 'pending').length
  const doneCount = patientsToday.filter((p) => p.emrStatus === 'done').length

  const visiblePatients =
    filter === 'pending' ? patientsToday.filter((p) => p.emrStatus === 'pending') : patientsToday

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) ?? hospitals[0]

  return (
    <div className="flex flex-col gap-3.5 pb-32">
      {/* Date & Hospital Pill Switcher */}
      <section aria-label="Pilih Rumah Sakit">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-secondary">{formatDateFull(todayISO)}</span>
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
            Offline Ready
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-base-300/70 p-1 sm:flex sm:flex-wrap">
          {hospitals.map((hospital) => {
            const isActive = hospital.id === activeHospitalId
            return (
              <button
                key={hospital.id}
                type="button"
                onClick={() => onSelectHospital(hospital.id)}
                className={`h-10 rounded-full px-3 text-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-base-200 text-primary shadow-sm'
                    : 'text-secondary hover:text-base-content'
                }`}
              >
                <span className="block truncate">{hospital.shortName || hospital.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* One UI Squircle Counter Card */}
      <section
        aria-label="Ringkasan Pasien Hari Ini"
        className="oneui-card grid grid-cols-3 border border-base-300/60 bg-base-200 py-3.5 text-center"
      >
        <div className="px-2">
          <div className="text-[11px] font-semibold text-secondary">Total Hari Ini</div>
          <div className="mt-1 text-2xl font-extrabold leading-none text-base-content tabular-nums">
            {totalCount}
          </div>
        </div>
        <div className="border-x border-base-300 px-2">
          <div className="text-[11px] font-semibold text-error">Belum EMR</div>
          <div className="mt-1 text-2xl font-extrabold leading-none text-error tabular-nums">
            {pendingCount}
          </div>
        </div>
        <div className="px-2">
          <div className="text-[11px] font-semibold text-success">Selesai EMR</div>
          <div className="mt-1 text-2xl font-extrabold leading-none text-success tabular-nums">
            {doneCount}
          </div>
        </div>
      </section>

      {/* Filter Pills */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`btn btn-sm h-8 rounded-full border-0 px-3.5 text-xs font-bold ${
              filter === 'all'
                ? 'bg-base-content text-base-100'
                : 'bg-base-200 text-secondary shadow-xs'
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`btn btn-sm h-8 rounded-full border-0 px-3.5 text-xs font-bold ${
              filter === 'pending'
                ? 'bg-error text-error-content'
                : 'bg-base-200 text-secondary shadow-xs'
            }`}
          >
            Belum EMR ({pendingCount})
          </button>
        </div>
      </div>

      {/* Patient List or Empty State */}
      {visiblePatients.length === 0 ? (
        <div className="oneui-card border border-base-300/60 bg-base-200 p-6 text-center">
          <p className="text-xs font-semibold text-primary">
            {activeHospital?.name}
          </p>
          <p className="mt-1.5 text-base font-bold text-base-content">
            {filter === 'pending' && totalCount > 0
              ? 'Semua pasien hari ini sudah masuk EMR'
              : 'Belum ada pasien di shift ini'}
          </p>
          <p className="mt-1 text-xs text-secondary">
            {filter === 'pending' && totalCount > 0
              ? 'Kerja bagus, Dok. Ganti filter ke Semua untuk melihat daftar lengkap.'
              : 'Tap tombol di bawah untuk mencatat pasien pre-op pertama Anda.'}
          </p>
          {!(filter === 'pending' && totalCount > 0) && (
            <button
              type="button"
              onClick={onOpenAdd}
              className="btn btn-primary mt-4 h-11 rounded-full px-6 text-xs font-bold oneui-pill-shadow"
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
              patient.asaClass === 'III' || patient.asaClass === 'IV' || patient.asaClass === 'V'
            const isDone = patient.emrStatus === 'done'

            return (
              <button
                key={patient.id}
                type="button"
                onClick={() => onOpenPatient(patient)}
                className={`oneui-card w-full border border-base-300/60 bg-base-200 p-4 text-left transition-transform active:scale-[0.99] ${
                  isDone ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-bold text-base-content">
                      {patient.fullName}
                    </h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                        isHighASA || patient.isEmergency
                          ? 'bg-error/10 text-error'
                          : 'bg-base-100 text-base-content'
                      }`}
                    >
                      ASA {patient.asaClass}
                      {patient.isEmergency ? 'E' : ''}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isDone
                          ? 'bg-success/12 text-success'
                          : 'bg-error/12 text-error'
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
                          Belum EMR
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-secondary tabular-nums">
                  <span>RM: {patient.rmNumber || '-'}</span>
                  <span>•</span>
                  <span>
                    {patient.age ? `${patient.age}th` : '-'} / {patient.weightKg ? `${patient.weightKg}kg` : '-'}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-base-content">{patient.anesthesiaPlan}</span>
                </div>

                {patient.diagnosisProcedure && (
                  <p className="mt-1.5 truncate text-sm text-base-content/85">
                    {patient.diagnosisProcedure}
                  </p>
                )}

                {patient.hasAllergy && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-error/10 px-2.5 py-0.5 text-[11px] font-bold text-error">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Alergi: {patient.allergyNote || 'Ada'}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Floating One UI Pill Primary CTA */}
      <div className="fixed right-0 bottom-16 left-0 z-20 mx-auto max-w-lg px-4 pb-3 pointer-events-none">
        <button
          type="button"
          onClick={onOpenAdd}
          className="btn btn-primary pointer-events-auto h-12 w-full rounded-full border-0 text-sm font-bold tracking-wide oneui-pill-shadow"
        >
          <Plus className="h-5 w-5" />
          Catat Pasien
        </button>
      </div>
    </div>
  )
}
