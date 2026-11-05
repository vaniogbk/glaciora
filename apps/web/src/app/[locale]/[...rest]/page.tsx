import { notFound } from 'next/navigation';

/** Adresse inconnue dans une langue : page 404 traduite (app/[locale]/not-found.tsx). */
export default function UnknownPage() {
  notFound();
}
