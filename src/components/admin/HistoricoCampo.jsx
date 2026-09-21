import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminFetch } from '../../hooks/useAdminFetch';

function resumo(valor) {
  if (valor === null || valor === undefined) return '(vazio)';
  if (typeof valor === 'string') return valor.replace(/<[^>]*>/g, '').slice(0, 160) || '(vazio)';
  if (typeof valor === 'object' && valor.truncado) return '(conteúdo grande)';
  return String(valor);
}

// Últimos valores de um campo do CMS, com botão de restaurar. É a rede de
// segurança para um texto sobrescrito por engano. O que se restaura é o valor
// ANTERIOR de cada linha: "voltar para o que estava antes desta alteração".
export default function HistoricoCampo({ page, chave, aoRestaurar }) {
  const { request } = useAdminFetch();
  const [aberto,  setAberto]  = useState(false);
  const [linhas,  setLinhas]  = useState([]);
  const [loading, setLoading] = useState(false);

  const abrir = async () => {
    if (aberto) { setAberto(false); return; }
    setAberto(true);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        entidade: 'content', entidade_id: page, campo: chave, per_page: 10,
      });
      const res = await request(`/api/admin/audit?${params}`);
      if (!res) return;
      const json = await res.json();
      setLinhas(json.data || []);
    } catch {
      toast.error('Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  };

  const restaurar = async (id) => {
    const res = await request(`/api/admin/audit/${id}/restore`, { method: 'POST' });
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error || 'Erro ao restaurar.'); return; }
    toast.success('Valor restaurado');
    aoRestaurar(data.value);
    setAberto(false);
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={abrir}
        aria-expanded={aberto}
        className="text-[12px] font-[600] text-muted hover:text-orange transition-colors"
      >
        {aberto ? 'Fechar histórico' : 'Histórico'}
      </button>

      {aberto && (
        <div className="mt-2 border border-line rounded-[8px] divide-y divide-[#eee]">
          {loading ? (
            <div className="px-3 py-2 text-[12px] text-muted">Carregando...</div>
          ) : linhas.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-muted">Nenhuma alteração registrada neste campo.</div>
          ) : (
            linhas.map(l => (
              <div key={l.id} className="px-3 py-2 flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-ink truncate">{resumo(l.valor_anterior)}</div>
                  <div className="text-[11px] text-muted">
                    {l.user_email} · {new Date(l.criado_em).toLocaleString('pt-BR')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => restaurar(l.id)}
                  className="text-[12px] font-[700] text-orange hover:underline flex-shrink-0"
                >
                  Restaurar
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
