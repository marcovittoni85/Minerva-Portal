"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Info, AlertTriangle } from "lucide-react";

const roleOptions = [
  { value: "facilitatore", label: "Facilitatore / Finder" },
  { value: "buyer_rep", label: "Rappresento il buyer / investitore" },
  { value: "seller_rep", label: "Rappresento il venditore / target" },
  { value: "supporto_tecnico", label: "Supporto tecnico (legal, tax, DD, ecc.)" },
];

const mandateOptions = [
  { value: "none", label: "No, nessun accordo" },
  { value: "formal", label: "Sì, mandato formale scritto" },
  { value: "informal", label: "Sì, accordo informale / verbale" },
];

const counterpartyOptions = [
  { value: "buyer", label: "Buyer / investitore" },
  { value: "seller", label: "Venditore / target" },
  { value: "other", label: "Altro soggetto" },
];

const feeTypeOptions = [
  { value: "percentage", label: "% su EV" },
  { value: "fixed", label: "Importo fisso" },
  { value: "tbd", label: "Da negoziare" },
];

const chainRelationshipOptions = [
  { value: "sub_mandato_scritto", label: "Sub-mandato scritto" },
  { value: "accordo_verbale", label: "Accordo verbale" },
  { value: "segnalazione", label: "Segnalazione" },
];

