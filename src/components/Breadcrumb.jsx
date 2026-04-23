import { Link } from 'react-router-dom';

export default function Breadcrumb({ trail }) {
  return (
    <div className="bg-orange text-white px-10 py-2.5 text-[13px] font-semibold">
      <div className="max-w-content mx-auto flex items-center flex-wrap">
        {trail.map((item, i) => (
          <span key={i} className="flex items-center">
            {item.to
              ? <Link to={item.to} className="opacity-90 hover:opacity-100 hover:underline">{item.label}</Link>
              : <span>{item.label}</span>}
            {i < trail.length - 1 && <span className="mx-2 opacity-70">&gt;</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
