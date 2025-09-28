import { createFileRoute } from '@tanstack/react-router'
import { SignInForm } from '../../components/auth/SignInForm'

export const Route = createFileRoute('/_app/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignInForm />
}
