import React from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '../api/auth/[...nextauth]/route'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  
  const session = await getServerSession(authOptions)
  const isAdmin = Boolean((session as any)?.user?.isAdmin)

  if (!isAdmin) {
    
    redirect('/admin-access')
  }

  return <>{children}</>
}
