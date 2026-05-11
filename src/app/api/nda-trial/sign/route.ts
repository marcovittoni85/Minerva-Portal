import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { sendNotificationEmail } from '@/lib/send-notification-email'

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, lineHeight: 1.6, fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 15, textAlign: 'center' },
  subtitle: { fontSize: 11, textAlign: 'center', marginBottom: 20, color: '#666' },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 4, marginTop: 8 },
  text: { fontSize: 9.5, lineHeight: 1.5 },
  partiesBox: { padding: 12, backgroundColor: '#f8f8f8', borderRadius: 4, marginBottom: 15 },
  sigBlock: { marginTop: 25, paddingTop: 15, borderTop: '1 solid #ccc' },
  signatureImage: { width: 150, height: 50, marginTop: 5, marginBottom: 5 },
  footer: { fontSize: 7, color: '#999', marginTop: 10 },
  acceptance: { padding: 10, backgroundColor: '#fffbe6', borderRadius: 4, marginTop: 15 },
})

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const body = await req.json()
    const {
      nome, email, codice_fiscale, indirizzo, telefono,
      e_persona_giuridica, ragione_sociale, piva,
      signature_data_url, specifica_1341_approvata, ip_address,
    } = body

    if (!nome || !email || !signature_data_url || !specifica_1341_approvata) {
      return NextResponse.json({ error: 'Dati obbligatori mancanti' }, { status: 400 })
    }

    const ipAddress = ip_address || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = req.headers.get('user-agent') ?? ''
    const now = new Date()
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const today = now.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })

    const admin = supabaseAdmin()

    // 1. Insert NDA record
    const { data: ndaRecord, error: insertErr } = await admin
      .from('nda_trial_signatures')
      .insert({
        user_id: user.id,
        nda_version: '0.1',
        candidato_nome: nome,
        candidato_codice_fiscale: codice_fiscale || null,
        candidato_email: email,
        candidato_indirizzo: indirizzo || null,
        candidato_telefono: telefono || null,
        candidato_e_persona_giuridica: e_persona_giuridica || false,
        candidato_ragione_sociale: ragione_sociale || null,
        candidato_piva: piva || null,
        signature_data_url,
        signature_method: 'web_pad',
        specifica_1341_approvata,
        ip_address: ipAddress,
        user_agent: userAgent,
        trial_starts_at: now.toISOString(),
        trial_ends_at: trialEnds.toISOString(),
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('NDA insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // 2. Generate PDF
    const ndaArticles = [
      { title: 'Art. 1 — Definizioni', body: '1.1 "Informazioni Riservate": qualsiasi informazione, dato, documento, know-how, strategia commerciale, lista clienti, dettagli di operazioni in corso o concluse, struttura retributiva, metodologie operative, software e tecnologie proprietarie di Minerva Partners, comunicata o resa accessibile al Candidato in qualsiasi forma durante il periodo di Trial.\n1.2 "Periodo di Trial": 30 giorni di calendario decorrenti dalla data di sottoscrizione.\n1.3 "Portale Minerva": la piattaforma tecnologica proprietaria di Minerva Partners.\n1.4 "Rete Minerva": l\'insieme dei Partner, Advisor e Friend che operano nell\'ecosistema Minerva Partners.' },
      { title: 'Art. 2 — Oggetto', body: '2.1 Il presente accordo disciplina gli obblighi di riservatezza del Candidato durante e dopo il Periodo di Trial.\n2.2 Durante il Trial il Candidato avrà accesso limitato al Portale: bacheca deal pubblici, struttura rete, Codici e regolamenti, funzionalità base.\n2.3 Il Candidato NON avrà accesso a: dettagli specifici dei deal, dati personali dei membri, documenti riservati, funzionalità di origination e workgroup.' },
      { title: 'Art. 3 — Obblighi di Riservatezza', body: '3.1 Il Candidato si impegna a: (a) Mantenere la più stretta riservatezza su tutte le Informazioni Riservate; (b) Non divulgare a terzi le Informazioni Riservate; (c) Non utilizzarle per finalità diverse dalla valutazione; (d) Non riprodurre in alcuna forma; (e) Adottare misure di sicurezza adeguate.' },
      { title: 'Art. 4 — Durata dell\'obbligo di riservatezza', body: '4.1 Gli obblighi si applicano durante il Trial e per un periodo INDETERMINATO successivo, indipendentemente dall\'esito della valutazione.' },
      { title: 'Art. 5 — Proprietà Intellettuale', body: '5.1 Nessuna disposizione trasferisce al Candidato diritti di proprietà intellettuale.\n5.2 Al termine del Trial, il Candidato è tenuto a cancellare qualsiasi copia.' },
      { title: 'Art. 6 — Non-Circumvention', body: '6.1 Per 12 mesi dalla conclusione del Trial, il Candidato non può: (a) Contattare soggetti conosciuti tramite Minerva; (b) Proporre operazioni a controparti di Minerva; (c) Reclutare membri della Rete.' },
      { title: 'Art. 7 — Penali', body: '7.1 In caso di violazione: penale di EUR 50.000,00 per ciascuna violazione accertata, fatto salvo il risarcimento del maggior danno.' },
      { title: 'Art. 8 — Restituzione delle Informazioni', body: '8.1 Al termine del Trial o su richiesta: (a) Restituire tutti i documenti; (b) Cancellare irrevocabilmente copie digitali; (c) Confermare per iscritto.' },
      { title: 'Art. 9 — Dichiarazioni del Candidato', body: '9.1 Il Candidato dichiara di: (a) Essere maggiorenne; (b) Non avere procedimenti penali per reati finanziari; (c) Non avere accordi confliggenti; (d) Agire in proprio nome.' },
      { title: 'Art. 10 — Trattamento Dati Personali', body: '10.1 Trattamento in conformità GDPR.\n10.2 Consenso a profilazione e valutazione idoneità.\n10.3 Conservazione per 5 anni. Diritti artt. 15-22 GDPR: privacy@minervapartners.it.' },
      { title: 'Art. 11 — Disposizioni Generali', body: '11.1 Intero accordo tra le Parti. 11.2 Modifiche solo per iscritto. 11.3 Clausola di salvaguardia. 11.4 Divieto di cessione senza consenso.' },
      { title: 'Art. 12 — Legge Applicabile e Foro', body: '12.1 Legge italiana.\n12.2 Foro esclusivo di Milano.' },
    ]

    const PdfDoc = createElement(Document, null,
      createElement(Page, { size: 'A4', style: styles.page },
        createElement(Text, { style: styles.title }, 'ACCORDO DI RISERVATEZZA PRELIMINARE'),
        createElement(Text, { style: styles.subtitle }, 'NDA Trial 30 giorni — Minerva Partners'),

        // Parties
        createElement(View, { style: styles.partiesBox },
          createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4 } }, 'TRA'),
          createElement(Text, { style: styles.text }, 'Minerva Partners S.r.l., Via Roggia Vignola 9, 24047 Treviglio (BG)'),
          createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 6, marginBottom: 4 } }, 'E'),
          createElement(Text, { style: styles.text }, `${nome}, C.F. ${codice_fiscale || 'N/D'}, ${email}`),
          ...(e_persona_giuridica
            ? [createElement(Text, { style: styles.text, key: 'pg' }, `in qualità di L.R. di ${ragione_sociale}, P.IVA ${piva}`)]
            : []),
          ...(indirizzo
            ? [createElement(Text, { style: styles.text, key: 'addr' }, `Indirizzo: ${indirizzo}`)]
            : []),
        ),

        // Articles
        ...ndaArticles.map((art, i) =>
          createElement(View, { style: styles.section, key: i },
            createElement(Text, { style: styles.sectionTitle }, art.title),
            createElement(Text, { style: styles.text }, art.body),
          )
        ),

        // 1341 acceptance
        createElement(View, { style: styles.acceptance },
          createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4 } },
            'ACCETTAZIONE EX ART. 1341 C.C.'
          ),
          createElement(Text, { style: { fontSize: 8 } },
            'Il Candidato approva specificamente: Art. 4 (Riservatezza indeterminata), Art. 6 (Non-circumvention 12 mesi), Art. 7 (Penali EUR 50.000), Art. 8 (Restituzione informazioni), Art. 10.2-10.3 (Consenso trattamento dati), Art. 12.2 (Foro esclusivo Milano).'
          ),
        ),

        // Signature block
        createElement(View, { style: styles.sigBlock },
          createElement(Text, { style: styles.text }, `Data: ${today}`),
          createElement(Text, { style: { ...styles.text, marginTop: 8, fontFamily: 'Helvetica-Bold' } }, 'Per il Candidato — Firma:'),
          createElement(Image, { src: signature_data_url, style: styles.signatureImage } as any),
          createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold' } }, nome),
          createElement(Text, { style: styles.footer },
            `Firma apposta digitalmente il ${now.toISOString()} | IP ${ipAddress} | ${userAgent.slice(0, 80)}`
          ),
          createElement(Text, { style: { ...styles.text, marginTop: 10, fontFamily: 'Helvetica-Bold' } }, 'Firma specifica ex art. 1341 c.c.:'),
          createElement(Image, { src: signature_data_url, style: styles.signatureImage } as any),
        ),
      )
    )

    const pdfBlob = await pdf(PdfDoc).toBlob()
    const buffer = Buffer.from(await pdfBlob.arrayBuffer())

    // 3. Upload PDF to storage
    const storagePath = `nda-trial/${user.id}/${ndaRecord.id}.pdf`
    const { error: uploadErr } = await admin.storage
      .from('deal-documents')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })

    let pdfUrl = ''
    if (uploadErr) {
      console.error('PDF upload error:', uploadErr)
    } else {
      const { data: signed } = await admin.storage
        .from('deal-documents')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365) // 1 year
      pdfUrl = signed?.signedUrl ?? ''
    }

    // 4. Update record with pdf_url
    if (pdfUrl) {
      await admin
        .from('nda_trial_signatures')
        .update({ pdf_url: pdfUrl })
        .eq('id', ndaRecord.id)
    }

    // 5. Audit log
    const { error: auditErr } = await admin.from('deal_activity_log').insert({
      deal_id: null,
      user_id: user.id,
      action: 'nda_trial_signed',
      details: { nda_id: ndaRecord.id, pdf_url: pdfUrl },
    })
    if (auditErr) console.error('Audit log error:', auditErr)

    // 6. Email PDF al candidato
    try {
      await sendNotificationEmail({
        to: email,
        recipientName: nome.split(' ')[0],
        title: 'NDA Trial Minerva — Copia firmata',
        body: `Il tuo Accordo di Riservatezza preliminare è stato firmato con successo. Il periodo di Trial ha inizio oggi e scadrà il ${trialEnds.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}. Puoi scaricare la tua copia firmata dal portale.`,
        link: '/portal/onboarding',
      })
    } catch (emailErr) {
      console.error('NDA email error:', emailErr)
    }

    return NextResponse.json({
      success: true,
      pdf_url: pdfUrl,
      nda_id: ndaRecord.id,
    })
  } catch (err) {
    console.error('NDA sign error:', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
