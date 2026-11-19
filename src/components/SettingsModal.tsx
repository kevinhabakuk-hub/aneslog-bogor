import { Check, Download, KeyRound, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { getSavedConsultPin, saveConsultPin } from '../lib/consultApi'
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
  const [consultPin, setConsultPin] = useState(() => getSavedConsultPin())
  const [pinSaved, setPinSaved] = useState(false)

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newHospitalName.trim()
    if (!trimmed) return
    onAddHospital(trimmed)
    setNewHospitalName('')
  }

  const handleSavePin = (e: FormEvent) => {
    e.preventDefault()
    saveConsultPin(consultPin)
    setPinSaved(true)
    setTimeout(() => setPinSaved(false), 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base-100">
      <header className="medscape-hero flex shrink-0 items-center justify-between px-4 py-3.5 shadow-sm">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-sky-200 uppercase">
            Pengaturan &amp; Keamanan
          </span>
          <h2 className="text-base font-bold text-white">RS, Backup, &amp; PIN Consult AI</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pengaturan"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-3.5">
          {/* PIN Akses Consult AI */}
          <section className="medscape-card border border-base-300 bg-base-200 p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-primary uppercase">
              <KeyRound className="h-3.5 w-3.5" />
              <span>PIN Akses Consult AI (3-Tier)</span>
            </div>
            <p className="mt-1 text-xs text-secondary">
              Harus sama dengan variabel <code className="font-mono">ANESLOG_PIN</code> di Netlify
              agar akses 9 buku &amp; Gemini API hanya bisa dipakai Bakuk.
            </p>
            <form onSubmit={handleSavePin} className="mt-3 flex gap-2">
              <input
                type="password"
                placeholder="Masukkan PIN pribadi..."
                value={consultPin}
                onChange={(e) => setConsultPin(e.target.value)}
                className="input input-sm h-10 flex-1 rounded-xl border-base-300 bg-base-100 text-sm"
              />
              <button
                type="submit"
                className="btn btn-sm btn-primary h-10 rounded-xl border-0 px-4 text-xs font-bold"
              >
                {pinSaved ? <Check className="h-4 w-4" /> : 'Simpan'}
              </button>
            </form>
          </section>

          {/* Daftar RS */}
          <section className="medscape-card border border-base-300 bg-base-200 p-4">
            <span className="text-[11px] font-bold tracking-wide text-primary uppercase">
              Daftar Rumah Sakit Praktik
            </span>
            <ul className="mt-2.5 flex flex-col divide-y divide-base-300 rounded-xl bg-base-100 px-3">
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
                className="btn btn-sm btn-primary h-10 rounded-xl border-0 px-4 text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                Tambah
              </button>
            </form>
          </section>

          {/* Export / Backup */}
          <section className="medscape-card border border-base-300 bg-base-200 p-4">
            <span className="text-[11px] font-bold tracking-wide text-primary uppercase">
              Ekspor &amp; Cadangan ({patientCount} Pasien)
            </span>
            <p className="mt-1 text-xs text-secondary">
              Unduh rekapitulasi pasien untuk laporan jasa medis atau cadangan pribadi.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportCSV}
                disabled={patientCount === 0}
                className="btn btn-sm h-11 rounded-xl border-0 bg-base-100 text-xs font-bold"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={onExportJSON}
                className="btn btn-sm h-11 rounded-xl border-0 bg-base-100 text-xs font-bold"
              >
                <Download className="h-4 w-4" />
                Backup JSON
              </button>
            </div>
          </section>

          {/* Privacy Guarantee */}
          <section className="medscape-card flex items-start gap-2.5 border border-base-300 bg-base-200 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div className="text-xs text-secondary">
              <span className="font-bold text-base-content">
                Offline-First + Auto De-Identifikasi (PHI Safe).
              </span>{' '}
              Data pasien tersimpan lokal di browser HP. Saat menggunakan Consult AI, Nama &amp; No.
              RM otomatis dihapus sebelum konteks klinis dikirim ke mesin 3-Tier.
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