export default function DeclarationForm({
  deal,
  userId,
  alreadyDeclared,
}: {
  deal: { id: string; title: string; code: string; sector: string };
  userId: string;
  alreadyDeclared: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [roleInDeal, setRoleInDeal] = useState("");
  const [hasMandate, setHasMandate] = useState("");
  const [mandateCounterparty, setMandateCounterparty] = useState("");
  const [mandateFeeType, setMandateFeeType] = useState("");
  const [mandateFeeValue, setMandateFeeValue] = useState("");
  const [isChainMandate, setIsChainMandate] = useState(false);
  const [chainName, setChainName] = useState("");
  const [chainCompany, setChainCompany] = useState("");
  const [chainContact, setChainContact] = useState("");
  const [chainRelationship, setChainRelationship] = useState("");
  const [hasConflict, setHasConflict] = useState<"no" | "yes" | "">("");
  const [conflictDetails, setConflictDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyDeclared);
  const [showTooltip, setShowTooltip] = useState(false);

  const hasMandateAgreement = hasMandate === "formal" || hasMandate === "informal";

  const noMandateSelected = hasMandate === "none";

  const isValid =
    roleInDeal &&
    hasMandate &&
    !noMandateSelected &&
    hasConflict &&
    (!hasMandateAgreement || mandateCounterparty) &&
    (!hasMandateAgreement || mandateFeeType) &&
    (hasConflict !== "yes" || conflictDetails.trim());

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from("deal_declarations").insert({
      deal_id: deal.id,
      user_id: userId,
      role_in_deal: roleInDeal,
      has_mandate: hasMandateAgreement,
      mandate_counterparty: hasMandateAgreement ? mandateCounterparty : null,
      mandate_fee_type: hasMandateAgreement ? mandateFeeType : null,
      mandate_fee_value: hasMandateAgreement && mandateFeeValue ? mandateFeeValue : null,
      has_conflict: hasConflict === "yes",
      conflict_details: hasConflict === "yes" ? conflictDetails.trim() : null,
      is_chain_mandate: isChainMandate,
      chain_mandante_name: isChainMandate ? chainName : null,
      chain_mandante_company: isChainMandate ? chainCompany : null,
      chain_mandante_contact: isChainMandate ? chainContact : null,
      chain_mandante_relationship: isChainMandate ? chainRelationship : null,
      declared_at: new Date().toISOString(),
      review_status: "pending",
    });

    if (!error) {
      // Notify admins
      const { data: admins } = await supabase.from("profiles").select("id").in("role", ["admin"]);
      if (admins) {
        await Promise.all(admins.map(a =>
          supabase.from("notifications").insert({
            user_id: a.id,
            type: "step_changed",
            title: "Dichiarazione Ricevuta",
            body: `Nuova dichiarazione per "${deal.title}" (${deal.code})${hasConflict === "yes" ? " — CONFLITTO SEGNALATO" : ""}`,
            link: `/portal/deal-manage/${deal.id}`,
          })
        ));
      }
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Dichiarazione Completata</h2>
          <p className="text-sm text-slate-500 mb-6">La tua dichiarazione per <strong>{deal.title}</strong> è stata registrata con successo.</p>
          <a href="/portal/my-deals" className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#b8962d] transition-colors">Torna ai tuoi deal &rarr;</a>
        </div>
      </div>
    );
  }

  const radioClass = "flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 cursor-pointer hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-colors";
  const radioActiveClass = "flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#D4AF37] bg-[#D4AF37]/5 cursor-pointer";
  const inputClass = "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors placeholder:text-slate-400";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <header className="mb-8 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Dichiarazione Obbligatoria</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{deal.title}</h1>
        <p className="text-xs text-slate-400">{deal.code} · {deal.sector}</p>
        <p className="text-sm text-slate-500 mt-3">Completa questa dichiarazione per confermare il tuo ruolo e segnalare eventuali mandati o conflitti di interesse relativi a questa operazione.</p>
      </header>

      <div className="space-y-8">
        {/* A) Ruolo nel deal */}
        <section>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Ruolo nel deal</h3>
          <div className="space-y-2">
            {roleOptions.map(opt => (
              <label key={opt.value} className={roleInDeal === opt.value ? radioActiveClass : radioClass}>
                <input type="radio" name="role" value={opt.value} checked={roleInDeal === opt.value} onChange={() => setRoleInDeal(opt.value)} className="accent-[#D4AF37]" />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* B) Mandato / Fee */}
        <section>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Hai un mandato o accordo di fee con una delle parti?</h3>
          <div className="space-y-2">
            {mandateOptions.map(opt => (
              <label key={opt.value} className={hasMandate === opt.value ? radioActiveClass : radioClass}>
                <input type="radio" name="mandate" value={opt.value} checked={hasMandate === opt.value} onChange={() => setHasMandate(opt.value)} className="accent-[#D4AF37]" />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {noMandateSelected && (
            <div className="mt-4 flex gap-3 items-start border border-[#D4AF37] bg-[#D4AF37]/5 rounded-xl px-4 py-3.5">
              <AlertTriangle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700 leading-relaxed">
                Per procedere è necessario disporre di un mandato o accordo, anche generico, con una delle parti coinvolte. Contatta l&apos;originator o l&apos;admin per ottenere un mandato e caricalo prima di proseguire.
              </p>
            </div>
          )}
        </section>

        {/* C) Con chi? */}
        {hasMandateAgreement && (
          <section>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Con chi?</h3>
            <div className="space-y-2">
              {counterpartyOptions.map(opt => (
                <label key={opt.value} className={mandateCounterparty === opt.value ? radioActiveClass : radioClass}>
                  <input type="radio" name="counterparty" value={opt.value} checked={mandateCounterparty === opt.value} onChange={() => setMandateCounterparty(opt.value)} className="accent-[#D4AF37]" />
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {/* D) Quale fee? */}
        {hasMandateAgreement && (
          <section>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Quale fee?</h3>
            <div className="space-y-2">
              {feeTypeOptions.map(opt => (
                <label key={opt.value} className={mandateFeeType === opt.value ? radioActiveClass : radioClass}>
                  <input type="radio" name="feeType" value={opt.value} checked={mandateFeeType === opt.value} onChange={() => setMandateFeeType(opt.value)} className="accent-[#D4AF37]" />
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {(mandateFeeType === "percentage" || mandateFeeType === "fixed") && (
              <div className="mt-3">
                <input
                  type="text"
                  value={mandateFeeValue}
                  onChange={e => setMandateFeeValue(e.target.value)}
                  placeholder={mandateFeeType === "percentage" ? "es. 2.5%" : "es. €50,000"}
                  className={inputClass}
                />
              </div>
            )}
          </section>
        )}

        {/* E) Chain mandate */}
        {hasMandateAgreement && (
          <section>
            <label className={radioClass + " mb-3"}>
              <input type="checkbox" checked={isChainMandate} onChange={e => setIsChainMandate(e.target.checked)} className="accent-[#D4AF37] w-4 h-4" />
              <span className="text-sm text-slate-700">Il mandato è di un terzo che me lo ha conferito</span>
            </label>
            {isChainMandate && (
              <div className="space-y-3 pl-2 border-l-2 border-[#D4AF37]/20 ml-2">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Nome mandante</label>
                  <input type="text" value={chainName} onChange={e => setChainName(e.target.value)} className={inputClass} placeholder="Nome e cognome" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Società</label>
                  <input type="text" value={chainCompany} onChange={e => setChainCompany(e.target.value)} className={inputClass} placeholder="Ragione sociale" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Contatto</label>
                  <input type="text" value={chainContact} onChange={e => setChainContact(e.target.value)} className={inputClass} placeholder="Email o telefono" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Tipo rapporto</label>
                  <div className="space-y-2">
                    {chainRelationshipOptions.map(opt => (
                      <label key={opt.value} className={chainRelationship === opt.value ? radioActiveClass : radioClass}>
                        <input type="radio" name="chainRelationship" value={opt.value} checked={chainRelationship === opt.value} onChange={() => setChainRelationship(opt.value)} className="accent-[#D4AF37]" />
                        <span className="text-sm text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* F) Conflitto di interessi */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-[#D4AF37]">Conflitto di interessi</h3>
            <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-[#001220] text-white text-xs leading-relaxed p-4 rounded-xl shadow-xl z-50">
                  Sussiste conflitto quando un partecipante ha interessi personali, professionali o economici che potrebbero influenzare il proprio giudizio nell&apos;ambito dell&apos;operazione. Esempi: relazioni familiari o societarie con la controparte, partecipazioni nel target, mandati paralleli, rapporti debitori/creditori. In caso di dubbio, è sempre preferibile segnalare.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#001220]" />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className={hasConflict === "no" ? radioActiveClass : radioClass}>
              <input type="radio" name="conflict" value="no" checked={hasConflict === "no"} onChange={() => setHasConflict("no")} className="accent-[#D4AF37]" />
              <span className="text-sm text-slate-700">Dichiaro di non avere conflitti di interesse</span>
            </label>
            <label className={hasConflict === "yes" ? radioActiveClass : radioClass}>
              <input type="radio" name="conflict" value="yes" checked={hasConflict === "yes"} onChange={() => setHasConflict("yes")} className="accent-[#D4AF37]" />
              <span className="text-sm text-slate-700">Segnalo un potenziale conflitto</span>
            </label>
          </div>
          {hasConflict === "yes" && (
            <div className="mt-3">
              <textarea
                value={conflictDetails}
                onChange={e => setConflictDetails(e.target.value)}
                placeholder="Descrivi il potenziale conflitto di interesse..."
                rows={3}
                className={inputClass}
              />
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full bg-[#D4AF37] text-white py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Invio in corso..." : "Conferma Dichiarazione"}
          </button>
        </div>
      </div>
    </div>
  );
}
