import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAdminFetch } from '../../hooks/useAdminFetch';
import ConfirmModal from '../../components/admin/ConfirmModal';

export default function AdminCategoriesPage() {
  const { request } = useAdminFetch();

  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [newId,      setNewId]      = useState('');
  const [newLabel,   setNewLabel]   = useState('');
  const [newOrdem,   setNewOrdem]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const [editId,     setEditId]     = useState(null);
  const [editLabel,  setEditLabel]  = useState('');
  const [editOrdem,  setEditOrdem]  = useState(0);
  const [editSaving, setEditSaving] = useState(false);

  const [confirm,    setConfirm]    = useState(null);

  const fetchCategories = () => {
    setLoading(true);
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res  = await request('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ id: newId.trim(), label: newLabel.trim(), ordem: Number(newOrdem) || 99 }),
      });
      if (!res) { setSaving(false); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar.');
      toast.success(`Categoria "${newLabel.trim()}" criada`);
      setNewId(''); setNewLabel(''); setNewOrdem('');
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setEditLabel(c.label);
    setEditOrdem(c.ordem);
  };

  const handleEdit = async () => {
    setEditSaving(true);
    setError('');
    try {
      const res  = await request(`/api/admin/categories/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({ label: editLabel.trim(), ordem: Number(editOrdem) }),
      });
      if (!res) { setEditSaving(false); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      toast.success('Categoria atualizada');
      setEditId(null);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    const { id, label } = confirm;
    setConfirm(null);
    try {
      const res  = await request(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover.');
      toast.success(`Categoria "${label}" removida`);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[720px]">
      <h1 className="text-[24px] font-[800] text-ink mb-6">Categorias</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-[8px] px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white border border-line rounded-[10px] p-5 mb-6">
        <h2 className="text-[15px] font-[700] text-ink mb-4">Nova categoria</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_80px] gap-3">
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">ID (slug)</label>
              <input
                value={newId}
                onChange={e => setNewId(e.target.value)}
                required
                placeholder="ex: fitoterapia"
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">Label</label>
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                required
                placeholder="ex: Fitoterapia"
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">Ordem</label>
              <input
                type="number"
                value={newOrdem}
                onChange={e => setNewOrdem(e.target.value)}
                placeholder="99"
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="self-start bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2 rounded-[8px] text-[13px] transition-colors disabled:opacity-60"
          >
            {saving ? 'Criando...' : '+ Criar'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-muted text-[14px]">Carregando...</div>
      ) : (
        <>
          {/* Desktop: tabela */}
          <div className="hidden md:block bg-white border border-line rounded-[10px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-[#FAFAFA] text-left">
                  <th className="px-4 py-3 font-[700] text-ink-light">ID</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Label</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Ordem</th>
                  <th className="px-4 py-3 font-[700] text-ink-light text-right">Produtos</th>
                  <th className="px-4 py-3 font-[700] text-ink-light"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 font-mono text-ink-light">{c.id}</td>
                    <td className="px-4 py-3">
                      {editId === c.id ? (
                        <input
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          autoFocus
                          className="border border-orange rounded-[6px] px-2 py-1 text-[13px] outline-none w-full"
                        />
                      ) : (
                        <span className="font-[600] text-ink">{c.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editId === c.id ? (
                        <input
                          type="number"
                          value={editOrdem}
                          onChange={e => setEditOrdem(e.target.value)}
                          className="border border-orange rounded-[6px] px-2 py-1 text-[13px] outline-none w-16"
                        />
                      ) : (
                        <span className="text-ink-light">{c.ordem}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.id !== 'all' && (
                        <span className="text-[12px] font-[600] text-ink-light bg-[#F5F5F5] rounded-full px-2 py-0.5">
                          {c.product_count ?? 0}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.id !== 'all' && (
                        <div className="flex items-center gap-3">
                          {editId === c.id ? (
                            <>
                              <button
                                onClick={handleEdit}
                                disabled={editSaving}
                                className="text-green-600 hover:underline font-[600] disabled:opacity-60"
                              >
                                {editSaving ? 'Salvando...' : 'Salvar'}
                              </button>
                              <button onClick={() => setEditId(null)} className="text-muted hover:text-ink-light">
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(c)} className="text-orange hover:underline font-[600]">
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirm({ id: c.id, label: c.label })}
                                className="text-red-400 hover:underline font-[600]"
                              >
                                Deletar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden flex flex-col gap-3">
            {categories.map(c => (
              <div key={c.id} className="bg-white rounded-[10px] border border-line p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    {editId === c.id ? (
                      <input
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        autoFocus
                        className="border border-orange rounded-[6px] px-2 py-1 text-[13px] outline-none w-full mb-1"
                      />
                    ) : (
                      <p className="font-[700] text-ink mb-0.5">{c.label}</p>
                    )}
                    <p className="font-mono text-[12px] text-muted truncate">{c.id}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {c.id !== 'all' && (
                      <span className="text-[11px] font-[600] text-ink-light bg-[#F5F5F5] rounded-full px-2 py-0.5">
                        {c.product_count ?? 0} produtos
                      </span>
                    )}
                    <span className="text-[11px] text-ink-light bg-[#FAFAFA] rounded px-2 py-1">
                      Ordem: {editId === c.id ? (
                        <input type="number" value={editOrdem} onChange={e => setEditOrdem(e.target.value)} className="w-10 outline-none border-b border-orange" />
                      ) : c.ordem}
                    </span>
                  </div>
                </div>
                {c.id !== 'all' && (
                  <div className="flex gap-3">
                    {editId === c.id ? (
                      <>
                        <button onClick={handleEdit} disabled={editSaving} className="text-green-600 hover:underline font-[600] text-[13px] disabled:opacity-60">
                          {editSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button onClick={() => setEditId(null)} className="text-muted text-[13px]">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(c)} className="text-orange hover:underline font-[600] text-[13px]">Editar</button>
                        <button onClick={() => setConfirm({ id: c.id, label: c.label })} className="text-red-400 hover:underline font-[600] text-[13px]">Deletar</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        open={!!confirm}
        title="Remover categoria"
        message={`Tem certeza que deseja remover a categoria "${confirm?.label}"? Esta ação só é possível se não houver produtos vinculados.`}
        confirmLabel="Remover"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
