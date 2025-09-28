import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/users/$username')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/users/$username"!</div>
}
