// Mock do módulo psd para testes — evita tentar parsear CoffeeScript
module.exports = {
  fromFile: () => ({
    parse: async () => {},
    header: { width: 1600, height: 500 },
    layers: [],
    tree: () => ({ toPng: () => null }),
  }),
};
