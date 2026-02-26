import { useState } from "react"
import { useAuthActions } from "@convex-dev/auth/react"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SignInPage() {
  const { signIn } = useAuthActions()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Zap className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent you a sign-in link. Click the link in your email to continue.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setSubmitted(false)}>
            Try a different email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to workfloss</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a magic link
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setLoading(true)
            const formData = new FormData(e.currentTarget)
            void signIn("resend", formData)
              .then(() => setSubmitted(true))
              .finally(() => setLoading(false))
          }}
        >
          <Input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send sign-in link"}
          </Button>
        </form>
      </div>
    </div>
  )
}
