import { createFileRoute } from '@tanstack/react-router';

const TITLE = 'Тухай | Gerar';

export const Route = createFileRoute('/_dashboard/about/')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: About,
});

function About() {
  return <div className="p-2">About</div>;
}
