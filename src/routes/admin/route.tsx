import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h1>Admin Layout</h1>
      <hr />
      <Outlet />
    </div>
  )
}