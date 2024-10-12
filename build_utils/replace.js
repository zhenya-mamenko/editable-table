import MagicString from 'magic-string'

export default function replace(options = {}) {
  const { from ,to } = options;

  return {
    name: 'replace',

    renderChunk(code, chunk) {
      if (!from || !code) return null;
      const s = new MagicString(code);
      return {
        code: s.replaceAll(from, to).toString(),
        map: s.hasChanged() ? s.generateMap({
          source: chunk.fileName,
          file: chunk.fileName + '.map',
          includeContent: true,
        }) : null,
      };
    },

  };

}
