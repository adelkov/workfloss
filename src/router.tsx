import { createBrowserRouter } from "react-router-dom"
import { RootLayout } from "@/layouts/root-layout"
import { AuthGuard } from "@/components/auth-guard"
import { SignInPage } from "@/pages/sign-in"
import { HomePage } from "@/pages/home"
import { WorkspacePage } from "@/pages/workspace"
import { SettingsPage } from "@/pages/settings"
import { NotFoundPage } from "@/pages/not-found"

export const router = createBrowserRouter([
  { path: "sign-in", element: <SignInPage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "w/:type", element: <WorkspacePage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
