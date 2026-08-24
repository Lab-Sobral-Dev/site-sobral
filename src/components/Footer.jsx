import { Link } from 'react-router-dom';
import WhatsAppIcon from './WhatsAppIcon';

const mapsUrl = (endereco) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;

const UNIDADES = [
  {
    rotulo:   'Unidade Fabril',
    linhas:   ['Rua Bento Leão, 25, Centro', 'Floriano–PI, CEP 64800-062'],
    endereco: 'Laboratório Sobral, Rua Bento Leão, 25, Centro, Floriano - PI, 64800-062',
  },
  {
    rotulo:   'Escritório Comercial',
    linhas:   ['Av. Homero Castelo Branco, 637, Jóquei', 'Teresina–PI, CEP 64049-505'],
    endereco: 'Av. Homero Castelo Branco, 637, Jóquei, Teresina - PI, 64049-505',
  },
];

const SAC_WHATSAPP = 'https://wa.me/5589994606485?text=Ol%C3%A1%2C%20acessei%20o%20site%20e%20gostaria%20de%20atendimento.';

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="mt-[60px] bg-gradient-to-br from-[#F89B4D] via-[#E85A0C] to-[#F89B4D] text-white pt-12 px-4 md:px-10 pb-0">
      <div className="max-w-content mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.2fr_1fr_1.2fr_1fr] gap-8 md:gap-10">

        {/* Logo ocupa a linha inteira: as quatro colunas abaixo comecam no
            mesmo topo, na linha dos enderecos */}
        <div className="sm:col-span-2 md:col-span-4 w-[72px] h-[72px] rounded-full border-2 border-white overflow-hidden">
          <img src="/images/logo.png" alt="Laboratório Sobral" className="w-full h-full object-cover" />
        </div>

        {/* Col 1 — Endereços */}
        <div>
          {UNIDADES.map(({ rotulo, linhas, endereco }, i) => (
            <div key={rotulo} className={`text-[13.5px] leading-relaxed font-semibold ${i > 0 ? 'mt-3' : ''}`}>
              <div className="text-[10px] uppercase tracking-[1.5px] opacity-70 mb-0.5">{rotulo}</div>
              {linhas.map(linha => <div key={linha}>{linha}</div>)}
              <a
                href={mapsUrl(endereco)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-[12.5px] font-[700] underline underline-offset-2 hover:opacity-80 transition-opacity"
                aria-label={`Ver ${rotulo} no Google Maps`}
              >
                <MapPinIcon />
                Ver no mapa
              </a>
            </div>
          ))}
        </div>

        {/* Col 2 — Fale Conosco */}
        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Fale Conosco</h4>
          <ul className="list-none p-0 m-0 space-y-2">
            <li className="text-[13.5px] font-semibold opacity-95">
              <a href="tel:+558921012202" className="hover:underline">(89) 2101-2202</a>
            </li>
            <li className="text-[13px] font-semibold opacity-90 break-all">
              <a href="mailto:sac@laboratoriosobral.com.br" className="hover:underline">sac@laboratoriosobral.com.br</a>
            </li>
            <li className="text-[13.5px] font-[800] mt-3 opacity-95">
              <a href="tel:08009795040" className="hover:underline">SAC 0800 979 5040</a>
            </li>
            <li>
              <a
                href={SAC_WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-1 text-[13.5px] font-[800] opacity-95 hover:underline"
                aria-label="Falar com o SAC pelo WhatsApp (89) 99460-6485"
              >
                <WhatsAppIcon />
                (89) 99460-6485
              </a>
            </li>
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
