import { Briefcase, Users, Bell, ListTodo, FileText, BookOpen, Inbox, Search, Activity } from 'lucide-react'
import { EmptyState } from './EmptyState'

/** Bacheca deal vuota */
export function EmptyDealBoard() {
  return (
    <EmptyState
      icon={Briefcase}
      title="L'ecosistema sta lavorando per te"
      description="I primi deal arriveranno qui. Marco e Enrico stanno valutando le opportunit&agrave; pi&ugrave; adatte."
    />
  )
}

/** CRM vuoto (admin, no contatti) */
export function EmptyCRM() {
  return (
    <EmptyState
      icon={Users}
      title="Il tuo network inizia qui"
      description="Importa i primi contatti dal tuo CSV o aggiungili uno alla volta."
      primaryAction={{ label: 'Importa CSV', href: '/portal/admin/import-partners' }}
      secondaryAction={{ label: 'Aggiungi contatto', href: '/portal/admin/relationships' }}
    />
  )
}

/** Notifiche vuote */
export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="Nessuna notifica"
      description="Tutto sotto controllo. Sarai avvisato quando arriveranno aggiornamenti."
    />
  )
}

/** Pipeline vuota */
export function EmptyPipeline() {
  return (
    <EmptyState
      icon={Activity}
      title="Pipeline pulita"
      description="Nessun deal in corso. Pronto per i prossimi mandati."
      primaryAction={{ label: 'Crea nuovo deal', href: '/portal/admin/new-deal' }}
    />
  )
}

/** Mandati vuoti */
export function EmptyMandates() {
  return (
    <EmptyState
      icon={FileText}
      title="Nessun mandato attivo"
      description="I mandati firmati appariranno qui."
      primaryAction={{ label: 'Nuovo mandato', href: '/portal/mandates' }}
    />
  )
}

/** Knowledge Base vuota */
export function EmptyKnowledgeBase() {
  return (
    <EmptyState
      icon={BookOpen}
      title="La memoria di Minerva inizia qui"
      description="Fai la prima domanda sui Codici, Patto, fee waterfall, governance..."
    />
  )
}

/** Tasks vuote */
export function EmptyTasks() {
  return (
    <EmptyState
      icon={ListTodo}
      title="Nessun task aperto"
      description="Quando un deal richiede azioni, le troverai qui."
    />
  )
}

/** Inbox vuoto */
export function EmptyInbox() {
  return (
    <EmptyState
      icon={Inbox}
      title="Inbox vuota"
      description="Niente di pendente."
    />
  )
}

/** Search senza risultati */
export function EmptySearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="Nessun risultato"
      description={`Non ho trovato nulla per "${query}". Prova con altri termini.`}
    />
  )
}
