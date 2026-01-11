import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/about/')({
  component: About,
});

function About() {
  return <div className="p-2">About</div>;
}
