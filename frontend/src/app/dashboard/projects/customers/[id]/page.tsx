import CustomerProjectsClient from './page.client';

export async function generateStaticParams() {
  return [{ id: 'static' }];
}

export default function Page() {
  return <CustomerProjectsClient />;
}
