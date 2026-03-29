'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import type { AuthState } from '@/app/login/actions'

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}
