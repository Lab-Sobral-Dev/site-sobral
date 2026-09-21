import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useAdminFetch } from '../../hooks/useAdminFetch';

const PAPEIS = { admin: 'Administrador', editor: 'Editor' };
const SENHA_MINIMA = 8;

export default function AdminContaPage() {
  const { user } = useAuth();
  const { request } = useAdminFetch();

  const [atual,      setAtual]      = useState('');
  const [nova,       setNova]       = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [salvando,   setSalvando]   = useState(false);
  const [error,      setError]      = useState('');

  const trocar = async (e) => {
    e.preventDefault();
    setError('');

    // Validação no cliente é conveniência; o backend valida de novo.
    if (nova.length < SENHA_MINIMA) {
      setError(`A nova senha precisa de ao menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (nova !== confirmacao) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }

    setSalvando(true);
    try {
      const res = await request('/api/admin/users/me/senha', {
        method: 'PUT',
        body: JSON.stringify({ senha_atual: atual, senha_nova: nova }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao trocar a senha.');
      toast.success('Senha alterada');
      setAtual(''); setNova(''); setConfirmacao('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const campo = "w-full border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange";

  return (
    <div className="p-4 md:p-8 max-w-[520px]">
      <h1 className="text-[22px] md:text-[24px] font-[800] text-ink mb-6">Minha conta</h1>

      <div className="bg-white border border-line rounded-[10px] p-4 mb-6">
        <div className="flex justify-between items-center py-1">
          <span className="text-[13px] text-muted">E-mail</span>
          <span className="text-[14px] font-[600] text-ink">{user?.email}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-[13px] text-muted">Papel</span>
          <span className="text-[14px] font-[600] text-ink">{PAPEIS[user?.papel] || '—'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-[8px] px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={trocar} className="bg-white border border-line rounded-[10px] p-4 flex flex-col gap-4">
        <div className="text-[11px] font-[700] text-orange tracking-[.6px] uppercase">Trocar senha</div>

        <div>
          <label htmlFor="senha-atual" className="block text-[13px] font-[600] text-ink-light mb-1">Senha atual</label>
          <input
            id="senha-atual" type="password" required autoComplete="current-password"
            value={atual} onChange={e => setAtual(e.target.value)} className={campo}
          />
        </div>

        <div>
          <label htmlFor="senha-nova" className="block text-[13px] font-[600] text-ink-light mb-1">
            Nova senha (mín. {SENHA_MINIMA} caracteres)
          </label>
          <input
            id="senha-nova" type="password" required minLength={SENHA_MINIMA} autoComplete="new-password"
            value={nova} onChange={e => setNova(e.target.value)} className={campo}
          />
        </div>

        <div>
          <label htmlFor="senha-conf" className="block text-[13px] font-[600] text-ink-light mb-1">Confirme a nova senha</label>
          <input
            id="senha-conf" type="password" required autoComplete="new-password"
            value={confirmacao} onChange={e => setConfirmacao(e.target.value)} className={campo}
          />
        </div>

        <button
          type="submit" disabled={salvando}
          className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors disabled:opacity-60 self-start"
        >
          {salvando ? 'Salvando...' : 'Trocar senha'}
        </button>
      </form>
    </div>
  );
}
