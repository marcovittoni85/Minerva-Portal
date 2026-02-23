import Image from 'next/image';

export default function AccessExpired() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <Image src="/icon.webp" alt="Minerva" width={80} height={80} className="mb-8" unoptimized />
      <h1 className="text-[#D4AF37] text-2xl tracking-[0.4em] uppercase font-light mb-6">Periodo di Prova Terminato</h1>
      <p className="text-slate-600 max-w-lg leading-relaxed mb-10 text-sm font-medium">
        Il tuo accesso temporaneo di 30 giorni al Marketplace è scaduto. 
        Come previsto dal modello VERITAS, per ripristinare le credenziali è necessario 
        restituire firmati i documenti allegati alla lettera di invito (Codice Etico e Operativo).
      </p>
      <div className="space-y-4">
        <a href="mailto:board@minervapartners.it" className="block bg-[#001220] text-white px-10 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em]">Contatta la Segreteria</a>
        <a href="/login" className="block text-slate-400 text-[10px] uppercase font-bold tracking-widest hover:text-[#D4AF37]">Torna al Login</a>
      </div>
    </div>
  );
}