import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/keys/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/keys/create"!</div>
}
