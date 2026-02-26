import { Separator } from "@/components/ui/separator"

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and application preferences.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h3 className="text-lg font-semibold">General</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure general application settings here.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h3 className="text-lg font-semibold">Appearance</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch between light and dark mode using the toggle in the sidebar.
          </p>
        </div>
      </div>
    </div>
  )
}
