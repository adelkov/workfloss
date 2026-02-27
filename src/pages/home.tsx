import { useNavigate } from "react-router-dom";
import { Film, GraduationCap, FileText } from "lucide-react";

const documentTypes = [
  {
    type: "storyboard",
    title: "Storyboard",
    description: "Plan scenes, shots, and dialogue for video content.",
    icon: Film,
  },
  {
    type: "course_outline",
    title: "Course Outline",
    description: "Design modules, lessons, and learning objectives.",
    icon: GraduationCap,
  },
  {
    type: "freeform",
    title: "Freeform",
    description: "Write anything — articles, notes, brainstorms.",
    icon: FileText,
  },
] as const;

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          What do you want to work on?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pick a document type to get started with a specialized assistant.
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {documentTypes.map(({ type, title, description, icon: Icon }) => (
          <button
            key={type}
            onClick={() => navigate(`/w/${type}`)}
            className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
