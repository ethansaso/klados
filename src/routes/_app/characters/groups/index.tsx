import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/characters/groups/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/characters/groups/"!</div>
}
