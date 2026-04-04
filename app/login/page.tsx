import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-blue-400 font-mono font-bold text-2xl tracking-widest">
            ATLASROOM
          </h1>
          <p className="text-slate-600 font-mono text-xs mt-1">
            macro research platform
          </p>
        </div>
        <div className="bg-[#0a0f1a] border border-[#131d2e] rounded-lg p-8">
          <LoginForm />
          <p className="text-center text-slate-600 font-mono text-xs mt-6">
            No account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
