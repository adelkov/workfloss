import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Zap, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

export function SignInPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to workfloss</h1>
          <p className="text-sm text-muted-foreground">
            Enter your name and the demo password to continue
          </p>
        </div>
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            setLoading(true)
            const fd = new FormData(e.currentTarget)
            const name = (fd.get("name") as string).trim()
            const password = fd.get("password") as string
            if (!name) {
              setError("Please enter your name")
              setLoading(false)
              return
            }
            signIn(password, name)
              .then(() => navigate("/", { replace: true }))
              .catch(() => setError("Wrong password"))
              .finally(() => setLoading(false))
          }}
        >
          <Input
            name="name"
            type="text"
            placeholder="Your name"
            required
            autoFocus
            autoComplete="name"
            onChange={() => setError(null)}
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            required
            onChange={() => setError(null)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  )
}
