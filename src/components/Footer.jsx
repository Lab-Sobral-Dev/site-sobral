import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-[60px] bg-gradient-to-br from-[#F89B4D] via-[#E85A0C] to-[#F89B4D] text-white pt-12 px-10 pb-0">
      <div className="max-w-content mx-auto grid grid-cols-[1.2fr_1fr_1.2fr_1fr] gap-10">
        <div>
          <div className="w-[72px] h-[72px] rounded-full border-2 border-white overflow-hidden mb-[14px]">
            <img src="/images/logo.png" alt="Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
          <div className="text-[13.5px] leading-relaxed font-semibold">
            Rua Bento Leão,<br />
            25, Centro,<br />
            Floriano–PI.
          </div>
        </div>

        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Redes sociais</h4>
          <ul className="list-none p-0 m-0 space-y-1.5">
            {['Facebook', 'Instagram', 'Youtube', 'LinkedIn', 'Tiktok'].map(s => (
              <li key={s} className="text-[14px] font-semibold opacity-95">
                <a href="#" className="hover:underline">{s}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Institucional</h4>
          <ul className="list-none p-0 m-0 space-y-1.5">
            <li className="text-[14px] font-semibold opacity-95"><Link to="/" className="hover:underline">Home</Link></li>
            <li className="text-[14px] font-semibold opacity-95"><Link to="/quem-somos" className="hover:underline">Quem Somos</Link></li>
            <li className="text-[14px] font-semibold opacity-95"><Link to="/privacidade" className="hover:underline">Privacidade e Proteção de Dados</Link></li>
            <li className="text-[14px] font-semibold opacity-95"><Link to="/fale-conosco" className="hover:underline">Fale Conosco</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Links Rápidos</h4>
          <ul className="list-none p-0 m-0 space-y-1.5">
            <li className="text-[14px] font-semibold opacity-95"><Link to="/fale-conosco" className="hover:underline">Trabalhe Conosco</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-white/20 py-4 text-center text-[13px] font-semibold">
        Copyright © 2025 Laboratório Sobral. Todos os direitos reservados |
        <Link to="/privacidade" className="underline mx-1">Política de Privacidade</Link>|
        <Link to="/privacidade" className="underline mx-1">Política de Cookies</Link>
      </div>
    </footer>
  );
}
