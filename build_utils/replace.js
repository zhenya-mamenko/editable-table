export default function replace(options = {}) {
  const { from ,to } = options;

  return {
    name: 'replace',

    renderChunk(code) {
      if (!from) return null;
      return code.replace(from, to);
    },

  };

}
