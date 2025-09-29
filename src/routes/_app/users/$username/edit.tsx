import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/users/$username/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/users/$username/edit"!</div>
}
