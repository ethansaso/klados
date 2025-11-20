import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: Home,
});

function Home() {
  return (
    <div>
      <h1>Welcome to Klados!</h1>
    </div>
  );
}
