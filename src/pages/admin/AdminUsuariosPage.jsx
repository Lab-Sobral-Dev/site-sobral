import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useAdminFetch } from '../../hooks/useAdminFetch';
import ConfirmModal from '../../components/admin/ConfirmModal';

const PAPEIS = { admin: 'Administrador', editor: 'Editor' };

export default function AdminUsuariosPage() {
  const { request } = useAdminFetch();
  const { user } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const [novoNome,  setNovoNome]  = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoPapel, setNovoPapel] = useState('editor');
  const [salvando,  setSalvando]  = useState(false);

  const [editId,     setEditId]     = useState(null);
  const [editNome,   setEditNome]   = useState('');
  const [editPapel,  setEditPapel]  = useState('editor');
  const [editAtivo,  setEditAtivo]  = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  const [confirm, setConfirm] = useState(null);

  const souEu = (u) => u.email === user?.email;

  const buscar = async () => {
    setLoading(true);
    try {
      const res = await request('/api/admin/users');
      if (!res) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuários.');
      setUsuarios(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { buscar(); }, []);

  const criar = async (e) => {
    e.preventDefault();
    setError('');
    setSalvando(true);
    try {
      const res = await request('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          nome: novoNome.trim(), email: novoEmail.trim(),
          senha: novaSenha, papel: novoPapel,
        }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário.');
      toast.success(`Usuário "${data.nome}" criado`);
      setNovoNome(''); setNovoEmail(''); setNovaSenha(''); setNovoPapel('editor');
      buscar();
    } catch (err) {
      setError(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const iniciarEdicao = (u) => {
    setEditId(u.id);
    setEditNome(u.nome);
    setEditPapel(u.papel);
    setEditAtivo(u.ativo);
  };

  const salvarEdicao = async () => {
    setEditSaving(true);
    setError('');
    try {
      const res = await request(`/api/admin/users/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({ nome: editNome.trim(), papel: editPapel, ativo: editAtivo }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      toast.success('Usuário atualizado');
      setEditId(null);
      buscar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const excluir = async () => {
    if (!confirm) return;
    const { id, nome } = confirm;
    setConfirm(null);
    try {
      const res = await request(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir.');
      toast.success(`"${nome}" removido`);
      buscar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[860px]">
      <h1 className="text-[22px] md:text-[24px] font-[800] text-ink mb-1">Usuários</h1>
      <p className="text-[13px] text-muted mb-6">
        Quem pode entrar no painel. Desativar tira o acesso na hora, sem apagar o histórico da pessoa.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-[8px] px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={criar} className="bg-white border border-line rounded-[10px] p-4 mb-6">
        <div className="text-[11px] font-[700] text-orange tracking-[.6px] uppercase mb-3">Novo usuário</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text" required placeholder="Nome"
            value={novoNome} onChange={e => setNovoNome(e.target.value)}
            className="border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange"
          />
          <input
            type="email" required placeholder="E-mail"
            value={novoEmail} onChange={e => setNovoEmail(e.target.value)}
            className="border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange"
          />
          <input
            type="password" required minLength={8} placeholder="Senha (mín. 8 caracteres)"
            value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
            className="border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange"
          />
          <select
            value={novoPapel} onChange={e => setNovoPapel(e.target.value)}
            aria-label="Papel do novo usuário"
            className="border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange bg-white"
          >
            <option value="editor">Editor — tudo menos usuários</option>
            <option value="admin">Administrador — inclui usuários</option>
          </select>
        </div>
        <button
          type="submit" disabled={salvando}
          className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors disabled:opacity-60"
        >
          {salvando ? 'Criando...' : 'Criar usuário'}
        </button>
      </form>

      {loading ? (
        <div className="bg-white rounded-[10px] border border-line overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-line last:border-0">
              <div className="h-3 w-1/3 bg-[#EEE] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white border border-line rounded-[10px] py-12 text-center">
          <p className="text-[14px] text-muted">Nenhum usuário para mostrar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-line overflow-hidden">
          {usuarios.map(u => (
            <div key={u.id} className="border-b border-line last:border-0 px-4 py-3">
              {editId === u.id ? (
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <input
                    type="text" value={editNome} onChange={e => setEditNome(e.target.value)}
                    aria-label="Nome"
                    className="flex-1 border border-line rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-orange"
                  />
                  <select
                    value={editPapel} onChange={e => setEditPapel(e.target.value)}
                    aria-label="Papel"
                    className="border border-line rounded-[8px] px-3 py-2 text-[13px] bg-white outline-none focus:border-orange"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  {!souEu(u) && (
                    <label className="flex items-center gap-2 text-[13px] text-ink-light">
                      <input
                        type="checkbox" checked={editAtivo}
                        onChange={e => setEditAtivo(e.target.checked)}
                        className="w-4 h-4 accent-orange"
                      />
                      Ativo
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={salvarEdicao} disabled={editSaving}
                      className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-4 py-2 rounded-[8px] text-[13px] transition-colors disabled:opacity-60"
                    >
                      {editSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="border border-line text-ink-light font-[600] px-4 py-2 rounded-[8px] text-[13px] hover:border-orange hover:text-orange transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-[700] text-ink text-[14px]">
                      {u.nome}
                      {souEu(u) && <span className="text-muted font-[500]"> (você)</span>}
                    </p>
                    <p className="text-[12px] text-muted truncate">{u.email}</p>
                  </div>
                  <span className="text-[12px] text-ink-light">{PAPEIS[u.papel] || u.papel}</span>
                  <span className={`px-3 py-1 rounded-full text-[12px] font-[600] ${
                    u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                  }`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="text-[11px] text-muted hidden md:block">
                    {u.ultimo_login
                      ? `Último acesso: ${new Date(u.ultimo_login).toLocaleDateString('pt-BR')}`
                      : 'Nunca entrou'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => iniciarEdicao(u)}
                      className="text-orange hover:underline font-[600] text-[13px]"
                    >
                      Editar
                    </button>
                    {/* O backend já barra excluir a si mesmo; esconder o botão
                        evita oferecer algo que seria recusado. */}
                    {!souEu(u) && (
                      <button
                        onClick={() => setConfirm({ id: u.id, nome: u.nome })}
                        className="text-red-600 hover:underline font-[600] text-[13px]"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title="Excluir usuário"
        message={`Tem certeza que deseja excluir "${confirm?.nome}"? Para apenas tirar o acesso mantendo o histórico, use Editar e desmarque "Ativo".`}
        confirmLabel="Excluir"
        onConfirm={excluir}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
