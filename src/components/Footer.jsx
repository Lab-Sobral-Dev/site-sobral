import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-[60px] bg-gradient-to-br from-[#F89B4D] via-[#E85A0C] to-[#F89B4D] text-white pt-12 px-4 md:px-10 pb-0">
      <div className="max-w-content mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.2fr_1fr_1.2fr_1fr] gap-8 md:gap-10">

        {/* Col 1 — Logo + Endereço + Tagline */}
        <div>
          <div className="w-[72px] h-[72px] rounded-full border-2 border-white overflow-hidden mb-[14px]">
            <img src="/images/logo.png" alt="Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
          <div className="text-[13.5px] leading-relaxed font-semibold">
            <div className="text-[10px] uppercase tracking-[1.5px] opacity-70 mb-0.5">Unidade Fabril</div>
            Rua Bento Leão, 25, Centro<br />
            Floriano–PI, CEP 64800-062
          </div>
          <div className="mt-3 text-[13.5px] leading-relaxed font-semibold">
            <div className="text-[10px] uppercase tracking-[1.5px] opacity-70 mb-0.5">Escritório Comercial</div>
            Av. Homero Castelo Branco, 637, Jóquei<br />
            Teresina–PI, CEP 64049-505
          </div>
          <div className="mt-3 text-[10px] font-[800] tracking-[2px] opacity-70 uppercase">
            Empresa Brasileira desde 1911
          </div>
        </div>

        {/* Col 2 — Fale Conosco */}
        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Fale Conosco</h4>
          <ul className="list-none p-0 m-0 space-y-2">
            <li className="text-[13.5px] font-semibold opacity-95">(89) 2101-2202</li>
            <li className="text-[13px] font-semibold opacity-90 break-all">sac@laboratoriosobral.com.br</li>
            <li className="text-[13.5px] font-[800] mt-3 opacity-95">SAC 0800 979 5040</li>
          </ul>
        </div>

        {/* Col 3 — Institucional */}
        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Institucional</h4>
          <ul className="list-none p-0 m-0 space-y-1.5">
            {[
              ['/', 'Home'],
              ['/quem-somos', 'Quem Somos'],
              ['/produtos', 'Produtos'],
              ['/fale-conosco', 'Fale Conosco'],
              ['/fale-conosco', 'Trabalhe Conosco'], /* TODO: link para página/formulário dedicado */
              ['/privacidade', 'Política de Privacidade'],
            ].map(([to, label]) => (
              <li key={label} className="text-[14px] font-semibold opacity-95">
                <Link to={to} className="hover:underline">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 — Redes Sociais */}
        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Redes Sociais</h4>
          <ul className="list-none p-0 m-0 space-y-1.5">
            {[
              { name: 'Instagram', href: 'https://instagram.com/labsobral' },
              { name: 'Facebook',  href: 'https://facebook.com/labsobral' },
              { name: 'YouTube',   href: 'https://www.youtube.com/channel/UCUEAkwfnRsBmRm3An6Vhb2g' },
              { name: 'LinkedIn',  href: 'https://www.linkedin.com/in/labsobral/' },
              { name: 'TikTok',    href: 'https://www.tiktok.com/@labsobral' },
            ].map(({ name, href }) => (
              <li key={name} className="text-[14px] font-semibold opacity-95">
                <a href={href} target="_blank" rel="noreferrer" className="hover:underline">{name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-white/20 py-4 flex flex-wrap justify-between items-center gap-2 text-[13px] font-semibold max-w-content mx-auto">
        <span>© {new Date().getFullYear()} Laboratório Sobral. Todos os direitos reservados.</span>
        <Link to="/privacidade" className="underline">Política de Privacidade e Cookies</Link>
      </div>
    </footer>
  );
}
