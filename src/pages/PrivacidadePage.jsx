export default function PrivacidadePage() {
  return (
    <>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Privacidade e Proteção de Dados
      </div>

      <section className="max-w-[920px] mx-auto px-10 mt-10 pb-16">
        <h2 className="text-[22px] font-[800] text-orange mb-4">Política de Privacidade</h2>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          O Laboratório Sobral respeita a privacidade de seus usuários e está comprometido com a proteção
          de seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">Quais dados coletamos</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          Coletamos apenas os dados necessários para o funcionamento dos nossos serviços, incluindo:
          nome completo, endereço de e-mail, número de telefone e endereço, quando fornecidos voluntariamente
          através do formulário de contato ou outros canais de atendimento.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">Como usamos seus dados</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          Seus dados são utilizados exclusivamente para responder às suas solicitações, prestar atendimento,
          e melhorar nossos serviços. Não vendemos, alugamos ou compartilhamos seus dados com terceiros
          sem o seu consentimento, exceto quando exigido por lei.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">Armazenamento e segurança</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra
          acesso não autorizado, alteração, divulgação ou destruição. Seus dados são mantidos apenas
          pelo tempo necessário para cumprir as finalidades para as quais foram coletados.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">Seus direitos</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-3">
          Nos termos da LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:
        </p>
        <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-5">
          <li>Confirmação da existência de tratamento;</li>
          <li>Acesso aos dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
          <li>Portabilidade dos dados;</li>
          <li>Eliminação dos dados tratados com consentimento;</li>
          <li>Revogação do consentimento a qualquer momento.</li>
        </ul>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">Cookies</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          Este site pode utilizar cookies para melhorar a experiência de navegação. Os cookies são
          pequenos arquivos armazenados no seu dispositivo que nos ajudam a entender como você
          utiliza o site. Você pode desativar os cookies nas configurações do seu navegador.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">Contato</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          Para exercer seus direitos ou esclarecer dúvidas sobre nossa política de privacidade,
          entre em contato pelo e-mail{' '}
          <span className="text-orange font-bold">marketing@laboratoriosobral.com.br</span>{' '}
          ou pelo telefone <span className="font-bold">(89) 2101-2202</span>.
        </p>

        <p className="text-[13px] text-muted mt-8 border-t border-line pt-5">
          Última atualização: abril de 2026.
        </p>
      </section>
    </>
  );
}
