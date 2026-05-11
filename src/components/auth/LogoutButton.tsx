'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[#D4AF37]/70 hover:text-[#D4AF37] flex items-center gap-2 text-sm transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  )
}
