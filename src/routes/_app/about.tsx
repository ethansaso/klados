import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/about"!</div>
}
