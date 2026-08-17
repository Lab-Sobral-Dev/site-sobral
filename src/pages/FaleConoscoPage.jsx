import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import Breadcrumb from '../components/Breadcrumb';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { usePageContent } from '../hooks/usePageContent';

const safe = (html) => parse(DOMPurify.sanitize(html));
const stripTags = (html) => (html || '').replace(/<[^>]*>/g, '').trim();

const CONTATO_DEFAULTS = {
  sac_telefone:         '0800 979 5040',
  sac_email:            'sac@laboratoriosobral.com.br',
  rh_telefone:          '(89) 99999-9999',
  rh_email:             'rh@laboratoriosobral.com.br',
  marketing_telefone:   '(89) 99999-9999',
  marketing_email:      'marketing@laboratoriosobral.com.br',

  faq_titulo: 'Perguntas Frequentes',
  faq_1_p: 'Como falo com o SAC do Laboratório Sobral?',
  faq_1_r: '<p>Pelo telefone gratuito <strong>0800 979 5040</strong>, pelo WhatsApp <strong>(89) 99460-6485</strong> ou pelo e-mail <strong>sac@laboratoriosobral.com.br</strong>. Você também pode usar o formulário no fim desta página.</p>',
  faq_2_p: 'Onde encontro os produtos Sobral?',
  faq_2_r: '<p>Nossos produtos são distribuídos em farmácias e drogarias de todo o Brasil. Se não encontrar um item na sua região, fale com o SAC que indicamos o ponto de venda mais próximo.</p>',
  faq_3_p: 'O Laboratório Sobral ainda fabrica medicamentos?',
  faq_3_r: '<p>Hoje o Sobral está focado em <strong>suplementos alimentares</strong> — em especial vitaminas e minerais — e em <strong>cosméticos</strong>, com a mesma tradição e qualidade de sempre, agora com foco na prevenção e no bem-estar.</p>',
  faq_4_p: 'Como agendo uma visita à indústria?',
  faq_4_r: '<p>Fale com a gente pelo WhatsApp <strong>(89) 99927-0207</strong> e combinamos a melhor data para receber você ou seu grupo.</p>',
  faq_5_p: 'Como envio meu currículo para trabalhar no Sobral?',
  faq_5_r: '<p>Envie seu currículo para <strong>rh@laboratoriosobral.com.br</strong>. As vagas abertas também são divulgadas nas nossas redes sociais.</p>',
  faq_6_p: 'Onde consulto o Relatório de Transparência Salarial?',
  faq_6_r: '<p>O relatório fica disponível publicamente. Acesse pelo menu <strong>Fale Conosco → Relatório de Transparência Salarial</strong>, no topo do site.</p>',
};

const FAQ_KEYS = [1, 2, 3, 4, 5, 6];

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const EMPTY_FORM = { nome: '', sobrenome: '', email: '', celular: '', endereco: '', estado: '', assunto: '', mensagem: '' };

