import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import RichTextEditor from '../../components/admin/RichTextEditor';

const PAGE_CONFIG = {
  home: {
    title: 'Home',
    sections: [
      {
        label: 'Seção História',
        fields: [
          { key: 'historia_titulo',    label: 'Título principal',       type: 'text' },
          { key: 'historia_subtitulo', label: 'Subtítulo (laranja)',    type: 'text' },
          { key: 'historia_texto_1',   label: 'Parágrafo de história',  type: 'richtext' },
          { key: 'historia_imagem',    label: 'Foto lateral',           type: 'image' },
        ],
      },
      {
        label: 'Nossas Linhas — imagens das marcas',
        fields: [
          { key: 'marca_tradicionais_imagem', label: 'Linha Tradicionais', type: 'image' },
          { key: 'marca_calciolax_imagem',    label: 'Família Calciolax',  type: 'image' },
          { key: 'marca_movimex_imagem',      label: 'Movimex',            type: 'image' },
          { key: 'marca_oleos_imagem',        label: 'Óleos Sobral',       type: 'image' },
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
        label: 'Seção História',
        fields: [
          { key: 'historia_titulo',      label: 'Título principal',                  type: 'text' },
          { key: 'historia_subtitulo',   label: 'Subtítulo (laranja)',               type: 'text' },
          { key: 'historia_texto_1',     label: 'Parágrafo introdutório',            type: 'richtext' },
          { key: 'historia_subtitulo_2', label: 'Subtítulo "Um pouco de história"',  type: 'text' },
          { key: 'historia_texto_2',     label: 'Parágrafo 2 (1911...)',             type: 'richtext' },
          { key: 'historia_texto_3',     label: 'Parágrafo 3 (negócio cresceu...)',  type: 'richtext' },
          { key: 'historia_texto_4',     label: 'Parágrafo 4 (1973...)',             type: 'richtext' },
          { key: 'historia_imagem',      label: 'Foto da fachada',                  type: 'image' },
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
          { key: 'unidade_fabril',       label: 'Unidade Fabril (endereço + telefone)',      type: 'richtext' },
          { key: 'escritorio_comercial', label: 'Escritório Comercial (endereço + telefone)', type: 'richtext' },
          { key: 'marketing_telefone',   label: 'Marketing — Telefone',                      type: 'text' },
          { key: 'marketing_email',      label: 'Marketing — E-mail',                        type: 'text' },
          { key: 'atendimento_telefone', label: 'Atendimento — Telefone',                    type: 'text' },
          { key: 'sac',                  label: 'SAC',                                       type: 'text' },
        ],
      },
    ],
  },
};

export default function AdminContentPage({ page }) {
  const { token } = useAuth();
  const [content,   setContent]   = useState({});
  const [saving,    setSaving]    = useState({});
  const [saved,     setSaved]     = useState({});
  const [uploading, setUploading] = useState({});

  const authHeaders = { Authorization: `Bearer ${token}` };
  const config = PAGE_CONFIG[page];

  useEffect(() => {
    fetch(`/api/admin/content/${page}`, { headers: authHeaders })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(rows => {
        const map = {};
        rows.forEach(r => { map[r.key] = r.value || ''; });
        setContent(map);
      })
      .catch(() => {});
  }, [page]);

  const saveField = async (key, value) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await fetch(`/api/admin/content/${page}/${key}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      setSaved(s => ({ ...s, [key]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000);
    } catch { /* silent */ } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const handleImageUpload = async (key, file) => {
    setUploading(u => ({ ...u, [key]: true }));
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(c => ({ ...c, [key]: data.url }));
      await saveField(key, data.url);
    } catch { /* silent */ } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  if (!config) return <div className="p-8 text-muted">Página não configurada.</div>;

  return (
    <div className="p-8 max-w-[720px]">
      <h1 className="text-[24px] font-[800] text-ink mb-1">{config.title}</h1>
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
                      onChange={e => setContent(c => ({ ...c, [field.key]: e.target.value }))}
                      onBlur={e => saveField(field.key, e.target.value)}
                      className="flex-1 border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange"
                    />
                    {saving[field.key] && <span className="text-[12px] text-muted">Salvando...</span>}
                    {saved[field.key]  && <span className="text-[12px] text-green-600">✓ Salvo</span>}
                  </div>
                )}

                {field.type === 'richtext' && (
                  <div>
                    <RichTextEditor
                      value={content[field.key] || ''}
                      onChange={val => setContent(c => ({ ...c, [field.key]: val }))}
                    />
                    <div className="flex justify-end items-center gap-2 mt-2">
                      {saving[field.key] && <span className="text-[12px] text-muted">Salvando...</span>}
                      {saved[field.key]  && <span className="text-[12px] text-green-600">✓ Salvo</span>}
                      <button
                        type="button"
                        onClick={() => saveField(field.key, content[field.key] || '')}
                        disabled={saving[field.key]}
                        className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-4 py-1.5 rounded-[6px] text-[12px] transition-colors disabled:opacity-60"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {field.type === 'image' && (
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={content[field.key] || ''}
                        onChange={e => setContent(c => ({ ...c, [field.key]: e.target.value }))}
                        onBlur={e => saveField(field.key, e.target.value)}
                        placeholder="/images/..."
                        className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[13px] outline-none focus:border-orange mb-2"
                      />
                      <div className="flex gap-2 items-center flex-wrap">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={e => e.target.files[0] && handleImageUpload(field.key, e.target.files[0])}
                          className="text-[12px] text-ink-light"
                        />
                        {uploading[field.key] && <span className="text-[12px] text-muted">Enviando...</span>}
                        {saved[field.key]     && <span className="text-[12px] text-green-600">✓ Salvo</span>}
                      </div>
                    </div>
                    {content[field.key] && (
                      <img src={content[field.key]} alt="" className="w-20 h-20 object-contain rounded border border-line flex-shrink-0" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
