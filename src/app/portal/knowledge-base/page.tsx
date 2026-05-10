import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KnowledgeBaseClient from './KnowledgeBaseClient'

export default async function KnowledgeBasePage() {
  const { user } = await getAuthUser()
  if (!user) redirect('/login')

  return <KnowledgeBaseClient />
}
