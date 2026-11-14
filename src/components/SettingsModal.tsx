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
      <header className="flex shrink-0 items-center justify-between border-b border-base-content bg-base-200 px-4 py-3">
        <div>
          <span className="font-mono text-[10px] font-bold tracking-wider text-secondary uppercase">
            // PENGATURAN & BACKUP
          </span>
          <h2 className="text-base font-bold text-base-content">Kelola RS & Ekspor Data</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pengaturan"
          className="btn btn-sm btn-ghost h-10 w-10 border border-base-300 p-0"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          {/* Daftar RS */}
          <section className="border border-base-content bg-base-200 p-3.5">
            <span className="font-mono text-[10px] font-bold tracking-wider text-secondary uppercase">
              01 // DAFTAR RUMAH SAKIT PRAKTIK
            </span>
            <ul className="mt-2.5 flex flex-col divide-y divide-base-300 border border-base-300">
              {hospitals.map((h) => (
                <li key={h.id} className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm font-semibold">{h.name}</span>
                  {hospitals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteHospital(h.id)}
                      aria-label={`Hapus ${h.name}`}
                      className="btn btn-xs btn-ghost text-error"
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
                className="input input-sm h-10 flex-1 border-base-300 bg-base-100 text-sm"
              />
              <button
                type="submit"
                className="btn btn-sm btn-primary h-10 border border-base-content font-mono text-xs"
              >
                <Plus className="h-4 w-4" />
                Tambah
              </button>
            </form>
          </section>

          {/* Export / Backup */}
          <section className="border border-base-content bg-base-200 p-3.5">
            <span className="font-mono text-[10px] font-bold tracking-wider text-secondary uppercase">
              02 // EKSPOR & CADANGAN ({patientCount} PASIEN)
            </span>
            <p className="mt-1 text-xs text-secondary">
              Unduh rekapitulasi pasien untuk laporan jasa medis atau cadangan pribadi.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportCSV}
                disabled={patientCount === 0}
                className="btn btn-sm h-11 border border-base-content bg-base-100 font-mono text-xs uppercase"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={onExportJSON}
                className="btn btn-sm h-11 border border-base-content bg-base-100 font-mono text-xs uppercase"
              >
                <Download className="h-4 w-4" />
                Backup JSON
              </button>
            </div>
          </section>

          {/* Privacy Guarantee */}
          <section className="flex items-start gap-2.5 border border-base-300 bg-base-200 p-3.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div className="text-xs text-secondary">
              <span className="font-bold text-base-content">100% Penyimpanan Lokal (Offline-First).</span>{' '}
              Seluruh data pasien tersimpan hanya di memori browser HP Anda dan tidak pernah dikirim
              ke server eksternal mana pun.
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
