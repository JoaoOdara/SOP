/* ── Odara S&OP — Supabase Config ─────────────────────────────
   Edite com suas credenciais reais do projeto Supabase.
   Projeto: khqbimmcibutfrfmkoxr
   Settings → API → URL e anon public key
──────────────────────────────────────────────────────────── */

// Suporte a override via localStorage (configurável pela tela dados.html)
const SUPABASE_URL = localStorage.getItem('sb-url-override')
  || 'https://khqbimmcibutfrfmkoxr.supabase.co';

const SUPABASE_KEY = localStorage.getItem('sb-key-override')
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtocWJpbW1jaWJ1dGZyZm1rb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTY1NjUsImV4cCI6MjA4OTkzMjU2NX0.w3vRAPhiU7Zavgkiv-ldjbHc_UJeGH9ck2tq_YN6MBo';   // ← substitua esta linha com sua chave real
