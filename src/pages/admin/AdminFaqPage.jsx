import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAdminFetch } from '../../hooks/useAdminFetch';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useAtalhoSalvar } from '../../hooks/useAtalhoSalvar';
import ConfirmModal from '../../components/admin/ConfirmModal';
import RichTextEditor from '../../components/admin/RichTextEditor';

const EMPTY_FORM = { pergunta: '', resposta: '' };

export default function AdminFaqPage() {
  const { request } = useAdminFetch();

  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(null);  // null = lista, objeto = formulário
  const [editId,      setEditId]      = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [confirm,     setConfirm]     = useState(null);
  const [formInicial, setFormInicial] = useState(null);

  // Formulário aberto com algo alterado bloqueia a saída da página.
  const dirty = !!form && JSON.stringify(form) !== JSON.stringify(formInicial);
  const { bloqueio } = useUnsavedChanges(dirty && !saving);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await request('/api/admin/faq');
      if (!res) return;
      setItems(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setFormInicial({ ...EMPTY_FORM });
    setError('');
  };

  const openEdit = (item) => {
    setEditId(item.id);
    const carregado = { pergunta: item.pergunta, resposta: item.resposta };
    setForm(carregado);
    setFormInicial(carregado);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url    = editId ? `/api/admin/faq/${editId}` : '/api/admin/faq';
      const method = editId ? 'PUT' : 'POST';
      const res = await request(url, { method, body: JSON.stringify(form) });
      if (!res) { setSaving(false); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      toast.success(editId ? 'Pergunta atualizada' : 'Pergunta criada');
      setForm(null);
      setFormInicial(null);
      fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Só vale com o formulário aberto: no modo lista, Ctrl+S não faz nada.
  useAtalhoSalvar(() => {
    if (form && !saving) handleSave({ preventDefault: () => {} });
  }, !!form);

  const handleToggle = async (id) => {
    const res = await request(`/api/admin/faq/${id}/ativo`, { method: 'PATCH' });
    if (res?.ok) { toast.success('Status atualizado'); fetchAll(); }
    else toast.error('Erro ao atualizar status.');
  };

  const handleDelete = async () => {
    if (!confirm) return;
    const { id, pergunta } = confirm;
    setConfirm(null);
    const res = await request(`/api/admin/faq/${id}`, { method: 'DELETE' });
    if (res?.ok) { toast.success(`"${pergunta}" removida`); fetchAll(); }
    else toast.error('Erro ao remover.');
  };

  // Troca a posição de dois itens na lista e envia a nova ordem completa.
  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered);
    const res = await request('/api/admin/faq/reorder', {
      method: 'PUT',
      body: JSON.stringify({ ids: reordered.map(i => i.id) }),
    });
    if (!res?.ok) { toast.error('Erro ao reordenar.'); fetchAll(); }
  };

  return (
    <div className="p-4 md:p-8 max-w-[800px]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[24px] font-[800] text-ink">Perguntas Frequentes</h1>
        {!form && (
          <button onClick={openCreate} className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors">
            + Nova pergunta
          </button>
        )}
      </div>
      <p className="text-[13px] text-muted mb-6">Exibidas na página Fale Conosco, na ordem definida abaixo.</p>

      {/* Formulário */}
      {form && (
        <div className="bg-white border border-line rounded-[10px] p-5 mb-8">
          <h2 className="text-[16px] font-[700] text-ink mb-4">{editId ? 'Editar pergunta' : 'Nova pergunta'}</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-[8px] px-4 py-3">{error}</div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">Pergunta *</label>
              <input value={form.pergunta} onChange={e => setF('pergunta', e.target.value)} required
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange" />
            </div>

            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">Resposta *</label>
              <RichTextEditor value={form.resposta} onChange={val => setF('resposta', val)} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[13px] disabled:opacity-60 transition-colors">
                {saving ? 'Salvando...' : editId ? 'Salvar alterações' : 'Criar'}
              </button>
              <button type="button" onClick={() => setForm(null)}
                className="border border-line text-ink-light font-[600] px-5 py-2.5 rounded-[8px] text-[13px] hover:border-orange hover:text-orange transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-muted text-[14px]">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-muted text-[14px]">Nenhuma pergunta cadastrada.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={item.id} className="bg-white border border-line rounded-[10px] px-4 py-3 flex items-center gap-3">
              <div className="flex flex-col flex-shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="text-ink-light hover:text-orange disabled:opacity-25 disabled:cursor-not-allowed leading-none text-[14px]" aria-label="Mover para cima">▲</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1}
                  className="text-ink-light hover:text-orange disabled:opacity-25 disabled:cursor-not-allowed leading-none text-[14px]" aria-label="Mover para baixo">▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-[600] text-[14px] ${item.ativo ? 'text-ink' : 'text-muted line-through'}`}>{item.pergunta}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggle(item.id)}
                  className={`px-3 py-1 rounded-full text-[12px] font-[600] transition-colors ${
                    item.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}>
                  {item.ativo ? 'Ativa' : 'Inativa'}
                </button>
                <button onClick={() => openEdit(item)} className="text-orange hover:underline font-[600] text-[13px]">Editar</button>
                <button onClick={() => setConfirm({ id: item.id, pergunta: item.pergunta })} className="text-red-400 hover:underline font-[600] text-[13px]">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!bloqueio}
        danger={false}
        title="Sair sem salvar?"
        message="Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas."
        confirmLabel="Sair sem salvar"
        onConfirm={() => bloqueio.confirmar()}
        onCancel={() => bloqueio.cancelar()}
      />

      <ConfirmModal
        open={!!confirm}
        title="Excluir pergunta"
        message={`Tem certeza que deseja excluir "${confirm?.pergunta}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
