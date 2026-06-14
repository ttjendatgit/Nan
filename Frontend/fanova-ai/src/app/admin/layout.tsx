// TODO: Route guard — require isAuthenticated + role "Admin" before rendering.
// Pattern: read token from localStorage, call GET /api/Auth/me, check roles.
// If unauthenticated → redirect to /auth/login.
// If authenticated but not Admin → redirect to / with a toast.
// Implement once useAuth and a ProtectedRoute component are production-hardened.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
