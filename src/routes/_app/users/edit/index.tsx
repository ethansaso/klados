import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/users/edit/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/users/edit/"!</div>
}
