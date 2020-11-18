import './index.css'
import viteSSR from 'vite-ssr'
import App from './App.vue'
import routes from './routes'

// Use route.meta.state as props

routes.forEach((route) => {
  (route as any).props = (r:any) => ({ ...(r.meta.state || {}), ...(r.props || {}) })
})

export default viteSSR(
  App,
  { routes: []},
  ({ app, router, isClient, request }): Promise<any> => {
    router.beforeEach(async (to: any, from: any, next: any) => {
      if (to.meta.state) {
        // This route has state already (from server) so it can be reused.
        return next()
      }
      let baseUrl = ''
      if (request && request.url) {
        baseUrl = isClient ? '' : new URL(request.url).origin
      } 

      try {
        // Get our page props from our custom API:
        const res = await fetch(
          `${baseUrl}/_api_/props?path=${encodeURIComponent(to.path)}&name=${
            to.name
          }&client=${isClient}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        to.meta.state = await res.json()
      } catch (error) {
        console.error(error)
        // redirect to error route
      }

      return next()
    })
    return Promise.resolve()
  }
)