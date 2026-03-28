/* ── Odara S&OP — Supabase Config ─────────────────────────────
   Edite com suas credenciais reais do projeto Supabase.
   Projeto: khqbimmcibutfrfmkoxr
   Settings → API → URL e anon public key
──────────────────────────────────────────────────────────── */

// Suporte a override via localStorage (configurável pela tela dados.html)
const SUPABASE_URL = localStorage.getItem('sb-url-override')
  || 'https://khqbimmcibutfrfmkoxr.supabase.co';

const SUPABASE_KEY = localStorage.getItem('sb-key-override')
  || 'YOUR_SUPABASE_ANON_KEY';   // ← substitua esta linha com sua chave real
