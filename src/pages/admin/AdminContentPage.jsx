import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAdminFetch } from '../../hooks/useAdminFetch';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import ConfirmModal from '../../components/admin/ConfirmModal';
import RichTextEditor from '../../components/admin/RichTextEditor';
import HistoricoCampo from '../../components/admin/HistoricoCampo';

// Indicador de estado de um campo. O estado 'erro' é PERSISTENTE de propósito:
// antes, uma falha virava um toast de 3s e o campo continuava na tela
// parecendo salvo.
function StatusCampo({ estado, onTentarDeNovo }) {
  if (estado === 'saving') return <span className="text-[12px] text-muted">Salvando...</span>;
  if (estado === 'salvo')  return <span className="text-[12px] text-green-600">✓ Salvo</span>;
  if (estado === 'dirty')  return <span className="text-[12px] text-muted">Não salvo</span>;
  if (estado === 'erro')   return (
    <span className="text-[12px] text-red-600 font-[600] flex items-center gap-2">
      Não salvo
      <button type="button" onClick={onTentarDeNovo} className="underline hover:no-underline">
        Tentar de novo
      </button>
    </span>
  );
  return null;
}

const PAGE_URLS = { home: '/', sobre: '/quem-somos', contato: '/fale-conosco' };

const PAGE_CONFIG = {
  home: {
    title: 'Home',
    sections: [
      {
        label: 'Nossas Linhas',
        fields: [
          { key: 'linhas_eyebrow',            label: 'Eyebrow (ex: FAMÍLIAS DE PRODUTOS)', type: 'text' },
          { key: 'linhas_titulo',             label: 'Título da seção',                    type: 'text' },
          { key: 'marca_tradicionais_imagem', label: 'Linha Tradicionais',                 type: 'image' },
          { key: 'marca_calciolax_imagem',    label: 'Família Calciolax',                  type: 'image' },
          { key: 'marca_movimex_imagem',      label: 'Movimex',                            type: 'image' },
          { key: 'marca_oleos_imagem',        label: 'Óleos Sobral',                       type: 'image' },
        ],
      },
      {
        label: 'Produtos Mais Vendidos',
        fields: [
          { key: 'vendidos_eyebrow', label: 'Eyebrow (ex: OS PREFERIDOS)',  type: 'text' },
          { key: 'vendidos_titulo',  label: 'Título da seção',              type: 'text' },
        ],
      },
      {
        label: 'Seção História',
        fields: [
          { key: 'historia_eyebrow',   label: 'Eyebrow (ex: DESDE 1911)',     type: 'text' },
          { key: 'historia_titulo',    label: 'Título principal',              type: 'text' },
          { key: 'historia_subtitulo', label: 'Subtítulo (laranja, itálico)', type: 'text' },
          { key: 'historia_texto_1',   label: 'Parágrafo de história',        type: 'richtext' },
          { key: 'historia_imagem',    label: 'Foto lateral',                 type: 'image' },
        ],
      },
    ],
  },
  sobre: {
    title: 'Quem Somos',
    sections: [
      {
        label: 'Missão, Visão e Valores',
        fields: [
          { key: 'missao',  label: 'Missão',  type: 'richtext' },
          { key: 'visao',   label: 'Visão',   type: 'richtext' },
          { key: 'valores', label: 'Valores', type: 'richtext' },
        ],
      },
      {
        label: 'Nossa História — abertura',
        fields: [
          { key: 'historia_eyebrow',      label: 'Eyebrow (ex: UMA HISTÓRIA BRASILEIRA)', type: 'text' },
          { key: 'historia_intro_titulo', label: 'Título principal',                       type: 'text' },
          { key: 'historia_intro_sub',    label: 'Subtítulo (laranja)',                    type: 'text' },
          { key: 'historia_intro_texto',  label: 'Parágrafo de abertura',                  type: 'richtext' },
        ],
      },
      {
        label: 'Nossa História — corpo do texto',
        fields: [
          { key: 'historia_b1_titulo', label: 'Título 1 (ex: Um pouco de história…)',      type: 'text' },
          { key: 'historia_b1_texto',  label: 'Texto 1',                                   type: 'richtext' },
          { key: 'historia_destaque',  label: 'Frase de destaque (citação laranja)',       type: 'text' },
          { key: 'historia_b2_texto',  label: 'Texto 2 (a gente cuida de gente…)',         type: 'richtext' },
          { key: 'historia_b3_titulo', label: 'Título 2 (ex: O novo capítulo…)',           type: 'text' },
          { key: 'historia_b3_texto',  label: 'Texto 3',                                   type: 'richtext' },
          { key: 'historia_b4_titulo', label: 'Título 3 (ex: Mas, na prática…)',           type: 'text' },
          { key: 'historia_b4_texto',  label: 'Texto 4',                                   type: 'richtext' },
          { key: 'historia_imagem',    label: 'Foto da fachada',                           type: 'image' },
          { key: 'historia_b5_titulo', label: 'Título 4 (ex: Os novos produtos…)',         type: 'text' },
          { key: 'historia_b5_texto',  label: 'Texto 5 (com a lista de linhas)',           type: 'richtext' },
          { key: 'historia_b6_titulo', label: 'Título 5 (ex: Nossa história não acaba…)',  type: 'text' },
          { key: 'historia_b6_texto',  label: 'Texto 6 (encerramento)',                    type: 'richtext' },
        ],
      },
    ],
  },
  contato: {
    title: 'Fale Conosco',
    sections: [
      {
        label: 'Informações de contato',
        fields: [
          { key: 'sac_telefone',       label: 'SAC — Telefone',        type: 'text' },
          { key: 'sac_email',          label: 'SAC — E-mail',          type: 'text' },
          { key: 'marketing_telefone', label: 'Marketing — Telefone',  type: 'text' },
          { key: 'marketing_email',    label: 'Marketing — E-mail',    type: 'text' },
        ],
      },
      {
        // Apagar a pergunta OU a resposta remove o item do acordeão no site.
        label: 'Perguntas Frequentes',
        fields: [
          { key: 'faq_titulo', label: 'Título da seção', type: 'text' },
          ...[1, 2, 3, 4, 5, 6].flatMap(n => [
            { key: `faq_${n}_p`, label: `Pergunta ${n}`, type: 'text' },
            { key: `faq_${n}_r`, label: `Resposta ${n}`, type: 'richtext' },
          ]),
        ],
      },
    ],
  },
};

