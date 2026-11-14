import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  ANESTHESIA_PLANS,
  ASA_OPTIONS,
  COMORBIDITY_OPTIONS,
  MALLAMPATI_OPTIONS,
  type ASAClass,
  type AnesthesiaPlan,
  type Hospital,
  type MallampatiClass,
  type PatientRecord,
} from '../types/aneslog'

interface PatientFormModalProps {
  hospitals: Hospital[]
  defaultHospitalId: string
  defaultDate: string
  initialPatient?: PatientRecord | null
  onClose: () => void
  onSave: (data: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt' | 'emrStatus'>) => void
}

export function PatientFormModal({
  hospitals,
  defaultHospitalId,
  defaultDate,
  initialPatient,
  onClose,
  onSave,
}: PatientFormModalProps) {
  const [hospitalId, setHospitalId] = useState(initialPatient?.hospitalId ?? defaultHospitalId)
  const [date, setDate] = useState(initialPatient?.date ?? defaultDate)
  const [fullName, setFullName] = useState(initialPatient?.fullName ?? '')
  const [rmNumber, setRmNumber] = useState(initialPatient?.rmNumber ?? '')
  const [age, setAge] = useState(initialPatient?.age ?? '')
  const [weightKg, setWeightKg] = useState(initialPatient?.weightKg ?? '')
  const [diagnosisProcedure, setDiagnosisProcedure] = useState(
    initialPatient?.diagnosisProcedure ?? ''
  )
  const [comorbidities, setComorbidities] = useState<string[]>(
    initialPatient?.comorbidities ?? ['Tidak Ada']
  )
  const [otherComorbidity, setOtherComorbidity] = useState(initialPatient?.otherComorbidity ?? '')
  const [hasAllergy, setHasAllergy] = useState(initialPatient?.hasAllergy ?? false)
  const [allergyNote, setAllergyNote] = useState(initialPatient?.allergyNote ?? '')
  const [medications, setMedications] = useState(initialPatient?.medications ?? '')
  const [asaClass, setAsaClass] = useState<ASAClass>(initialPatient?.asaClass ?? 'II')
  const [isEmergency, setIsEmergency] = useState(initialPatient?.isEmergency ?? false)
  const [mallampati, setMallampati] = useState<MallampatiClass>(initialPatient?.mallampati ?? 'I')
  const [npoHours, setNpoHours] = useState(initialPatient?.npoHours ?? '')
  const [anesthesiaPlan, setAnesthesiaPlan] = useState<AnesthesiaPlan>(
    initialPatient?.anesthesiaPlan ?? 'GA'
  )
  const [notes, setNotes] = useState(initialPatient?.notes ?? '')
  const [nameError, setNameError] = useState(false)

  const toggleComorbidity = (item: string) => {
    if (item === 'Tidak Ada') {
      setComorbidities(['Tidak Ada'])
      return
    }
    setComorbidities((prev) => {
      const withoutNone = prev.filter((c) => c !== 'Tidak Ada')
      const exists = withoutNone.includes(item)
      const next = exists ? withoutNone.filter((c) => c !== item) : [...withoutNone, item]
      return next.length === 0 ? ['Tidak Ada'] : next
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setNameError(true)
      return
    }
    onSave({
      hospitalId,
      date,
      fullName: fullName.trim(),
      rmNumber: rmNumber.trim(),
      age: age.trim(),
      weightKg: weightKg.trim(),
      diagnosisProcedure: diagnosisProcedure.trim(),
      comorbidities,
      otherComorbidity: otherComorbidity.trim(),
      hasAllergy,
      allergyNote: hasAllergy ? allergyNote.trim() : '',
      medications: medications.trim(),
      asaClass,
      isEmergency,
      mallampati,
      npoHours: npoHours.trim(),
      anesthesiaPlan,
      notes: notes.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base-100">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-base-content bg-base-200 px-4 py-3">
        <div>
          <span className="font-mono text-[10px] font-bold tracking-wider text-secondary uppercase">
            // PRE-OP ASA COMPACT
          </span>
          <h2 className="text-base font-bold text-base-content">
            {initialPatient ? 'Edit Data Pasien' : 'Catat Pasien Baru'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup form"
          className="btn btn-sm btn-ghost h-10 w-10 border border-base-300 p-0"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Scrollable Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          {/* RS & Tanggal */}
          <div className="grid grid-cols-2 gap-2 border border-base-300 bg-base-200 p-3">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-bold text-secondary uppercase">
                Rumah Sakit
              </span>
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="select select-sm h-10 w-full border-base-300 bg-base-100 font-medium"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-bold text-secondary uppercase">
                Tanggal
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input input-sm h-10 w-full border-base-300 bg-base-100 font-mono text-xs"
              />
            </label>
          </div>

          {/* Identitas */}
          <div className="flex flex-col gap-3 border border-base-300 bg-base-200 p-3">
            <span className="font-mono text-[10px] font-bold tracking-wider text-secondary uppercase">
              01 // IDENTITAS & ANTROPOMETRI
            </span>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold">
                Nama Lengkap <span className="text-error">*</span>
              </span>
              <input
                type="text"
                placeholder="Contoh: Tn. Budi Santoso"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (nameError) setNameError(false)
                }}
                className={`input h-11 w-full bg-base-100 text-base ${
                  nameError ? 'border-error focus:border-error' : 'border-base-300'
                }`}
                autoFocus
              />
              {nameError && (
                <span className="font-mono text-[11px] text-error">
                  Nama/inisial pasien wajib diisi.
                </span>
              )}
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-1 flex flex-col gap-1">
                <span className="text-xs font-semibold">No. RM</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={rmNumber}
                  onChange={(e) => setRmNumber(e.target.value)}
                  className="input h-10 w-full border-base-300 bg-base-100 font-mono text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold">Usia (th)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="45"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="input h-10 w-full border-base-300 bg-base-100 font-mono text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold">BB (kg)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="65"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="input h-10 w-full border-base-300 bg-base-100 font-mono text-sm"
                />
              </label>
            </div>
          </div>

          {/* Diagnosis & Rencana */}
          <div className="flex flex-col gap-3 border border-base-300 bg-base-200 p-3">
            <span className="font-mono text-[10px] font-bold tracking-wider text-secondary uppercase">
              02 // DIAGNOSIS, TINDAKAN & ANESTESI
            </span>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold">Diagnosis & Rencana Operasi</span>
              <input
                type="text"
                placeholder="Contoh: Kolelitiasis • Lap. Kolesistektomi"
                value={diagnosisProcedure}
                onChange={(e) => setDiagnosisProcedure(e.target.value)}
                className="input h-11 w-full border-base-300 bg-base-100 text-sm"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-xs font-semibold">Rencana Teknik Anestesi</span>
              <div className="flex flex-wrap gap-1.5">
                {ANESTHESIA_PLANS.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setAnesthesiaPlan(plan)}
                    className={`btn btn-sm h-9 border font-mono text-xs ${
                      anesthesiaPlan === plan
                        ? 'border-base-content bg-primary text-primary-content'
                        : 'border-base-300 bg-base-100 text-base-content'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Riwayat Penyakit & Alergi */}
          <div className="flex flex-col gap-3 border border-base-300 bg-base-200 p-3">
            <span className="font-mono text-[10px] font-bold tracking-wider text-secondary uppercase">
              03 // ANAMNESIS, RIWAYAT PENYAKIT & ALERGI
            </span>

            <div>
              <span className="mb-1.5 block text-xs font-semibold">
                Riwayat Penyakit / Komorbid (Tap cepat)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMORBIDITY_OPTIONS.map((item) => {
                  const selected = comorbidities.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleComorbidity(item)}
                      className={`btn btn-sm h-9 border text-xs ${
                        selected
                          ? 'border-base-content bg-primary text-primary-content'
                          : 'border-base-300 bg-base-100 text-base-content'
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
              <input
                type="text"
                placeholder="Riwayat lain / operasi sebelumnya (opsional)"
                value={otherComorbidity}
                onChange={(e) => setOtherComorbidity(e.target.value)}
                className="input input-sm mt-2 h-10 w-full border-base-300 bg-base-100 text-xs"
              />
            </div>

            <div className="border-t border-base-300 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Alergi Obat / Makanan</span>
                <div className="join border border-base-300">
                  <button
                    type="button"
                    onClick={() => setHasAllergy(false)}
                    className={`btn btn-xs join-item h-8 px-3 font-mono ${
                      !hasAllergy ? 'bg-primary text-primary-content' : 'bg-base-100'
                    }`}
                  >
                    TIDAK ADA
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasAllergy(true)}
                    className={`btn btn-xs join-item h-8 px-3 font-mono ${
                      hasAllergy ? 'bg-error text-error-content' : 'bg-base-100'
                    }`}
                  >
                    ADA ALERGI
                  </button>
                </div>
              </div>
              {hasAllergy && (
                <input
                  type="text"
                  placeholder="Sebutkan alergen (mis: Penisilin, NSAID, Lateks)"
                  value={allergyNote}
                  onChange={(e) => setAllergyNote(e.target.value)}
                  className="input mt-2 h-10 w-full border-error bg-error/5 text-sm"
                />
              )}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold">Obat Rutin Saat Ini (opsional)</span>
              <input
                type="text"
                placeholder="Contoh: Amlodipine 10mg, Metformin, Clopidogrel"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className="input input-sm h-10 w-full border-base-300 bg-base-100 text-xs"
              />
            </label>
          </div>

          {/* Standar Pre-Op ASA */}
          <div className="flex flex-col gap-3 border border-base-300 bg-base-200 p-3">
            <span className="font-mono text-[10px] font-bold tracking-wider text-secondary uppercase">
              04 // STATUS FISIK ASA, AIRWAY & PUASA
            </span>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold">Kelas ASA</span>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="checkbox checkbox-xs checkbox-error rounded-[2px]"
                  />
                  <span className="font-mono text-xs font-bold text-error">+ E (Emergensi)</span>
                </label>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ASA_OPTIONS.map((asa) => (
                  <button
                    key={asa}
                    type="button"
                    onClick={() => setAsaClass(asa)}
                    className={`btn h-10 border font-mono text-sm font-bold ${
                      asaClass === asa
                        ? asa === 'III' || asa === 'IV' || asa === 'V'
                          ? 'border-error bg-error text-error-content'
                          : 'border-base-content bg-primary text-primary-content'
                        : 'border-base-300 bg-base-100 text-base-content'
                    }`}
                  >
                    {asa}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-1.5 block text-xs font-semibold">Mallampati</span>
                <div className="grid grid-cols-4 gap-1">
                  {MALLAMPATI_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMallampati(m)}
                      className={`btn btn-sm h-10 border font-mono text-xs font-bold ${
                        mallampati === m
                          ? 'border-base-content bg-primary text-primary-content'
                          : 'border-base-300 bg-base-100 text-base-content'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col justify-end gap-1">
                <span className="text-xs font-semibold">Puasa / NPO</span>
                <input
                  type="text"
                  placeholder="Contoh: 6 jam / 02.00"
                  value={npoHours}
                  onChange={(e) => setNpoHours(e.target.value)}
                  className="input h-10 w-full border-base-300 bg-base-100 font-mono text-xs"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold">Catatan Tambahan / Lab / TTV (opsional)</span>
              <textarea
                rows={2}
                placeholder="Hb 12.4, TD 130/80, gigi goyang, dll."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="textarea w-full border-base-300 bg-base-100 text-sm"
              />
            </label>
          </div>
        </div>
      </form>

      {/* Sticky Submit Footer */}
      <footer className="fixed right-0 bottom-0 left-0 z-10 border-t border-base-content bg-base-200 px-4 py-3">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary h-12 w-full border border-base-content font-mono text-sm font-bold tracking-wider uppercase hard-offset"
          >
            {initialPatient ? 'Simpan Perubahan' : 'Simpan Pasien (Status: Belum EMR)'}
          </button>
        </div>
      </footer>
    </div>
  )
}
