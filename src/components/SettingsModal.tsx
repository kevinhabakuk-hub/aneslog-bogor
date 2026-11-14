import { Download, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Hospital } from '../types/aneslog'

interface SettingsModalProps {
  hospitals: Hospital[]
  patientCount: number
  onClose: () => void
  onAddHospital: (name: string) => void
  onDeleteHospital: (id: string) => void
  onExportCSV: () => void
  onExportJSON: () => void
}

export function SettingsModal({
  hospitals,
  patientCount,
  onClose,
  onAddHospital,
  onDeleteHospital,
  onExportCSV,
  onExportJSON,
}: SettingsModalProps) {
  const [newHospitalName, setNewHospitalName] = useState('')

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newHospitalName.trim()
    if (!trimmed) return
    onAddHospital(trimmed)
    setNewHospitalName('')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base-100">
      <header className="flex shrink-0 items-center justify-between border-b border-base-300 bg-base-200 px-4 py-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
            Pengaturan & Backup
          </span>
          <h2 className="text-base font-bold text-base-content">Kelola RS & Ekspor Data</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pengaturan"
          className="btn btn-sm btn-ghost h-10 w-10 rounded-full bg-base-100 p-0"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-3.5">
          {/* Daftar RS */}
          <section className="oneui-card border border-base-300/60 bg-base-200 p-4">
            <span className="text-[11px] font-bold tracking-wide text-primary uppercase">
              Daftar Rumah Sakit Praktik
            </span>
            <ul className="mt-2.5 flex flex-col divide-y divide-base-300 rounded-2xl bg-base-100 px-3">
              {hospitals.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-semibold">{h.name}</span>
                  {hospitals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteHospital(h.id)}
                      aria-label={`Hapus ${h.name}`}
                      className="btn btn-xs btn-ghost rounded-full text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <form onSubmit={handleAdd} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Tambah RS baru (mis: RSUD Kota Bogor)"
                value={newHospitalName}
                onChange={(e) => setNewHospitalName(e.target.value)}
                className="input input-sm h-10 flex-1 rounded-xl border-base-300 bg-base-100 text-sm"
              />
              <button
                type="submit"
                className="btn btn-sm btn-primary h-10 rounded-full border-0 px-4 text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                Tambah
              </button>
            </form>
          </section>

          {/* Export / Backup */}
          <section className="oneui-card border border-base-300/60 bg-base-200 p-4">
            <span className="text-[11px] font-bold tracking-wide text-primary uppercase">
              Ekspor & Cadangan ({patientCount} Pasien)
            </span>
            <p className="mt-1 text-xs text-secondary">
              Unduh rekapitulasi pasien untuk laporan jasa medis atau cadangan pribadi.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportCSV}
                disabled={patientCount === 0}
                className="btn btn-sm h-11 rounded-full border-0 bg-base-100 text-xs font-bold"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={onExportJSON}
                className="btn btn-sm h-11 rounded-full border-0 bg-base-100 text-xs font-bold"
              >
                <Download className="h-4 w-4" />
                Backup JSON
              </button>
            </div>
          </section>

          {/* Privacy Guarantee */}
          <section className="oneui-card flex items-start gap-2.5 border border-base-300/60 bg-base-200 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div className="text-xs text-secondary">
              <span className="font-bold text-base-content">
                100% Penyimpanan Lokal (Offline-First).
              </span>{' '}
              Seluruh data pasien tersimpan hanya di memori browser HP Anda dan tidak pernah dikirim
              ke server eksternal mana pun.
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
