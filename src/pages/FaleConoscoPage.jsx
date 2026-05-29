import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import Breadcrumb from '../components/Breadcrumb';
import { usePageContent } from '../hooks/usePageContent';

const safe = (html) => parse(DOMPurify.sanitize(html));

function toWhatsApp(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  const num = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${num}`;
}

const CONTATO_DEFAULTS = {
  unidade_fabril:       '<p><strong>Rua Bento Leão, 25, Centro</strong><br>Floriano | PI | CEP 64800-062.<br>Telefone: (89) 2101-2202</p>',
  escritorio_comercial: '<p><strong>Avenida Elias João Tajra, 1601, Fátima</strong><br>Teresina | PI | CEP 64049-300<br>Telefone: (89) 99921-0283</p>',
  sac_telefone:         '0800 979 5040',
  sac_email:            'sac@laboratoriosobral.com.br',
  rh_telefone:          '(89) 99999-9999',
  rh_email:             'rh@laboratoriosobral.com.br',
  marketing_telefone:   '(89) 99999-9999',
  marketing_email:      'marketing@laboratoriosobral.com.br',
};

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const EMPTY_FORM = { nome: '', sobrenome: '', email: '', celular: '', endereco: '', estado: '', assunto: '', mensagem: '' };

export default function FaleConoscoPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});

  const content = usePageContent('contato', CONTATO_DEFAULTS);

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ['nome', 'sobrenome', 'email', 'celular', 'assunto', 'mensagem'];
    const newErrors = {};
    required.forEach(f => { if (!form[f].trim()) newErrors[f] = true; });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = true;
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ submit: data.error || 'Erro ao enviar. Tente novamente.' });
        return;
      }
      setSent(true);
      setForm(EMPTY_FORM);
    } catch {
      setErrors({ submit: 'Erro de conexão. Verifique sua internet e tente novamente.' });
    } finally {
      setSending(false);
    }
  };

  const inputClass = (field) =>
    `w-full py-[14px] px-[18px] rounded-full border bg-white font-sans text-[14px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted ${
      errors[field]
        ? 'border-[#E04444] shadow-[0_0_0_3px_rgba(224,68,68,.12)]'
        : 'border-line focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)]'
    }`;

  return (
    <>
      <Helmet>
        <title>Fale Conosco | Laboratório Sobral</title>
        <meta name="description" content="Entre em contato com o Laboratório Sobral. Formulário de contato, endereços, telefones e SAC gratuito." />
        <meta property="og:title" content="Fale Conosco | Laboratório Sobral" />
        <meta property="og:description" content="Entre em contato com o Laboratório Sobral. Formulário de contato, endereços, telefones e SAC." />
        <meta property="og:type" content="website" />
      </Helmet>
      <Breadcrumb trail={[{ label: 'Home', to: '/' }, { label: 'Fale Conosco' }]} />

      <section className="max-w-content mx-auto px-4 md:px-10 mt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 md:gap-12 mb-12">
          <div>
            <h2 className="text-[22px] font-[800] text-orange mb-[18px]">LABORATÓRIO SOBRAL</h2>
            <div className="mb-[22px] text-[14.5px] leading-[1.6]">
              <div className="font-[800] mb-1">Unidade Fabril</div>
              <div>{safe(content.unidade_fabril)}</div>
            </div>
            <div className="text-[14.5px] leading-[1.6]">
              <div className="font-[800] mb-1">Escritório Comercial</div>
              <div>{safe(content.escritorio_comercial)}</div>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 items-start">
            {[
              { label: 'SAC',       telefone: content.sac_telefone,       email: content.sac_email },
              { label: 'RH',        telefone: content.rh_telefone,        email: content.rh_email },
              { label: 'MARKETING', telefone: content.marketing_telefone, email: content.marketing_email },
            ].map(({ label, telefone, email }) => {
              const wa = toWhatsApp(telefone);
              return (
                <div key={label} className="bg-white rounded-[14px] py-[14px] px-[22px] w-full max-w-[360px] shadow-sm border border-line">
                  <div className="bg-gradient-to-b from-[#F89B4D] to-[#E0580A] text-white font-[800] text-[14px] tracking-[.5px] py-2 px-[18px] rounded-full inline-block mb-2">
                    {label}
                  </div>
                  {wa ? (
                    <a href={wa} target="_blank" rel="noreferrer" className="block text-[14px] text-ink-light hover:text-orange transition-colors mt-1">
                      {telefone}
                    </a>
                  ) : (
                    <div className="text-[14px] text-ink-light mt-1">{telefone}</div>
                  )}
                  <a href={`mailto:${email}`} className="block text-[14px] text-ink-light hover:text-orange transition-colors">
                    {email}
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        <h2 className="text-[22px] font-[800] text-orange mb-[18px]">Fale Conosco</h2>

        {sent && (
          <div className="py-[14px] px-5 mb-[18px] bg-[#E8F5E8] text-[#2D6A2D] rounded font-bold text-[14px]">
            ✓ Mensagem enviada com sucesso! Retornaremos em breve.
          </div>
        )}

        {errors.submit && (
          <div className="py-[14px] px-5 mb-[18px] bg-red-50 text-red-600 rounded font-bold text-[14px]">
            {errors.submit}
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-[14px] bg-[#EEEEEE] p-5 md:p-7 rounded" onSubmit={handleSubmit}>
          <input placeholder="Nome*" className={inputClass('nome')} value={form.nome} onChange={handleChange('nome')} />
          <input placeholder="Sobrenome*" className={inputClass('sobrenome')} value={form.sobrenome} onChange={handleChange('sobrenome')} />
          <input placeholder="E-mail*" type="email" className={inputClass('email')} value={form.email} onChange={handleChange('email')} />
          <input placeholder="Celular*" className={inputClass('celular')} value={form.celular} onChange={handleChange('celular')} />
          <input placeholder="Endereço" className={inputClass('endereco')} value={form.endereco} onChange={handleChange('endereco')} />
          <select className={inputClass('estado')} value={form.estado} onChange={handleChange('estado')}>
            <option value="">Estado</option>
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <div className="col-span-2">
            <input placeholder="Assunto*" className={inputClass('assunto')} value={form.assunto} onChange={handleChange('assunto')} />
          </div>
          <div className="col-span-2">
            <textarea
              placeholder="Mensagem*"
              className={`w-full py-[14px] px-[18px] rounded-[18px] border bg-white font-sans text-[14px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted min-h-[140px] resize-y ${
                errors.mensagem
                  ? 'border-[#E04444] shadow-[0_0_0_3px_rgba(224,68,68,.12)]'
                  : 'border-line focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)]'
              }`}
              value={form.mensagem}
              onChange={handleChange('mensagem')}
            />
          </div>
          <div className="col-span-2 flex justify-end mt-1">
            <button
              type="submit"
              disabled={sending}
              className="btn-ripple inline-flex items-center justify-center px-9 py-3 rounded-full border-none font-bold text-[14px] tracking-[.3px] text-white bg-gradient-to-b from-[#F89B4D] to-[#E85A0C] shadow-[0_2px_8px_rgba(232,90,12,.3)] transition-all hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(232,90,12,.42)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {sending ? 'Enviando...' : 'ENVIAR'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
