import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/keys/$keyId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/keys/_browsing/$keyId/"!</div>
}
