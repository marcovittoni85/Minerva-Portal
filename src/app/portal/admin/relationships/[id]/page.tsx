import ContactDetail from '@/components/relationships/ContactDetail';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <ContactDetail contactId={id} />
    </div>
  );
}
