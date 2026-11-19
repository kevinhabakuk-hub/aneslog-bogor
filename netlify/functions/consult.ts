import { BOOKS_CATALOG, type BookChapter, type BookEntry } from '../../src/data/booksCatalog'

interface AnonymizedPatientContext {
  age?: string
  weightKg?: string
  diagnosisProcedure?: string
  comorbidities?: string[]
  otherComorbidity?: string
  hasAllergy?: boolean
  allergyNote?: string
  medications?: string
  asaClass?: string
  isEmergency?: boolean
  mallampati?: string
  npoHours?: string
  anesthesiaPlan?: string
  notes?: string
}

interface ConsultRequestBody {
  query?: string
  patientContext?: AnonymizedPatientContext | null
  focusBookSlug?: string | null
}

interface Tier1Excerpt {
  bookTitle: string
  edition: string
  chapterTitle: string
  page: string
  snippet: string
}

interface Tier2Article {
  pmid: string
  title: string
  authors: string
  journal: string
  year: string
}

const CATALOG = BOOKS_CATALOG

const DOMAIN_HINTS: Array<{ keywords: RegExp; bookHint: string }> = [
  { keywords: /\b(obstetri|sectio|caesarea|sc|preeklam|peb|eklam|partus|hamil|maternal|uterotoni|oxytocin|mgso4|spinal ob)\b/i, bookHint: 'chestnut' },
  { keywords: /\b(pediatri|anak|neonat|bayi|tonsil|laryngospasm|caudal|croup|osa anak)\b/i, bookHint: 'gregory' },
  { keywords: /\b(blok|block|regional|peng|ficb|tap|esp|brachial|interscalene|supraclavicular|popliteal|sciatic|femoral|last|intralipid|lipid emulsion|ropivacaine|bupivacaine|anticoagulan|rivaroxaban|clopidogrel|warfarin|asra|epidural|spinal)\b/i, bookHint: 'hadzic' },
  { keywords: /\b(neuro|craniotomi|icp|tik|stroke|subarachnoid|aneurysm|spine|cervical|mannitol|hypertonic|tbi|cedera kepala)\b/i, bookHint: 'cottrell' },
  { keywords: /\b(cardiac|jantung|cabg|valve|katup|aorta|stenosis|ef |heart failure|cpb|tee|pacemaker|icd|af |atrial fibrillation|coronary)\b/i, bookHint: 'kaplan' },
  { keywords: /\b(noncardiac|perioperative cardiac|rcri|mets|stent|dapt)\b/i, bookHint: 'cardiac_anesthesia_for_noncardiac' },
  { keywords: /\b(farmakologi|pharmacology|dosis|mac|context-sensitive|propofol|etomidate|ketamine|sevoflurane|desflurane|rocuronium|sugammadex|fentanyl|remifentanil|dexmedetomidine|norepinephrine|phenylephrine|ephedrine)\b/i, bookHint: 'stoelting' },
]

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3)
    )
  )
}

function selectTopChapters(searchText: string, focusBookSlug?: string | null, limit = 3): Array<{ book: BookEntry; chapter: BookChapter }> {
  const tokens = tokenize(searchText)
  const boostedSlugs = new Set<string>()
  if (focusBookSlug) boostedSlugs.add(focusBookSlug)

  for (const hint of DOMAIN_HINTS) {
    if (hint.keywords.test(searchText)) {
      boostedSlugs.add(hint.bookHint)
    }
  }

  const scored: Array<{ score: number; book: BookEntry; chapter: BookChapter }> = []
  for (const book of CATALOG) {
    let bookBoost = 0
    if (focusBookSlug && book.slug === focusBookSlug) bookBoost += 12
    for (const hint of boostedSlugs) {
      if (book.slug.includes(hint)) bookBoost += 5
    }
    if (book.slug.includes('miller')) bookBoost += 2

    for (const chapter of book.chapters) {
      const hay = `${book.title} ${book.tag} ${chapter.title}`.toLowerCase()
      let score = bookBoost
      for (const tok of tokens) {
        if (hay.includes(tok)) score += 4
      }
      if (chapter.title.toLowerCase().includes('index') || chapter.title.toLowerCase().includes('front matter')) {
        score -= 10
      }
      if (score > 0) {
        scored.push({ score, book, chapter })
      }
    }
  }

  scored.sort((a, b) => b.score - a.score)
  const picked: Array<{ book: BookEntry; chapter: BookChapter }> = []
  const seenBooks = new Map<string, number>()

  for (const item of scored) {
    const count = seenBooks.get(item.book.slug) ?? 0
    if (count >= 2 && !focusBookSlug) continue
    picked.push({ book: item.book, chapter: item.chapter })
    seenBooks.set(item.book.slug, count + 1)
    if (picked.length >= limit) break
  }
  return picked
}

