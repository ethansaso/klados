import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/glossary/modifiers/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/glossary/modifiers/$id"!</div>
}
