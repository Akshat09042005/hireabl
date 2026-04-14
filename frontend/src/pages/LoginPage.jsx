import { useSearchParams, Link } from 'react-router-dom'

function LoginPage() {
  const [searchParams] = useSearchParams()
  const hasOAuthError = searchParams.get('error') === 'oauth_failed'

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f6f8fb] p-6">
      <section className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-[#111827]">Login</h1>
        {hasOAuthError && (
          <p className="mt-4 text-sm text-[#b42318]">
            OAuth login failed. Please try again.
          </p>
        )}
        <p className="mt-4 text-sm text-[#6b7280]">
          Continue by starting social login from signup.
        </p>
        <Link className="mt-6 inline-block text-[#2563eb] font-medium" to="/signup">
          Go to signup
        </Link>
      </section>
    </main>
  )
}

export default LoginPage
