import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ANIMATIONS = [
  { value: 'none',       label: 'Nenhuma'  },
  { value: 'fade',       label: 'Fade'     },
  { value: 'slide-up',   label: '↑ Up'     },
  { value: 'zoom',       label: '⊙ Zoom'   },
  { value: 'slide-left', label: '← Left'   },
];

const TRANSITIONS = [
  { value: 'fade',  label: 'Fade suave'    },
  { value: 'slide', label: 'Deslizamento'  },
  { value: 'cut',   label: 'Corte direto'  },
];

const DEFAULT_LAYERS = {
  logo: { image_url: '', x: 75, y: 12, width: 80, animation: 'fade',     delay: 0.3, visible: true },
  cta:  { text: 'Ver produtos', link: '/produtos', x: 50, y: 78, animation: 'slide-up', delay: 0.5, visible: true },
};

export default function AdminSlideBuilderPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { token } = useAuth();
  const location   = useLocation();
  const canvasRef  = useRef(null);
  const drag      = useRef(null);

  const [slide,      setSlide]      = useState(null);
  const [animado,    setAnimado]    = useState(false);
  const [layers,     setLayers]     = useState(DEFAULT_LAYERS);
  const [transition, setTransition] = useState('fade');
  const [selected,   setSelected]   = useState('logo');
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/admin/hero-slides', { headers: authHeaders })
      .then(r => r.json())
      .then(slides => {
        const s = slides.find(sl => sl.id === parseInt(id));
        if (!s) { navigate('/admin/hero-slides'); return; }
        setSlide(s);
        setAnimado(s.animado ?? false);
        const baseLayers = s.layers && Object.keys(s.layers).length > 0 ? s.layers : DEFAULT_LAYERS;
        const psdImport  = location.state?.psdImport;
        setLayers(psdImport ? {
          ...baseLayers,
          ...(psdImport.logo ? { logo: { ...baseLayers.logo, ...psdImport.logo } } : {}),
          ...(psdImport.cta  ? { cta:  { ...baseLayers.cta,  x: psdImport.cta.x, y: psdImport.cta.y } } : {}),
        } : baseLayers);
      })
      .catch(() => navigate('/admin/hero-slides'));

    fetch('/api/content/carousel')
      .then(r => r.json())
      .then(d => setTransition(d.transition ?? 'fade'))
      .catch(() => {});
  }, [id]);

  const updateLayer = useCallback((key, field, value) =>
    setLayers(l => ({ ...l, [key]: { ...l[key], [field]: value } })), []);

  const handleLayerPointerDown = (e, layerKey) => {
    e.stopPropagation();
    setSelected(layerKey);
    drag.current = {
      layer:  layerKey,
      startX: e.clientX,
      startY: e.clientY,
      origX:  layers[layerKey].x,
      origY:  layers[layerKey].y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e) => {
    if (!drag.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.startX) / rect.width)  * 100;
    const dy = ((e.clientY - drag.current.startY) / rect.height) * 100;
    const x  = Math.min(95, Math.max(5, drag.current.origX + dx));
    const y  = Math.min(95, Math.max(5, drag.current.origY + dy));
    setLayers(l => ({ ...l, [drag.current.layer]: { ...l[drag.current.layer], x, y } }));
  };

  const saveTransition = async (val) => {
    setTransition(val);
    await fetch('/api/admin/content/carousel/transition', {
      method:  'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ value: val }),
    }).catch(() => {});
  };

  const handleLogoUpload = async (file) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateLayer('logo', 'image_url', data.url);
    } catch { /* silent */ } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/hero-slides/${id}`, {
        method:  'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ animado, layers }),
      });
      navigate('/admin/hero-slides');
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  };

  if (!slide) return <div className="p-8 text-muted text-[14px]">Carregando...</div>;

  const selLayer = layers[selected];

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── PAINEL ESQUERDO ── */}
      <div className="w-[188px] bg-white border-r border-line flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Slide
        </div>

        <div className="px-4 py-3 border-b border-line">
          <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Transição global</div>
          <select
            value={transition}
            onChange={e => saveTransition(e.target.value)}
            className="w-full border border-line rounded-[6px] px-2 py-1.5 text-[12px] text-ink bg-white"
          >
            {TRANSITIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setAnimado(a => !a)}
              className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${animado ? 'bg-orange' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${animado ? 'right-0.5' : 'left-0.5'}`} />
            </button>
            <span className="text-[12px] font-[600] text-ink">{animado ? 'Animado' : 'Estático'}</span>
          </div>
        </div>

        <div className="px-4 py-3 flex-1">
          <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Camadas</div>
          {[
            { key: 'logo', label: 'Logo',      color: '#F37021' },
            { key: 'cta',  label: 'Botão CTA', color: '#10b981' },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              onClick={() => setSelected(key)}
              className={`flex items-center gap-2 py-2 px-2 rounded-[6px] cursor-pointer mb-1 ${selected === key ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[12px] font-[600] text-ink flex-1">{label}</span>
              <button
                onClick={e => { e.stopPropagation(); updateLayer(key, 'visible', !layers[key].visible); }}
                className="text-[14px] leading-none opacity-60 hover:opacity-100"
                title={layers[key].visible ? 'Ocultar' : 'Mostrar'}
              >
                {layers[key].visible ? '👁' : '🙈'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── CANVAS CENTRAL ── */}
      <div className="flex-1 flex flex-col bg-[#e5e7eb] min-w-0">
        <div className="bg-[#1f2937] px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] text-white/40 flex-1 truncate">{slide.image_url}</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-1.5 rounded-[7px] text-[12px] transition-colors disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => navigate('/admin/hero-slides')}
            className="text-white/50 hover:text-white text-[12px] font-[600]"
          >
            Cancelar
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div
            ref={canvasRef}
            className="relative w-full max-w-[720px] aspect-[16/7] bg-gray-800 rounded-[8px] overflow-hidden shadow-lg select-none"
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={() => { drag.current = null; }}
          >
            <img src={slide.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

            {/* Logo layer */}
            {layers.logo?.visible && (
              <div
                className={`absolute cursor-move rounded-[6px] border-2 overflow-hidden ${selected === 'logo' ? 'border-orange shadow-[0_0_0_2px_rgba(243,112,33,0.3)]' : 'border-white/50'}`}
                style={{
                  left:      `${layers.logo.x}%`,
                  top:       `${layers.logo.y}%`,
                  width:     `${layers.logo.width ?? 80}px`,
                  height:    `${layers.logo.width ?? 80}px`,
                  transform: 'translate(-50%,-50%)',
                }}
                onPointerDown={e => handleLayerPointerDown(e, 'logo')}
              >
                {layers.logo.image_url
                  ? <img src={layers.logo.image_url} alt="" className="w-full h-full object-contain" draggable={false} />
                  : <div className="w-full h-full flex items-center justify-center bg-white/20 text-white text-[9px] font-[700]">LOGO</div>
                }
              </div>
            )}

            {/* CTA layer */}
            {layers.cta?.visible && (
              <div
                className={`absolute cursor-move rounded-full border-2 ${selected === 'cta' ? 'border-orange shadow-[0_0_0_2px_rgba(243,112,33,0.3)]' : 'border-white/50'}`}
                style={{
                  left:      `${layers.cta.x}%`,
                  top:       `${layers.cta.y}%`,
                  transform: 'translate(-50%,-50%)',
                }}
                onPointerDown={e => handleLayerPointerDown(e, 'cta')}
              >
                <div className="bg-orange text-white font-[800] text-[11px] px-4 py-2 rounded-full whitespace-nowrap">
                  {layers.cta.text || 'Botão CTA'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO ── */}
      <div className="w-[172px] bg-white border-l border-line flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          {selected === 'logo' ? 'Logo' : 'Botão CTA'}
        </div>

        {selected === 'logo' && (
          <>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Imagem</div>
              {layers.logo.image_url && (
                <img src={layers.logo.image_url} alt="" className="w-full h-14 object-contain rounded border border-line mb-2" />
              )}
              <label className={`block text-center border border-dashed border-line rounded-[6px] py-2 text-[11px] text-muted cursor-pointer hover:border-orange hover:text-orange transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                {uploading ? 'Enviando...' : 'Trocar imagem'}
                <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={e => e.target.files[0] && handleLogoUpload(e.target.files[0])} />
              </label>
            </div>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Tamanho (px)</div>
              <input
                type="number"
                min="20"
                max="300"
                value={layers.logo.width ?? 80}
                onChange={e => updateLayer('logo', 'width', parseInt(e.target.value) || 80)}
                className="w-full border border-line rounded-[6px] px-3 py-1.5 text-[12px] outline-none focus:border-orange"
              />
            </div>
          </>
        )}

        {selected === 'cta' && (
          <>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Texto</div>
              <input
                type="text"
                value={layers.cta.text}
                onChange={e => updateLayer('cta', 'text', e.target.value)}
                className="w-full border border-line rounded-[6px] px-3 py-1.5 text-[12px] outline-none focus:border-orange"
                placeholder="Ver produtos"
              />
            </div>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Link</div>
              <input
                type="text"
                value={layers.cta.link}
                onChange={e => updateLayer('cta', 'link', e.target.value)}
                className="w-full border border-line rounded-[6px] px-3 py-1.5 text-[12px] outline-none focus:border-orange"
                placeholder="/produtos"
              />
            </div>
          </>
        )}

        {animado && (
          <>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Animação</div>
              <div className="flex flex-wrap gap-1">
                {ANIMATIONS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => updateLayer(selected, 'animation', a.value)}
                    className={`px-2 py-1 rounded-full text-[10px] font-[700] border transition-colors ${
                      selLayer?.animation === a.value
                        ? 'bg-orange text-white border-orange'
                        : 'bg-white text-muted border-line hover:border-orange hover:text-orange'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Delay (s)</div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="3"
                value={selLayer?.delay ?? 0}
                onChange={e => updateLayer(selected, 'delay', parseFloat(e.target.value) || 0)}
                className="w-full border border-line rounded-[6px] px-3 py-1.5 text-[12px] outline-none focus:border-orange"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