export default function FaleConoscoPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});
  const [openFaq, setOpenFaq] = useState(null);

  const content = usePageContent('contato', CONTATO_DEFAULTS);

  // Só entram no acordeão as perguntas que têm pergunta E resposta preenchidas,
  // para que apagar um par no CMS remova o item em vez de deixar linha vazia.
  const faqItems = FAQ_KEYS
    .map(n => ({ n, pergunta: (content[`faq_${n}_p`] || '').trim(), resposta: content[`faq_${n}_r`] || '' }))
    .filter(item => item.pergunta && stripTags(item.resposta));

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
        <meta name="description" content="Entre em contato com o Laboratório Sobral: formulário, SAC gratuito, WhatsApp e perguntas frequentes." />
        <meta property="og:title" content="Fale Conosco | Laboratório Sobral" />
        <meta property="og:description" content="Entre em contato com o Laboratório Sobral. Formulário de contato, SAC, WhatsApp e perguntas frequentes." />
        <meta property="og:type" content="website" />
        {faqItems.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqItems.map(({ pergunta, resposta }) => ({
                '@type': 'Question',
                name: pergunta,
                acceptedAnswer: { '@type': 'Answer', text: stripTags(resposta) },
              })),
            })}
          </script>
        )}
      </Helmet>
      <Breadcrumb trail={[{ label: 'Home', to: '/' }, { label: 'Fale Conosco' }]} />
      <h1 className="sr-only">Fale Conosco — Laboratório Sobral</h1>

      <section className="max-w-content mx-auto px-4 md:px-10 mt-10 pb-16">
        <div className="mb-12">
          <h2 className="text-[22px] font-[800] text-orange mb-[18px]">LABORATÓRIO SOBRAL</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
            {[
              {
                label: 'SAC',
                phone: content.sac_telefone,
                wa: 'https://wa.me/5589994606485?text=Ol%C3%A1%2C%20acessei%20o%20site%20e%20gostaria%20de%20atendimento.',
                waLabel: '(89) 99460-6485',
                email: content.sac_email,
              },
              {
                label: 'MARKETING',
                wa: 'https://wa.me/5589994021056?text=Ol%C3%A1%2C%20acessei%20o%20site%20e%20gostaria%20de%20atendimento.',
                waLabel: '(89) 99402-1056',
                email: content.marketing_email,
              },
              {
                label: 'AGENDE UMA VISITA',
                wa: 'https://wa.me/5589999270207?text=Ol%C3%A1%2C%20acessei%20o%20site%20e%20gostaria%20de%20agendar%20uma%20visita%20na%20ind%C3%BAstria.',
                waLabel: '(89) 99927-0207',
                email: 'rh@laboratoriosobral.com.br',
              },
            ].map(({ label, phone, wa, waLabel, email }) => (
              <div key={label} className="bg-white rounded-[14px] py-[14px] px-[22px] w-full h-full shadow-sm border border-line">
                <div className="bg-gradient-to-b from-[#F89B4D] to-[#E0580A] text-white font-[800] text-[14px] tracking-[.5px] py-2 px-[18px] rounded-full inline-block mb-2">
                  {label}
                </div>
                {phone && <div className="text-[14px] text-ink-light mt-1">{phone}</div>}
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1.5 py-1.5 px-3 rounded-full bg-[#25D366] text-white font-bold text-[13px] transition-all hover:bg-[#1DA851] hover:-translate-y-px"
                    aria-label={`Falar pelo WhatsApp ${waLabel || ''}`.trim()}
                  >
                    <WhatsAppIcon />
                    {waLabel ? `WhatsApp ${waLabel}` : 'Falar pelo WhatsApp'}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="block text-[14px] text-ink-light hover:text-orange transition-colors mt-2">
                    {email}
                  </a>
                )}
              </div>
            ))}

          </div>
        </div>

        {/* Perguntas Frequentes */}
        {faqItems.length > 0 && (
          <div className="mb-12">
            <h2 className="text-[22px] font-[800] text-orange mb-[18px]">{content.faq_titulo}</h2>
            <div className="bg-white rounded-[14px] border border-line shadow-sm px-5 md:px-7">
              {faqItems.map(({ n, pergunta, resposta }) => (
                <div key={n} className={`accordion-item border-b border-line last:border-0 ${openFaq === n ? 'open' : ''}`}>
                  <button
                    type="button"
                    aria-expanded={openFaq === n}
                    aria-controls={`faq-resposta-${n}`}
                    className="flex justify-between items-center gap-4 w-full py-[16px] bg-transparent border-none text-left font-bold text-[15px] text-ink cursor-pointer"
                    onClick={() => setOpenFaq(openFaq === n ? null : n)}
                  >
                    {pergunta}
                    <span className="arrow text-orange text-[18px] flex-shrink-0">▾</span>
                  </button>
                  <div className="accordion-content" id={`faq-resposta-${n}`} role="region">
                    <div className="pb-4 text-[14.5px] text-ink-light leading-[1.65] [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-orange [&_a]:underline">
                      {safe(resposta)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-[22px] font-[800] text-orange mb-[18px]">Fale Conosco</h2>

        {sent && (
          <div role="status" className="py-[14px] px-5 mb-[18px] bg-[#E8F5E8] text-[#2D6A2D] rounded font-bold text-[14px]">
            ✓ Mensagem enviada com sucesso! Retornaremos em breve.
          </div>
        )}

        {errors.submit && (
          <div role="alert" className="py-[14px] px-5 mb-[18px] bg-red-50 text-red-600 rounded font-bold text-[14px]">
            {errors.submit}
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-[14px] bg-[#EEEEEE] p-5 md:p-7 rounded" onSubmit={handleSubmit}>
          <input aria-label="Nome" aria-required="true" aria-invalid={!!errors.nome} placeholder="Nome*" className={inputClass('nome')} value={form.nome} onChange={handleChange('nome')} />
          <input aria-label="Sobrenome" aria-required="true" aria-invalid={!!errors.sobrenome} placeholder="Sobrenome*" className={inputClass('sobrenome')} value={form.sobrenome} onChange={handleChange('sobrenome')} />
          <input aria-label="E-mail" aria-required="true" aria-invalid={!!errors.email} placeholder="E-mail*" type="email" className={inputClass('email')} value={form.email} onChange={handleChange('email')} />
          <input aria-label="Celular" aria-required="true" aria-invalid={!!errors.celular} placeholder="Celular*" className={inputClass('celular')} value={form.celular} onChange={handleChange('celular')} />
          <input aria-label="Endereço" placeholder="Endereço" className={inputClass('endereco')} value={form.endereco} onChange={handleChange('endereco')} />
          <select aria-label="Estado" className={inputClass('estado')} value={form.estado} onChange={handleChange('estado')}>
            <option value="">Estado</option>
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <div className="col-span-2">
            <input aria-label="Assunto" aria-required="true" aria-invalid={!!errors.assunto} placeholder="Assunto*" className={inputClass('assunto')} value={form.assunto} onChange={handleChange('assunto')} />
          </div>
          <div className="col-span-2">
            <textarea
              aria-label="Mensagem"
              aria-required="true"
              aria-invalid={!!errors.mensagem}
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
