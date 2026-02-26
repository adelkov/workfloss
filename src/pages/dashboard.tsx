import { Button } from "@/components/ui/button"

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to workfloss. Get started by exploring your workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm"
          >
            <div className="mb-4 h-2 w-16 rounded-full bg-muted" />
            <h3 className="text-lg font-semibold">Card {i + 1}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Placeholder content for your first feature.
            </p>
            <Button variant="outline" size="sm" className="mt-4">
              View details
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
