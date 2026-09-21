import { useState, useEffect, useCallback } from 'react';
import { useAdminFetch } from '../../hooks/useAdminFetch';

const ENTIDADES = {
  product:    'Produto',
  category:   'Categoria',
  content:    'Conteúdo',
  hero_slide: 'Slide',
  misturinha: 'Misturinha',
  image:      'Imagem',
  user:       'Usuário',
};

const ACOES = {
  create:  { label: 'Criou',     cor: 'bg-green-100 text-green-700' },
  update:  { label: 'Alterou',   cor: 'bg-blue-50 text-blue-600' },
  delete:  { label: 'Excluiu',   cor: 'bg-red-50 text-red-600' },
  restore: { label: 'Restaurou', cor: 'bg-[#FFF4EB] text-orange' },
  login:   { label: 'Entrou',    cor: 'bg-[#F0F0F0] text-ink-light' },
};

// Um valor de auditoria pode ser texto, booleano ou o objeto inteiro da linha.
// Aqui só interessa um resumo legível de uma linha.
function resumir(valor) {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'string') return valor.replace(/<[^>]*>/g, '').slice(0, 120) || '(vazio)';
  if (typeof valor === 'boolean') return valor ? 'sim' : 'não';
  if (typeof valor === 'object' && valor.truncado) return `(conteúdo grande, ${valor.tamanho} bytes)`;
  if (typeof valor === 'object') return JSON.stringify(valor).slice(0, 120);
  return String(valor);
}

export default function AdminHistoricoPage() {
  const { request } = useAdminFetch();
  const [linhas,     setLinhas]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [entidade,   setEntidade]   = useState('');
  const [loading,    setLoading]    = useState(true);
  const [aberta,     setAberta]     = useState(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 25 });
    if (entidade) params.set('entidade', entidade);
    try {
      const res = await request(`/api/admin/audit?${params}`);
      if (!res) return;
      const json = await res.json();
      setLinhas(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } catch {
      // listagem silenciosa, como nas outras telas do painel
    } finally {
      setLoading(false);
    }
  }, [page, entidade, request]);

  useEffect(() => { buscar(); }, [buscar]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-[22px] md:text-[24px] font-[800] text-ink">Histórico</h1>
      <p className="text-[13px] text-muted mb-6">
        {total} alteraç{total !== 1 ? 'ões' : 'ão'} registrada{total !== 1 ? 's' : ''}.
        Para desfazer um texto de página, use o histórico do próprio campo em Conteúdo.
      </p>

      <select
        value={entidade}
        onChange={e => { setEntidade(e.target.value); setPage(1); }}
        aria-label="Filtrar por tipo"
        className="border border-line rounded-[8px] px-3 py-2 text-[13px] bg-white outline-none focus:border-orange mb-5"
      >
        <option value="">Tudo</option>
        {Object.entries(ENTIDADES).map(([id, label]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>

      {loading ? (
        <div className="bg-white rounded-[10px] border border-line overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-line last:border-0">
              <div className="h-3 w-1/2 bg-[#EEE] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : linhas.length === 0 ? (
        <div className="bg-white border border-line rounded-[10px] py-16 text-center">
          <p className="text-[15px] font-[700] text-ink mb-1">Nada registrado ainda</p>
          <p className="text-[13px] text-muted">As alterações feitas no painel aparecem aqui.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-line overflow-hidden">
          {linhas.map(l => {
            const acao = ACOES[l.acao] || { label: l.acao, cor: 'bg-[#F0F0F0] text-ink-light' };
            const expandida = aberta === l.id;
            return (
              <div key={l.id} className="border-b border-line last:border-0">
                <button
                  onClick={() => setAberta(expandida ? null : l.id)}
                  aria-expanded={expandida}
                  className="w-full text-left px-4 py-3 hover:bg-[#FAFAFA] transition-colors flex flex-wrap items-center gap-2"
                >
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-[700] ${acao.cor}`}>
                    {acao.label}
                  </span>
                  <span className="text-[13px] font-[600] text-ink">
                    {ENTIDADES[l.entidade] || l.entidade}
                    {l.entidade_id ? ` · ${l.entidade_id}` : ''}
                    {l.campo ? ` · ${l.campo}` : ''}
                  </span>
                  <span className="text-[12px] text-muted ml-auto">
                    {l.user_email} · {new Date(l.criado_em).toLocaleString('pt-BR')}
                  </span>
                </button>
                {expandida && (
                  <div className="px-4 pb-4 grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-[700] text-muted uppercase tracking-[.6px] mb-1">Antes</div>
                      <div className="text-[13px] text-ink-light bg-[#FAFAFA] border border-line rounded-[6px] p-2 break-words">
                        {resumir(l.valor_anterior)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-[700] text-muted uppercase tracking-[.6px] mb-1">Depois</div>
                      <div className="text-[13px] text-ink-light bg-[#FAFAFA] border border-line rounded-[6px] p-2 break-words">
                        {resumir(l.valor_novo)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-6 items-center">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-line rounded-[8px] text-[13px] font-[600] text-ink-light disabled:opacity-40 hover:border-orange hover:text-orange transition-colors"
          >
            Anterior
          </button>
          <span className="text-[13px] text-muted">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-line rounded-[8px] text-[13px] font-[600] text-ink-light disabled:opacity-40 hover:border-orange hover:text-orange transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
