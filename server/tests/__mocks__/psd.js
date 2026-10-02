// Mock do módulo psd para testes — evita tentar parsear CoffeeScript
module.exports = {
  fromFile: () => ({
    parse: async () => {},
    header: { width: 1920, height: 700 },
    layers: [],
    tree: () => ({ toPng: () => null }),
  }),
};
