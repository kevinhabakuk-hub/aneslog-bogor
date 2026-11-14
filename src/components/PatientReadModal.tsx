import { AlertTriangle, Check, CheckCircle2, Copy, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { formatDateFull } from '../lib/date'
import { formatComorbiditiesText, formatPatientForEMR } from '../lib/storage'
import type { PatientRecord } from '../types/aneslog'

interface PatientReadModalProps {
  patient: PatientRecord
  hospitalName: string
  onClose: () => void
  onEdit: () => void
  onToggleEmrStatus: () => void
  onDelete: () => void
}

export function PatientReadModal({
  patient,
  hospitalName,
  onClose,
  onEdit,
  onToggleEmrStatus,
  onDelete,
}: PatientReadModalProps) {
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isDone = patient.emrStatus === 'done'
  const isHighASA =
    patient.asaClass === 'III' || patient.asaClass === 'IV' || patient.asaClass === 'V'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatPatientForEMR(patient, hospitalName))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API unavailable
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base-100">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-base-300 bg-base-200 px-4 py-3">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
            Mode Baca EMR • {hospitalName}
          </span>
          <h2 className="truncate text-base font-bold text-base-content">{patient.fullName}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-sm h-9 rounded-full border-0 bg-base-100 px-3 text-xs font-bold"
            title="Salin format teks EMR"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit pasien"
            className="btn btn-sm h-9 w-9 rounded-full border-0 bg-base-100 p-0"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="btn btn-sm h-9 w-9 rounded-full border-0 bg-base-100 p-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* High-Contrast Scannable EMR Read View */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {/* Status Pill Banner */}
          <div
            className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-bold ${
              isDone ? 'bg-success/12 text-success' : 'bg-error/12 text-error'
            }`}
          >
            <span>{isDone ? 'Sudah Masuk EMR' : 'Belum Input EMR'}</span>
            <span className="font-mono text-[11px]">{formatDateFull(patient.date)}</span>
          </div>

          {/* Allergy Red Flag */}
          {patient.hasAllergy && (
            <div className="oneui-card flex items-start gap-2.5 border border-error/40 bg-error/10 p-3.5 text-error">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="text-[11px] font-bold uppercase">Peringatan Alergi</div>
                <div className="text-base font-bold">
                  {patient.allergyNote || 'Ada riwayat alergi'}
                </div>
              </div>
            </div>
          )}

          {/* Blok 1: Identitas */}
          <section className="oneui-card border border-base-300/60 bg-base-200 p-4">
            <div className="text-[11px] font-bold tracking-wide text-primary uppercase">
              Identitas Pasien
            </div>
            <div className="mt-1.5 text-xl font-extrabold text-base-content">
              {patient.fullName}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-base-300 pt-2.5 font-mono">
              <div>
                <div className="text-[10px] text-secondary uppercase">No. RM</div>
                <div className="text-base font-bold tabular-nums">{patient.rmNumber || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] text-secondary uppercase">Usia</div>
                <div className="text-base font-bold tabular-nums">
                  {patient.age ? `${patient.age} th` : '-'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-secondary uppercase">Berat Badan</div>
                <div className="text-base font-bold tabular-nums">
                  {patient.weightKg ? `${patient.weightKg} kg` : '-'}
                </div>
              </div>
            </div>
          </section>

          {/* Blok 2: Tindakan & Rencana Anestesi */}
          <section className="oneui-card border border-base-300/60 bg-base-200 p-4">
            <div className="text-[11px] font-bold tracking-wide text-primary uppercase">
              Diagnosis & Rencana Anestesi
            </div>
            <div className="mt-1.5 text-base font-semibold text-base-content">
              {patient.diagnosisProcedure || '-'}
            </div>
            <div className="mt-2.5 inline-block rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary">
              Teknik: {patient.anesthesiaPlan}
            </div>
          </section>

          {/* Blok 3: Anamnesis & Riwayat */}
          <section className="oneui-card border border-base-300/60 bg-base-200 p-4">
            <div className="text-[11px] font-bold tracking-wide text-primary uppercase">
              Anamnesis & Riwayat Penyakit
            </div>
            <dl className="mt-2.5 flex flex-col gap-2.5 text-sm">
              <div>
                <dt className="text-[11px] font-semibold text-secondary">Riwayat Penyakit</dt>
                <dd className="text-base font-bold text-base-content">
                  {formatComorbiditiesText(patient)}
                </dd>
              </div>
              <div className="border-t border-base-300 pt-2">
                <dt className="text-[11px] font-semibold text-secondary">Alergi</dt>
                <dd className={`text-base font-bold ${patient.hasAllergy ? 'text-error' : ''}`}>
                  {patient.hasAllergy ? patient.allergyNote || 'Ada' : 'Tidak ada'}
                </dd>
              </div>
              <div className="border-t border-base-300 pt-2">
                <dt className="text-[11px] font-semibold text-secondary">Obat Rutin</dt>
                <dd className="text-base font-medium">{patient.medications || '-'}</dd>
              </div>
            </dl>
          </section>

          {/* Blok 4: Pre-Op ASA */}
          <section className="oneui-card border border-base-300/60 bg-base-200 p-4">
            <div className="text-[11px] font-bold tracking-wide text-primary uppercase">
              Penilaian Pre-Op ASA
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 font-mono">
              <div className="rounded-2xl bg-base-100 p-2.5 text-center">
                <div className="text-[10px] text-secondary uppercase">ASA</div>
                <div
                  className={`text-lg font-bold ${
                    isHighASA || patient.isEmergency ? 'text-error' : 'text-base-content'
                  }`}
                >
                  {patient.asaClass}
                  {patient.isEmergency ? 'E' : ''}
                </div>
              </div>
              <div className="rounded-2xl bg-base-100 p-2.5 text-center">
                <div className="text-[10px] text-secondary uppercase">Mallampati</div>
                <div className="text-lg font-bold">{patient.mallampati}</div>
              </div>
              <div className="rounded-2xl bg-base-100 p-2.5 text-center">
                <div className="text-[10px] text-secondary uppercase">Puasa</div>
                <div className="truncate text-sm font-bold">{patient.npoHours || '-'}</div>
              </div>
            </div>
            {patient.notes.trim() && (
              <div className="mt-3 border-t border-base-300 pt-2.5">
                <div className="text-[11px] font-semibold text-secondary">
                  Catatan Tambahan / Lab / TTV
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-base-content">
                  {patient.notes}
                </p>
              </div>
            )}
          </section>

          {/* Delete Action */}
          <div className="pt-2">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="btn btn-sm btn-ghost w-full rounded-full text-xs font-semibold text-error"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Data Pasien Ini
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-error/10 p-3">
                <span className="text-xs font-bold text-error">Yakin hapus pasien ini?</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="btn btn-xs h-8 rounded-full border-0 bg-base-200 px-3"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="btn btn-xs btn-error h-8 rounded-full px-3 text-error-content"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Primary CTA */}
      <footer className="fixed right-0 bottom-0 left-0 z-10 border-t border-base-300 bg-base-200/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={onToggleEmrStatus}
            className={`btn h-12 w-full rounded-full border-0 text-sm font-bold ${
              isDone
                ? 'bg-base-300 text-base-content'
                : 'btn-success text-success-content shadow-md'
            }`}
          >
            {isDone ? (
              <>
                <RotateCcw className="h-4 w-4" />
                Kembalikan ke Belum EMR
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Tandai Sudah Input EMR
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  )
}
