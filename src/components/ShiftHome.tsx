import { AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react'
import { useState } from 'react'
import { formatDateMono } from '../lib/date'
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
    <div className="flex flex-col gap-4 pb-28">
      {/* Hospital Switcher */}
      <section aria-label="Pilih Rumah Sakit">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[11px] font-medium tracking-wider text-secondary uppercase">
            // LOKASI PRAKTIK AKTIF
          </span>
          <span className="font-mono text-[11px] text-secondary">{formatDateMono(todayISO)}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
          {hospitals.map((hospital) => {
            const isActive = hospital.id === activeHospitalId
            return (
              <button
                key={hospital.id}
                type="button"
                onClick={() => onSelectHospital(hospital.id)}
                className={`btn btn-sm h-11 justify-start border px-3 text-left font-semibold normal-case transition-none ${
                  isActive
                    ? 'border-base-content bg-primary text-primary-content hard-offset-sm'
                    : 'border-base-300 bg-base-200 text-base-content hover:border-base-content'
                }`}
              >
                <span className="truncate">{hospital.shortName || hospital.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Precision 3-Column Counter Strip */}
      <section
        aria-label="Ringkasan Pasien Hari Ini"
        className="grid grid-cols-3 border border-base-content bg-base-200"
      >
        <div className="border-r border-base-300 p-3">
          <div className="font-mono text-[10px] font-medium tracking-wider text-secondary uppercase">
            TOTAL HARI INI
          </div>
          <div className="mt-1 font-display text-3xl font-bold leading-none tabular-nums">
            {totalCount}
          </div>
        </div>
        <div className="border-r border-base-300 p-3">
          <div className="font-mono text-[10px] font-medium tracking-wider text-error uppercase">
            BELUM EMR
          </div>
          <div className="mt-1 font-display text-3xl font-bold leading-none text-error tabular-nums">
            {pendingCount}
          </div>
        </div>
        <div className="p-3">
          <div className="font-mono text-[10px] font-medium tracking-wider text-success uppercase">
            SELESAI EMR
          </div>
          <div className="mt-1 font-display text-3xl font-bold leading-none text-success tabular-nums">
            {doneCount}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="join border border-base-300 bg-base-200">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`btn btn-sm join-item h-9 border-0 font-mono text-xs ${
              filter === 'all' ? 'bg-primary text-primary-content' : 'bg-base-200 text-secondary'
            }`}
          >
            SEMUA ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`btn btn-sm join-item h-9 border-0 font-mono text-xs ${
              filter === 'pending' ? 'bg-error text-error-content' : 'bg-base-200 text-secondary'
            }`}
          >
            BELUM EMR ({pendingCount})
          </button>
        </div>
        <span className="font-mono text-[11px] text-secondary">OFFLINE-READY</span>
      </div>

      {/* Patient List or Empty State */}
      {visiblePatients.length === 0 ? (
        <div className="border border-dashed border-base-content/40 bg-base-200 p-6 text-center">
          <p className="font-mono text-xs tracking-wide text-secondary uppercase">
            [ {activeHospital?.name} • {formatDateMono(todayISO)} ]
          </p>
          <p className="mt-2 text-base font-semibold text-base-content">
            {filter === 'pending' && totalCount > 0
              ? 'Semua pasien hari ini sudah masuk EMR.'
              : 'Belum ada pasien tercatat di shift ini.'}
          </p>
          <p className="mt-1 text-sm text-secondary">
            {filter === 'pending' && totalCount > 0
              ? 'Kerja bagus, Dok. Ganti filter ke Semua untuk melihat daftar lengkap.'
              : 'Tap tombol di bawah untuk mencatat pasien pre-op pertama Anda.'}
          </p>
          {!(filter === 'pending' && totalCount > 0) && (
            <button
              type="button"
              onClick={onOpenAdd}
              className="btn btn-primary mt-4 h-11 border border-base-content font-mono text-xs tracking-wider uppercase hard-offset-sm"
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
                className={`w-full border bg-base-200 p-3.5 text-left transition-colors hover:border-base-content ${
                  isDone ? 'border-base-300 opacity-85' : 'border-base-content'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-base-content">
                      {patient.fullName}
                    </h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`badge badge-sm rounded-[2px] border font-mono text-[11px] font-bold ${
                        isHighASA || patient.isEmergency
                          ? 'border-error bg-error/10 text-error'
                          : 'border-base-content/30 bg-base-100 text-base-content'
                      }`}
                    >
                      ASA {patient.asaClass}
                      {patient.isEmergency ? 'E' : ''}
                    </span>
                    <span
                      className={`badge badge-sm gap-1 rounded-[2px] border font-mono text-[10px] font-bold uppercase ${
                        isDone
                          ? 'border-success bg-success/15 text-success'
                          : 'border-error bg-error text-error-content'
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
                          BELUM EMR
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
                  <p className="mt-1.5 truncate text-sm text-base-content/90">
                    {patient.diagnosisProcedure}
                  </p>
                )}

                {patient.hasAllergy && (
                  <div className="mt-2 inline-flex items-center gap-1 border border-error bg-error/10 px-2 py-0.5 font-mono text-[11px] font-bold text-error uppercase">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    ALERGI: {patient.allergyNote || 'ADA'}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Sticky Bottom Primary CTA */}
      <div className="fixed right-0 bottom-16 left-0 z-20 mx-auto max-w-lg px-4 pb-2 pointer-events-none">
        <button
          type="button"
          onClick={onOpenAdd}
          className="btn btn-primary pointer-events-auto h-12 w-full border border-base-content font-mono text-sm font-bold tracking-wider uppercase hard-offset"
        >
          <Plus className="h-5 w-5" />
          Catat Pasien
        </button>
      </div>
    </div>
  )
}
