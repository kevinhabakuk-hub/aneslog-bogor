import {
  AlertTriangle,
  BookOpen,
  KeyRound,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  X,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  getSavedConsultPin,
  requestConsult3Tier,
  saveConsultPin,
  type ConsultResponse,
} from '../lib/consultApi'
import type { PatientRecord } from '../types/aneslog'

interface ConsultViewProps {
  selectedPatient: PatientRecord | null
  patientsToday: PatientRecord[]
  query: string
  focusBookSlug?: string | null
  focusBookTitle?: string | null
  onQueryChange: (next: string) => void
  onSelectPatient: (patient: PatientRecord | null) => void
  onClearFocusBook: () => void
}

const QUICK_PROMPTS = [
  'Buatkan rencana anestesi perioperatif lengkap, dosis obat, dan pitfalls',
  'Evaluasi antikoagulan / kelayakan blok neuraksial vs GA + PNB',
  'Strategi manajemen airway & induksi hemodinamik stabil',
  'Protokol krisis LAST (Intralipid) & batas dosis anestesi lokal',
]

export function ConsultView({
  selectedPatient,
  patientsToday,
  query,
  focusBookSlug,
  focusBookTitle,
  onQueryChange,
  onSelectPatient,
  onClearFocusBook,
}: ConsultViewProps) {
  const [subTab, setSubTab] = useState<'summary' | 'dosing' | 'pearls' | 'refs'>('summary')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<ConsultResponse | null>(null)
  const [pinInput, setPinInput] = useState(() => getSavedConsultPin())
  const [needsPinPrompt, setNeedsPinPrompt] = useState(false)

  const runConsult = async (promptText: string, overridePin?: string) => {
    const cleanPrompt = promptText.trim()
    if (!cleanPrompt && !selectedPatient) return

    setLoading(true)
    setError(null)
    setNeedsPinPrompt(false)
    try {
      const data = await requestConsult3Tier({
        query: cleanPrompt,
        patient: selectedPatient,
        focusBookSlug,
        pin: overridePin ?? pinInput,
      })
      setResponse(data)
      setSubTab('summary')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi Consult AI.'
      setError(msg)
      if (msg.toLowerCase().includes('pin')) {
        setNeedsPinPrompt(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void runConsult(query)
  }

  const handleSavePinAndRetry = (e: FormEvent) => {
    e.preventDefault()
    saveConsultPin(pinInput)
    setNeedsPinPrompt(false)
    void runConsult(query, pinInput)
  }

  const weightLabel = selectedPatient?.weightKg
    ? `${selectedPatient.weightKg} kg`
    : response?.meta.weightKg
      ? `${response.meta.weightKg} kg`
      : null

  return (
    <div className="flex flex-col pb-24">
      {/* Compact Clinical Navy Reference Header */}
      <div className="medscape-hero px-4 pt-4 pb-4 shadow-sm">
        <div className="mx-auto max-w-lg space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-300" />
                <h1 className="text-base font-bold tracking-tight">Consult AI · 3-Tier Engine</h1>
              </div>
              <p className="mt-0.5 text-[11px] text-white/75">
                9 Buku Kanonikal · Live PubMed · Clinical Guidelines
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-teal-400/20 px-2.5 py-1 text-[10px] font-bold text-teal-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              PHI Safe
            </span>
          </div>

          {/* Anonymized Patient Context Banner */}
          {selectedPatient ? (
            <div className="flex items-start justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[11px] leading-snug text-white/90">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-teal-200">
                  <UserRoundCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>Konteks Anonim Aktif (Nama &amp; RM Dihapus)</span>
                </div>
                <p className="mt-0.5 truncate text-white/90">
                  {selectedPatient.age ? `${selectedPatient.age} th` : '-'} ·{' '}
                  {selectedPatient.weightKg ? `${selectedPatient.weightKg} kg` : '-'} · ASA{' '}
                  {selectedPatient.asaClass}
                  {selectedPatient.isEmergency ? 'E' : ''} · {selectedPatient.anesthesiaPlan}
                  {selectedPatient.diagnosisProcedure
                    ? ` · ${selectedPatient.diagnosisProcedure}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectPatient(null)}
                aria-label="Hapus konteks pasien"
                className="rounded-full p-1 text-white/70 hover:bg-white/15 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : patientsToday.length > 0 ? (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="shrink-0 text-[10px] font-semibold text-white/65">
                Pasien Hari Ini:
              </span>
              {patientsToday.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPatient(p)}
                  className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90 hover:bg-white/20"
                >
                  ASA {p.asaClass}
                  {p.isEmergency ? 'E' : ''} · {p.anesthesiaPlan} ({p.weightKg || '?'}kg)
                </button>
              ))}
            </div>
          ) : null}

          {focusBookTitle && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-sky-300/25 bg-sky-400/15 px-3 py-1.5 text-[11px] text-sky-100">
              <span className="flex items-center gap-1.5 truncate">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                Fokus Buku: <strong>{focusBookTitle}</strong>
              </span>
              <button
                type="button"
                onClick={onClearFocusBook}
                className="rounded-full p-0.5 hover:bg-white/15"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Consult Body */}
      <div className="mx-auto w-full max-w-lg space-y-3.5 px-4 pt-4">
        {/* Prompt Input Card */}
        <form
          onSubmit={handleSubmit}
          className="medscape-card flex items-center gap-2 border border-base-300 bg-base-200 p-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={
              selectedPatient
                ? 'Tanya rencana anestesi, dosis, atau kontraindikasi blok...'
                : 'Tanya topik klinis, dosis obat, blok, atau guideline...'
            }
            className="flex-1 bg-transparent px-2 text-xs text-base-content outline-none placeholder:text-secondary"
          />
          <button
            type="submit"
            disabled={loading || (!query.trim() && !selectedPatient)}
            className="btn btn-primary btn-sm h-9 rounded-xl border-0 px-3.5 text-xs font-bold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>

        {/* Quick Prompt Chips */}
        {!response && !loading && (
          <div className="space-y-2">
            <div className="px-0.5 text-[11px] font-bold tracking-wider text-secondary uppercase">
              Akses Cepat Konsultan
            </div>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => {
                    onQueryChange(qp)
                    void runConsult(qp)
                  }}
                  className="medscape-card flex items-center justify-between gap-2 border border-base-300 bg-base-200 px-3.5 py-2.5 text-left text-xs font-semibold text-base-content transition hover:border-primary/40"
                >
                  <span>{qp}</span>
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inline PIN Unlock Form if 401 */}
        {needsPinPrompt && (
          <form
            onSubmit={handleSavePinAndRetry}
            className="medscape-card space-y-2.5 border border-warning/40 bg-warning/10 p-3.5"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-warning">
              <KeyRound className="h-4 w-4" />
              <span>Masukkan PIN Akses Consult AI</span>
            </div>
            <p className="text-[11px] text-base-content/80">
              PIN disimpan lokal di browser HP Anda agar akses 9 buku &amp; Gemini API tetap privat.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN..."
                className="input input-sm h-9 flex-1 rounded-xl border-base-300 bg-base-200 text-xs"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm h-9 rounded-xl border-0 px-4 text-xs font-bold"
              >
                Simpan &amp; Lanjut
              </button>
            </div>
          </form>
        )}

        {/* Error Banner */}
        {error && !needsPinPrompt && (
          <div className="medscape-card flex items-start gap-2.5 border border-error/30 bg-error/10 p-3.5 text-xs text-error">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <div className="font-bold">Consult AI Belum Tersambung</div>
              <p className="text-base-content/80">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="medscape-card space-y-3 border border-base-300 bg-base-200 p-5 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-base-content">
                Memverifikasi 3-Tier Evidence Engine...
              </div>
              <p className="text-[11px] text-secondary">
                Menyisir 9 Buku Kanonikal · Query Live PubMed · Grounding Guidelines
              </p>
            </div>
          </div>
        )}

        {/* Medscape Monograph Result View */}
        {response && !loading && (
          <div className="space-y-3">
            {/* 3-Tier Telemetry Strip */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
              <div className="rounded-xl border border-base-300 bg-base-200 py-1.5 text-base-content">
                Tier 1 · {response.meta.tier1Hits} Kutipan Buku
              </div>
              <div className="rounded-xl border border-base-300 bg-base-200 py-1.5 text-base-content">
                Tier 2 · {response.meta.tier2Hits} PubMed
              </div>
              <div className="rounded-xl border border-base-300 bg-base-200 py-1.5 text-base-content">
                Tier 3 · {response.meta.tier3Hits} Web/Guide
              </div>
            </div>

            {/* Monograph Sub-Tabs */}
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-base-300/60 p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSubTab('summary')}
                className={`rounded-lg py-1.5 transition ${
                  subTab === 'summary' ? 'bg-base-200 text-primary shadow-xs' : 'text-secondary'
                }`}
              >
                Ringkasan
              </button>
              <button
                type="button"
                onClick={() => setSubTab('dosing')}
                className={`rounded-lg py-1.5 transition ${
                  subTab === 'dosing' ? 'bg-base-200 text-primary shadow-xs' : 'text-secondary'
                }`}
              >
                Dosis{weightLabel ? ` (${weightLabel})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setSubTab('pearls')}
                className={`rounded-lg py-1.5 transition ${
                  subTab === 'pearls' ? 'bg-base-200 text-primary shadow-xs' : 'text-secondary'
                }`}
              >
                Pitfalls
              </button>
              <button
                type="button"
                onClick={() => setSubTab('refs')}
                className={`rounded-lg py-1.5 transition ${
                  subTab === 'refs' ? 'bg-base-200 text-primary shadow-xs' : 'text-secondary'
                }`}
              >
                Sitasi
              </button>
            </div>

            {/* Sub-Tab Panel */}
            <div className="medscape-card border border-base-300 bg-base-200 p-4 text-xs leading-relaxed">
              {subTab === 'summary' && (
                <div className="space-y-3.5">
                  {response.result.safetyAlert && response.result.safetyAlert.trim() && (
                    <div className="rounded-xl border border-error/30 bg-error/10 p-3">
                      <div className="text-[10px] font-bold tracking-wider text-error uppercase">
                        Critical Safety Alert
                      </div>
                      <p className="mt-1 font-semibold text-base-content">
                        {response.result.safetyAlert}
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
                      Direct Clinical Answer · Bottom Line
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] text-base-content">
                      {response.result.bottomLine}
                    </p>
                  </div>

                  {response.result.hemodynamicTargets?.length > 0 && (
                    <div className="rounded-xl bg-base-100 p-3">
                      <div className="text-[10px] font-bold tracking-wider text-secondary uppercase">
                        Target Hemodinamik &amp; Ventilasi
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 tabular-nums">
                        {response.result.hemodynamicTargets.map((t, idx) => (
                          <div key={idx}>
                            <span className="block text-[10px] text-secondary">{t.label}</span>
                            <strong className="text-xs text-base-content">{t.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {response.result.clinicalPlan?.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold tracking-wider text-secondary uppercase">
                        Langkah Tata Laksana
                      </div>
                      <ol className="mt-1.5 list-decimal space-y-1.5 pl-4 text-base-content/90">
                        {response.result.clinicalPlan.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {response.result.evidenceConflict && response.result.evidenceConflict.trim() && (
                    <div className="rounded-xl border border-warning/30 bg-warning/10 p-3">
                      <div className="text-[10px] font-bold tracking-wider text-warning uppercase">
                        Evidence Shift (Textbook vs Latest Guideline)
                      </div>
                      <p className="mt-1 text-base-content/90">
                        {response.result.evidenceConflict}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {subTab === 'dosing' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-base-content">
                      Rekomendasi Dosis Presisi
                    </span>
                    {weightLabel && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary tabular-nums">
                        BB: {weightLabel}
                      </span>
                    )}
                  </div>
                  {response.result.dosing?.length > 0 ? (
                    response.result.dosing.map((d, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-xl bg-base-100 p-3"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-base-content">{d.drug}</div>
                          <div className="text-[11px] text-secondary">
                            {d.rule}
                            {d.note ? ` · ${d.note}` : ''}
                          </div>
                        </div>
                        <div className="shrink-0 text-right font-mono text-xs font-bold text-primary tabular-nums">
                          {d.calculatedDose}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-secondary">
                      Tidak ada kalkulasi dosis spesifik untuk pertanyaan ini.
                    </p>
                  )}
                </div>
              )}

              {subTab === 'pearls' && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-base-content">
                    Clinical Pearls &amp; Lethal Pitfalls
                  </div>
                  {response.result.pearlsAndPitfalls?.length > 0 ? (
                    <ul className="space-y-2">
                      {response.result.pearlsAndPitfalls.map((item, idx) => (
                        <li
                          key={idx}
                          className="rounded-xl bg-base-100 p-3 text-xs text-base-content/90"
                        >
                          • {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-secondary">Tidak ada catatan pitfalls tambahan.</p>
                  )}
                </div>
              )}

              {subTab === 'refs' && (
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-secondary uppercase">
                      Tier 1 · Local Textbook Vault (9 Buku)
                    </div>
                    {response.result.references.tier1.length > 0 ? (
                      <ul className="mt-1.5 space-y-1.5">
                        {response.result.references.tier1.map((r, i) => (
                          <li key={i} className="rounded-lg bg-base-100 p-2 text-[11px] text-primary">
                            {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[11px] text-secondary">
                        {response.meta.vaultConnected
                          ? 'Tidak ada kutipan halaman spesifik.'
                          : 'GITHUB_VAULT_TOKEN belum dipasang di Netlify Env.'}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-secondary uppercase">
                      Tier 2 · PubMed / PMC Live
                    </div>
                    {response.result.references.tier2.length > 0 ? (
                      <ul className="mt-1.5 space-y-1.5">
                        {response.result.references.tier2.map((r, i) => (
                          <li key={i} className="rounded-lg bg-base-100 p-2 text-[11px] text-base-content">
                            {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[11px] text-secondary">Tidak ada artikel PubMed.</p>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-secondary uppercase">
                      Tier 3 · Live Clinical Guidelines
                    </div>
                    {response.result.references.tier3.length > 0 ? (
                      <ul className="mt-1.5 space-y-1.5">
                        {response.result.references.tier3.map((r, i) => (
                          <li
                            key={i}
                            className="break-words rounded-lg bg-base-100 p-2 text-[11px] text-base-content"
                          >
                            {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[11px] text-secondary">
                        Tidak ada tautan guideline tambahan.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
