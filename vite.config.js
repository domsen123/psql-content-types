const viteSSRPlugin = require('vite-ssr/plugin')

module.exports = {
  plugins: [viteSSRPlugin],
  proxy: {
    '/_api_': {
      // This is the server in `node-site` directory
      target: 'http://localhost:3000',
    },
  },
}