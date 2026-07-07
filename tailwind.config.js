/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Classes montadas dinamicamente (layer-anim-${type}, slide-enter-${transition})
  // não aparecem literais no código, então o Tailwind as purgaria do build.
  // Sem isto, as animações dos hero slides e a transição entre slides somem em produção.
  safelist: [
    'layer-anim-fade',
    'layer-anim-slide-up',
    'layer-anim-slide-left',
    'layer-anim-slide-right',
    'layer-anim-zoom',
    'layer-anim-none',
    'slide-enter-fade',
    'slide-enter-slide',
    'slide-enter-cut',
  ],
  theme: {
    extend: {
      colors: {
        orange:          'var(--orange)',
        'orange-dark':   'var(--orange-dark)',
        'orange-light':  'var(--orange-light)',
        'orange-50':     'var(--orange-50)',
        ink:             '#3D3D3D',
        'ink-light':     '#6B6B6B',
        muted:           '#767676',
        line:            '#E5E5E5',
        bg:              '#F5F5F5',
      },
      borderRadius: {
        sm:      '8px',
        DEFAULT: '14px',
        lg:      '22px',
      },
      boxShadow: {
        sm:      '0 1px 2px rgba(0,0,0,.04), 0 2px 6px rgba(0,0,0,.04)',
        DEFAULT: '0 4px 14px rgba(0,0,0,.06)',
      },
      fontFamily: {
        sans:    ['Ubuntu', 'system-ui', 'sans-serif'],
        display: ['Ubuntu', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1180px',
      },
    },
  },
  plugins: [],
}