function extractBestSnippetsFromMarkdown(md: string, tokens: string[], maxSnippets = 2): Array<{ page: string; snippet: string }> {
  const pages = md.split(/<!--\s*page:\s*(\d+)[^>]*-->/)
  // pages array: [preamble, pageNum1, text1, pageNum2, text2, ...]
  const scoredPages: Array<{ score: number; page: string; snippet: string }> = []

  for (let i = 1; i < pages.length; i += 2) {
    const pageNum = pages[i]
    const body = (pages[i + 1] || '').trim()
    if (!body) continue
    const lower = body.toLowerCase()
    let score = 0
    for (const tok of tokens) {
      if (lower.includes(tok)) score += 1
    }
    if (score > 0) {
      scoredPages.push({
        score,
        page: pageNum,
        snippet: body.slice(0, 1200).replace(/\s+/g, ' ').trim(),
      })
    }
  }

  scoredPages.sort((a, b) => b.score - a.score)
  return scoredPages.slice(0, maxSnippets).map(({ page, snippet }) => ({ page, snippet }))
}

async function fetchTier1Excerpts(
  searchText: string,
  focusBookSlug?: string | null
): Promise<{ excerpts: Tier1Excerpt[]; vaultConnected: boolean }> {
  const token = process.env.GITHUB_VAULT_TOKEN
  const repo = process.env.GITHUB_VAULT_REPO || 'kevinhabakuk-hub/bukuanes-md'
  if (!token) {
    return { excerpts: [], vaultConnected: false }
  }

  const targets = selectTopChapters(searchText, focusBookSlug, 3)
  const tokens = tokenize(searchText)
  const excerpts: Tier1Excerpt[] = []

  await Promise.all(
    targets.map(async ({ book, chapter }) => {
      try {
        const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(book.slug)}/${encodeURIComponent(chapter.file)}`
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.raw+json',
            'User-Agent': 'AnesLog-Consult-3Tier',
          },
          signal: AbortSignal.timeout(7000),
        })
        if (!res.ok) return
        const md = await res.text()
        const best = extractBestSnippetsFromMarkdown(md, tokens, 2)
        for (const hit of best) {
          excerpts.push({
            bookTitle: book.title,
            edition: book.edition,
            chapterTitle: chapter.title,
            page: hit.page,
            snippet: hit.snippet,
          })
        }
      } catch {
        // Skip failed chapter fetch gracefully
      }
    })
  )

  return { excerpts: excerpts.slice(0, 5), vaultConnected: true }
}

async function fetchTier2PubMed(searchText: string): Promise<Tier2Article[]> {
  try {
    const cleanTerms = tokenize(searchText).slice(0, 6).join(' ')
    const pubmedQuery = `(${cleanTerms}) AND (anesthesia[Title/Abstract] OR perioperative[Title/Abstract] OR anesthesiology[Journal])`
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=4&sort=relevance&term=${encodeURIComponent(pubmedQuery)}`
    const sRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) })
    if (!sRes.ok) return []
    const sData = (await sRes.json()) as { esearchresult?: { idlist?: string[] } }
    const ids = sData.esearchresult?.idlist ?? []
    if (ids.length === 0) return []

    const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`
    const sumRes = await fetch(sumUrl, { signal: AbortSignal.timeout(5000) })
    if (!sumRes.ok) return []
    const sumData = (await sumRes.json()) as {
      result?: Record<
        string,
        {
          uid?: string
          title?: string
          source?: string
          pubdate?: string
          authors?: Array<{ name: string }>
        }
      >
    }

    const articles: Tier2Article[] = []
    for (const id of ids) {
      const item = sumData.result?.[id]
      if (!item?.title) continue
      const firstAuthor = item.authors?.[0]?.name || 'Unknown'
      const authors = (item.authors?.length ?? 0) > 1 ? `${firstAuthor} et al.` : firstAuthor
      const yearMatch = (item.pubdate || '').match(/\d{4}/)
      articles.push({
        pmid: id,
        title: item.title,
        authors,
        journal: item.source || 'PubMed',
        year: yearMatch ? yearMatch[0] : '',
      })
    }
    return articles
  } catch {
    return []
  }
}

function sanitizePatientContext(raw: Record<string, unknown> | null | undefined): AnonymizedPatientContext | null {
  if (!raw || typeof raw !== 'object') return null
  // Explicitly allowlist ONLY non-PHI clinical fields (never fullName or rmNumber)
  return {
    age: typeof raw.age === 'string' ? raw.age : undefined,
    weightKg: typeof raw.weightKg === 'string' ? raw.weightKg : undefined,
    diagnosisProcedure: typeof raw.diagnosisProcedure === 'string' ? raw.diagnosisProcedure : undefined,
    comorbidities: Array.isArray(raw.comorbidities) ? raw.comorbidities.filter((x): x is string => typeof x === 'string') : undefined,
    otherComorbidity: typeof raw.otherComorbidity === 'string' ? raw.otherComorbidity : undefined,
    hasAllergy: typeof raw.hasAllergy === 'boolean' ? raw.hasAllergy : undefined,
    allergyNote: typeof raw.allergyNote === 'string' ? raw.allergyNote : undefined,
    medications: typeof raw.medications === 'string' ? raw.medications : undefined,
    asaClass: typeof raw.asaClass === 'string' ? raw.asaClass : undefined,
    isEmergency: typeof raw.isEmergency === 'boolean' ? raw.isEmergency : undefined,
    mallampati: typeof raw.mallampati === 'string' ? raw.mallampati : undefined,
    npoHours: typeof raw.npoHours === 'string' ? raw.npoHours : undefined,
    anesthesiaPlan: typeof raw.anesthesiaPlan === 'string' ? raw.anesthesiaPlan : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // 1. PIN Protection
  const requiredPin = (process.env.ANESLOG_PIN || '').trim()
  if (requiredPin) {
    const providedPin = (req.headers.get('x-aneslog-pin') || '').trim()
    if (!providedPin || providedPin !== requiredPin) {
      return jsonResponse({ error: 'PIN akses Consult AI salah atau belum diisi di Pengaturan.' }, 401)
    }
  }

  const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim()
  if (!geminiApiKey) {
    return jsonResponse(
      { error: 'GEMINI_API_KEY belum diatur di Netlify Environment Variables.' },
      500
    )
  }

  let body: ConsultRequestBody
  try {
    body = (await req.json()) as ConsultRequestBody
  } catch {
    return jsonResponse({ error: 'Payload JSON tidak valid.' }, 400)
  }

  const query = (body.query || '').trim()
  const patientContext = sanitizePatientContext(body.patientContext as Record<string, unknown> | null)
  if (!query && !patientContext) {
    return jsonResponse({ error: 'Masukkan pertanyaan klinis atau pilih pasien terlebih dahulu.' }, 400)
  }

  const combinedSearch = [
    query,
    patientContext?.diagnosisProcedure || '',
    (patientContext?.comorbidities || []).join(' '),
    patientContext?.otherComorbidity || '',
    patientContext?.medications || '',
    patientContext?.anesthesiaPlan || '',
  ]
    .filter(Boolean)
    .join(' ')

  // 2. Fetch Tier 1 (Private GitHub Vault) & Tier 2 (Live PubMed) in parallel
  const [tier1Result, tier2Articles] = await Promise.all([
    fetchTier1Excerpts(combinedSearch, body.focusBookSlug),
    fetchTier2PubMed(combinedSearch),
  ])

  const weightNum = patientContext?.weightKg ? parseFloat(patientContext.weightKg.replace(',', '.')) : NaN

  const systemInstruction = `Anda adalah ALL-ABOUT-ANES, Senior Consultant Anesthesiologist & Evidence-Based Perioperative Partner bagi Bakuk (Sp.An-TI).
Aturan ketat:
- Panggil "Bakuk" di awal/isi bila menyapa, dan "Kuk" secara luwes. DILARANG memanggil "Dok", "Pak", atau "Bos".
- Kedalaman setara Konsultan/Fellow Anestesiologi & Terapi Intensif. Bahasa Indonesia akademik tajam, pertahankan seluruh terminologi medis/farmakologi/skor dalam Bahasa Inggris baku.
- ZERO HALLUCINATION: Hanya sitasi halaman buku dari Tier 1 yang benar-benar diberikan di konteks, dan hanya sitasi PMID dari Tier 2 yang diberikan (atau hasil Google Search Grounding untuk Tier 3 Guidelines). Jika konflik antara textbook klasik & guideline terbaru, sebutkan keduanya secara eksplisit.
- Jika berat badan pasien tersedia (${Number.isFinite(weightNum) ? `${weightNum} kg` : 'tidak tersedia'}), hitung dosis absolut (mg/mcg) secara presisi pada array dosing.

KELUARKAN OUTPUT HANYA DALAM FORMAT JSON VALID (tanpa markdown fence \`\`\`json) dengan struktur persis:
{
  "safetyAlert": "string kosong jika tidak ada bahaya fatal, atau peringatan merah kritis (mis. antikoagulan vs neuraksial, alergi, difficult airway)",
  "bottomLine": "2-4 kalimat lugas jawaban klinis utama untuk Bakuk",
  "hemodynamicTargets": [
    { "label": "Target MAP", "value": "65-75 mmHg" }
  ],
  "clinicalPlan": [
    "Langkah tata laksana terstruktur 1...",
    "Langkah 2..."
  ],
  "dosing": [
    { "drug": "Nama Obat", "rule": "mg/kg atau mcg/kg/min", "calculatedDose": "Dosis absolut sesuai BB atau rentang standar", "note": "Catatan klinis singkat" }
  ],
  "pearlsAndPitfalls": [
    "Clinical pearl / lethal pitfall 1..."
  ],
  "evidenceConflict": "Kosong jika sejalan, atau jelaskan singkat perbedaan textbook vs guideline terbaru",
  "references": {
    "tier1": ["[Buku: Judul, Ed. X, Bab Y, Hal. Z]"],
    "tier2": ["[PubMed/PMC: Author et al., Journal Tahun; PMID: xxxxx]"],
    "tier3": ["[Guideline/Web: Organisasi, Tahun, URL]"]
  }
}`

  const userPrompt = [
    `PERTANYAAN KLINIS BAKUK: ${query || 'Buatkan rencana anestesi perioperatif lengkap, dosis obat, target hemodinamik, dan pitfalls untuk kasus ini.'}`,
    patientContext
      ? `\nPROFIL KLINIS PASIEN (ANONIM / PHI-SAFE):\n${JSON.stringify(patientContext, null, 2)}`
      : '',
    tier1Result.excerpts.length > 0
      ? `\n=== TIER 1: KUTIPAN TERVERIFIKASI DARI BUKUANES-MD ===\n${tier1Result.excerpts
          .map(
            (e) =>
              `[${e.bookTitle} (${e.edition}) | Bab: ${e.chapterTitle} | Hal. ${e.page}]\n${e.snippet}`
          )
          .join('\n\n')}`
      : `\n=== TIER 1 ===\n(${tier1Result.vaultConnected ? 'Tidak ada kutipan teks spesifik ditemukan di bab terpilih.' : 'GITHUB_VAULT_TOKEN belum dipasang di Netlify Env; gunakan Tier 2 & 3 secara transparan.'})`,
    tier2Articles.length > 0
      ? `\n=== TIER 2: ARTIKEL PUBMED LIVE ===\n${tier2Articles
          .map((a) => `- ${a.authors} (${a.year}). "${a.title}" ${a.journal}. PMID: ${a.pmid}`)
          .join('\n')}`
      : '\n=== TIER 2 ===\n(Tidak ada artikel PubMed spesifik dari query otomatis ini.)',
  ].join('\n')

  try {
    const candidateModels = process.env.GEMINI_MODEL
      ? [process.env.GEMINI_MODEL]
      : ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.0-flash', 'gemini-2.5-flash-lite']

    const callGemini = async (modelName: string, withSearch: boolean) => {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(geminiApiKey)}`
      return fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          ...(withSearch ? { tools: [{ googleSearch: {} }] } : {}),
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2400,
          },
        }),
        signal: AbortSignal.timeout(24000),
      })
    }

    let gRes: Response | null = null
    for (const modelName of candidateModels) {
      gRes = await callGemini(modelName, true)
      if (gRes.status === 400) {
        gRes = await callGemini(modelName, false)
      }
      if (gRes.status !== 404) break
    }

    if (!gRes || !gRes.ok) {
      const errText = gRes ? await gRes.text() : 'No response'
      return jsonResponse({ error: `Gemini API error (${gRes?.status ?? 502}): ${errText.slice(0, 240)}` }, 502)
    }

    const gData = (await gRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { title?: string; uri?: string } }>
        }
      }>
    }

    const rawText =
      gData.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim() || ''

    // Extract JSON safely even if wrapped in code fences
    const cleanedJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let parsed: Record<string, unknown>
    try {
      const firstBrace = cleanedJson.indexOf('{')
      const lastBrace = cleanedJson.lastIndexOf('}')
      parsed = JSON.parse(
        firstBrace !== -1 && lastBrace !== -1 ? cleanedJson.slice(firstBrace, lastBrace + 1) : cleanedJson
      ) as Record<string, unknown>
    } catch {
      parsed = {
        safetyAlert: '',
        bottomLine: rawText || 'Tidak ada respons dari model.',
        hemodynamicTargets: [],
        clinicalPlan: [],
        dosing: [],
        pearlsAndPitfalls: [],
        evidenceConflict: '',
        references: {
          tier1: tier1Result.excerpts.map(
            (e) => `[Buku: ${e.bookTitle}, ${e.edition}, ${e.chapterTitle}, Hal. ${e.page}]`
          ),
          tier2: tier2Articles.map(
            (a) => `[PubMed: ${a.authors}, ${a.journal} ${a.year}; PMID: ${a.pmid}]`
          ),
          tier3: [],
        },
      }
    }

    // Append verified Google Search grounding URLs to Tier 3 if available
    const groundingChunks = gData.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
    const groundingRefs = groundingChunks
      .filter((c) => c.web?.uri)
      .slice(0, 4)
      .map((c) => `[Guideline/Web: ${c.web?.title || 'Sumber Web'}, ${c.web?.uri}]`)

    const refs = (parsed.references as { tier1?: string[]; tier2?: string[]; tier3?: string[] }) || {}
    const mergedTier3 = Array.from(new Set([...(refs.tier3 || []), ...groundingRefs]))

    return jsonResponse({
      result: {
        ...parsed,
        references: {
          tier1: refs.tier1 || [],
          tier2: refs.tier2 || [],
          tier3: mergedTier3,
        },
      },
      meta: {
        vaultConnected: tier1Result.vaultConnected,
        tier1Hits: tier1Result.excerpts.length,
        tier2Hits: tier2Articles.length,
        tier3Hits: mergedTier3.length,
        weightKg: Number.isFinite(weightNum) ? weightNum : null,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menghubungi mesin Consult AI.'
    return jsonResponse({ error: message }, 500)
  }
}
