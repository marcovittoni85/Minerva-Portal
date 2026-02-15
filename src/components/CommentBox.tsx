"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function CommentBox({ dealId, userId }: { dealId: string, userId: string }) {
  const [comment, setComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSending(true);

    // Inseriamo con i nomi colonne nuovi
    const { error } = await supabase.from("deal_comments").insert({
      deal_id: dealId,
      user_id: userId,
      content: comment.trim(), 
      status: 'approved' // Lo mettiamo subito approved per testare che funzioni
    });

    if (!error) {
      setComment("");
      window.location.reload(); 
    } else {
      alert("Errore: " + error.message);
    }
    setIsSending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea 
        className="w-full p-3 border rounded-xl text-sm" 
        value={comment} 
        onChange={(e) => setComment(e.target.value)}
        placeholder="Scrivi un commento..."
      />
      <button className="bg-black text-white px-4 py-2 rounded-lg mt-2 text-sm">
        {isSending ? "Inviando..." : "Invia"}
      </button>
    </form>
  );
}