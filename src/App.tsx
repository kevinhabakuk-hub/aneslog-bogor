import { BarChart3, BookOpen, ClipboardList, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BookVaultView } from './components/BookVaultView'
import { ConsultView } from './components/ConsultView'
import { PatientFormModal } from './components/PatientFormModal'
import { PatientReadModal } from './components/PatientReadModal'
import { RekapView } from './components/RekapView'
import { SettingsModal } from './components/SettingsModal'
import { ShiftHome } from './components/ShiftHome'
import { getTodayISO } from './lib/date'
import { exportPatientsCSV, exportStoreJSON, loadStore, saveStore } from './lib/storage'
import type { AnesLogStore, PatientRecord } from './types/aneslog'

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type MainTab = 'today' | 'consult' | 'vault' | 'rekap'

export function App() {
  const [store, setStore] = useState<AnesLogStore>(() => loadStore())
  const [activeTab, setActiveTab] = useState<MainTab>('today')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null)
  const [readingPatientId, setReadingPatientId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Consult AI context handoff
  const [consultPatientId, setConsultPatientId] = useState<string | null>(null)
  const [consultInitialQuery, setConsultInitialQuery] = useState<string>('')
  const [focusBook, setFocusBook] = useState<{ slug: string; title: string } | null>(null)

  const todayISO = getTodayISO()

  useEffect(() => {
    saveStore(store)
  }, [store])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', store.theme)
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', store.theme === 'or-dark' ? '#080E17' : '#0A2540')
    }
  }, [store.theme])

  const hospitalMap = useMemo(
    () => new Map(store.hospitals.map((h) => [h.id, h.name])),
    [store.hospitals]
  )

  const patientsToday = useMemo(() => {
    return store.patients
      .filter((p) => p.date === todayISO && p.hospitalId === store.activeHospitalId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [store.patients, todayISO, store.activeHospitalId])

  const readingPatient = useMemo(
    () => store.patients.find((p) => p.id === readingPatientId) ?? null,
    [store.patients, readingPatientId]
  )

  const consultPatient = useMemo(
    () => store.patients.find((p) => p.id === consultPatientId) ?? null,
    [store.patients, consultPatientId]
  )

  const handleToggleTheme = () => {
    setStore((prev) => ({
      ...prev,
      theme: prev.theme === 'clinical-bone' ? 'or-dark' : 'clinical-bone',
    }))
  }

  const handleSelectHospital = (hospitalId: string) => {
    setStore((prev) => ({ ...prev, activeHospitalId: hospitalId }))
  }

  const handleSavePatient = (
    data: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt' | 'emrStatus'>
  ) => {
    const now = new Date().toISOString()
    if (editingPatient) {
      setStore((prev) => ({
        ...prev,
        activeHospitalId: data.hospitalId,
        patients: prev.patients.map((p) =>
          p.id === editingPatient.id ? { ...p, ...data, updatedAt: now } : p
        ),
      }))
      setEditingPatient(null)
      setFormOpen(false)
      return
    }

    const created: PatientRecord = {
      ...data,
      id: generateId(),
      emrStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    setStore((prev) => ({
      ...prev,
      activeHospitalId: data.hospitalId,
      patients: [created, ...prev.patients],
    }))
    setFormOpen(false)
  }

  const handleToggleEmrStatus = (patientId: string) => {
    const now = new Date().toISOString()
    setStore((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === patientId
          ? { ...p, emrStatus: p.emrStatus === 'done' ? 'pending' : 'done', updatedAt: now }
          : p
      ),
    }))
  }

  const handleDeletePatient = (patientId: string) => {
    setStore((prev) => ({
      ...prev,
      patients: prev.patients.filter((p) => p.id !== patientId),
    }))
    setReadingPatientId(null)
    if (consultPatientId === patientId) {
      setConsultPatientId(null)
    }
  }

  const handleAddHospital = (name: string) => {
    const id = `rs-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now().toString(36).slice(-4)}`
    const shortName = name.replace(/^RS\s+/i, '').trim() || name
    setStore((prev) => ({
      ...prev,
      hospitals: [...prev.hospitals, { id, name, shortName }],
    }))
  }

  const handleDeleteHospital = (id: string) => {
    setStore((prev) => {
      if (prev.hospitals.length <= 1) return prev
      const nextHospitals = prev.hospitals.filter((h) => h.id !== id)
      return {
        ...prev,
        hospitals: nextHospitals,
        activeHospitalId:
          prev.activeHospitalId === id ? nextHospitals[0].id : prev.activeHospitalId,
      }
    })
  }

  const handleConsultPatient = (patient: PatientRecord) => {
    setConsultPatientId(patient.id)
    setReadingPatientId(null)
    setActiveTab('consult')
  }

  const handleConsultBookTopic = (bookSlug: string, bookTitle: string, prompt: string) => {
    setFocusBook({ slug: bookSlug, title: bookTitle })
    setConsultInitialQuery(prompt)
    setActiveTab('consult')
  }

  return (
    <div className="min-h-dvh bg-base-100 text-base-content">
      {/* Active Screen */}
      <main>
        {activeTab === 'today' && (
          <ShiftHome
            todayISO={todayISO}
            theme={store.theme}
            hospitals={store.hospitals}
            activeHospitalId={store.activeHospitalId}
            patientsToday={patientsToday}
            onToggleTheme={handleToggleTheme}
            onOpenSettings={() => setSettingsOpen(true)}
            onSelectHospital={handleSelectHospital}
            onOpenAdd={() => {
              setEditingPatient(null)
              setFormOpen(true)
            }}
            onOpenPatient={(p) => setReadingPatientId(p.id)}
            onConsultPatient={handleConsultPatient}
            onOpenTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'consult' && (
          <ConsultView
            selectedPatient={consultPatient}
            patientsToday={patientsToday}
            query={consultInitialQuery}
            focusBookSlug={focusBook?.slug ?? null}
            focusBookTitle={focusBook?.title ?? null}
            onQueryChange={setConsultInitialQuery}
            onSelectPatient={(p) => setConsultPatientId(p?.id ?? null)}
            onClearFocusBook={() => setFocusBook(null)}
          />
        )}

        {activeTab === 'vault' && (
          <BookVaultView onConsultBookTopic={handleConsultBookTopic} />
        )}

        {activeTab === 'rekap' && (
          <RekapView
            hospitals={store.hospitals}
            patients={store.patients}
            onOpenPatient={(p) => setReadingPatientId(p.id)}
          />
        )}
      </main>

      {/* Medscape 4-Tab Bottom Navigation */}
      <nav
        aria-label="Navigasi Utama"
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-base-300 bg-base-200/95 backdrop-blur-lg"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-1.5 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] transition ${
              activeTab === 'today'
                ? 'font-bold text-primary'
                : 'font-medium text-secondary hover:text-base-content'
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="mt-0.5">Hari Ini</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consult')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] transition ${
              activeTab === 'consult'
                ? 'font-bold text-primary'
                : 'font-medium text-secondary hover:text-base-content'
            }`}
          >
            <Sparkles className="h-5 w-5" />
            <span className="mt-0.5">Consult AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] transition ${
              activeTab === 'vault'
                ? 'font-bold text-primary'
                : 'font-medium text-secondary hover:text-base-content'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="mt-0.5">Buku (9)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rekap')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] transition ${
              activeTab === 'rekap'
                ? 'font-bold text-primary'
                : 'font-medium text-secondary hover:text-base-content'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="mt-0.5">Rekap</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {formOpen && (
        <PatientFormModal
          hospitals={store.hospitals}
          defaultHospitalId={store.activeHospitalId}
          defaultDate={todayISO}
          initialPatient={editingPatient}
          onClose={() => {
            setFormOpen(false)
            setEditingPatient(null)
          }}
          onSave={handleSavePatient}
        />
      )}

      {readingPatient && (
        <PatientReadModal
          patient={readingPatient}
          hospitalName={hospitalMap.get(readingPatient.hospitalId) ?? readingPatient.hospitalId}
          onClose={() => setReadingPatientId(null)}
          onEdit={() => {
            setEditingPatient(readingPatient)
            setReadingPatientId(null)
            setFormOpen(true)
          }}
          onConsult={() => handleConsultPatient(readingPatient)}
          onToggleEmrStatus={() => handleToggleEmrStatus(readingPatient.id)}
          onDelete={() => handleDeletePatient(readingPatient.id)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          hospitals={store.hospitals}
          patientCount={store.patients.length}
          onClose={() => setSettingsOpen(false)}
          onAddHospital={handleAddHospital}
          onDeleteHospital={handleDeleteHospital}
          onExportCSV={() => exportPatientsCSV(store.patients, store.hospitals)}
          onExportJSON={() => exportStoreJSON(store)}
        />
      )}
    </div>
  )
}

export default App