export default function AdminContentPage({ page }) {
  const { request } = useAdminFetch();
  const [content,    setContent]    = useState({});
  const [status,     setStatus]     = useState({});   // key -> idle|dirty|saving|salvo|erro
  const [valorSalvo, setValorSalvo] = useState({});   // key -> último valor confirmado pelo servidor
  const [uploading,  setUploading]  = useState({});

  const config = PAGE_CONFIG[page];

  const pendentes = Object.values(status).some(e => e === 'dirty' || e === 'erro');
  const { bloqueio } = useUnsavedChanges(pendentes);

  useEffect(() => {
    request(`/api/admin/content/${page}`)
      .then(r => {
        if (!r || !r.ok) throw new Error();
        return r.json();
      })
      .then(rows => {
        const map = {};
        rows.forEach(r => { map[r.key] = r.value || ''; });
        setContent(map);
        setValorSalvo(map);
        setStatus({});
      })
      .catch(() => {});
  }, [page]);

  const saveField = async (key, value) => {
    setStatus(s => ({ ...s, [key]: 'saving' }));
    try {
      const res = await request(`/api/admin/content/${page}/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      if (!res || !res.ok) throw new Error();
      setValorSalvo(v => ({ ...v, [key]: value }));
      setStatus(s => ({ ...s, [key]: 'salvo' }));
      setTimeout(() => setStatus(s => (s[key] === 'salvo' ? { ...s, [key]: 'idle' } : s)), 2000);
    } catch {
      setStatus(s => ({ ...s, [key]: 'erro' }));
      toast.error('Erro ao salvar. O campo ficou marcado como não salvo.');
    }
  };

  // Marca o campo como sujo assim que diverge do que está no servidor.
  const alterar = (key, valor) => {
    setContent(c => ({ ...c, [key]: valor }));
    setStatus(s => ({ ...s, [key]: valor === valorSalvo[key] ? 'idle' : 'dirty' }));
  };

  const handleImageUpload = async (key, file) => {
    setUploading(u => ({ ...u, [key]: true }));
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res  = await request('/api/upload', { method: 'POST', body: fd });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(c => ({ ...c, [key]: data.url }));
      await saveField(key, data.url);
    } catch {
      toast.error('Erro ao enviar imagem.');
    } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  if (!config) return <div className="p-8 text-muted">Página não configurada.</div>;

  return (
    <div className="p-4 md:p-8 max-w-[720px]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[24px] font-[800] text-ink">{config.title}</h1>
        {PAGE_URLS[page] && (
          <a
            href={PAGE_URLS[page]}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-[600] text-orange hover:underline flex items-center gap-1"
          >
            Ver página ↗
          </a>
        )}
      </div>
      <p className="text-[13px] text-muted mb-6">Alterações publicadas imediatamente no site.</p>

      {config.sections.map(section => (
        <div key={section.label} className="mb-8">
          <div className="text-[11px] font-[700] text-orange tracking-[.6px] uppercase mb-4">{section.label}</div>
          <div className="flex flex-col gap-4">
            {section.fields.map(field => (
              <div key={field.key} className="bg-white border border-line rounded-[10px] p-4">
                <label className="block text-[13px] font-[600] text-ink-light mb-2">{field.label}</label>

                {field.type === 'text' && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={content[field.key] || ''}
                      onChange={e => alterar(field.key, e.target.value)}
                      onBlur={e => saveField(field.key, e.target.value)}
                      className={`flex-1 border rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange ${
                        status[field.key] === 'erro' ? 'border-red-400' : 'border-line'
                      }`}
                    />
                    <StatusCampo
                      estado={status[field.key]}
                      onTentarDeNovo={() => saveField(field.key, content[field.key] || '')}
                    />
                  </div>
                )}

                {field.type === 'richtext' && (
                  <div>
                    <RichTextEditor
                      value={content[field.key] || ''}
                      onChange={val => alterar(field.key, val)}
                    />
                    <div className="flex justify-end items-center gap-2 mt-2">
                      <StatusCampo
                        estado={status[field.key]}
                        onTentarDeNovo={() => saveField(field.key, content[field.key] || '')}
                      />
                      <button
                        type="button"
                        onClick={() => saveField(field.key, content[field.key] || '')}
                        disabled={status[field.key] === 'saving'}
                        className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-4 py-1.5 rounded-[6px] text-[12px] transition-colors disabled:opacity-60"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {field.type === 'image' && (
                  <div className="flex flex-col md:flex-row gap-3 md:items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={content[field.key] || ''}
                        onChange={e => alterar(field.key, e.target.value)}
                        onBlur={e => saveField(field.key, e.target.value)}
                        placeholder="/images/..."
                        className={`w-full border rounded-[8px] px-4 py-2.5 text-[13px] outline-none focus:border-orange mb-2 ${
                          status[field.key] === 'erro' ? 'border-red-400' : 'border-line'
                        }`}
                      />
                      <div className="flex gap-2 items-center flex-wrap">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={e => e.target.files[0] && handleImageUpload(field.key, e.target.files[0])}
                          className="text-[12px] text-ink-light"
                        />
                        {uploading[field.key] && <span className="text-[12px] text-muted">Enviando...</span>}
                        <StatusCampo
                          estado={status[field.key]}
                          onTentarDeNovo={() => saveField(field.key, content[field.key] || '')}
                        />
                      </div>
                    </div>
                    {content[field.key] && (
                      <img src={content[field.key]} alt="" className="w-20 h-20 object-contain rounded border border-line flex-shrink-0" />
                    )}
                  </div>
                )}

                <HistoricoCampo
                  page={page}
                  chave={field.key}
                  aoRestaurar={(valor) => {
                    // Já está salvo no servidor: vai direto para 'salvo'.
                    setContent(c => ({ ...c, [field.key]: valor }));
                    setValorSalvo(v => ({ ...v, [field.key]: valor }));
                    setStatus(s => ({ ...s, [field.key]: 'salvo' }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <ConfirmModal
        open={!!bloqueio}
        danger={false}
        title="Sair sem salvar?"
        message="Há campos que não foram salvos. Se sair agora, as alterações serão perdidas."
        confirmLabel="Sair sem salvar"
        onConfirm={() => bloqueio.confirmar()}
        onCancel={() => bloqueio.cancelar()}
      />
    </div>
  );
}
