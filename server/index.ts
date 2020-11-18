import path from 'path'
import Koa from 'koa'
import mount from 'koa-mount'
import serve from 'koa-static'
import bodyParser from 'koa-bodyparser'
import './db'
import { queryPost } from './db'


global.fetch = require('node-fetch')
const { default: handler } = require('../dist/ssr/_assets/src/main')

const _assets = new Koa()
const server = new Koa()
server.use(bodyParser())

_assets.use(serve(path.join(__dirname, '../dist/client/_assets')))

server.use(mount('/_assets', _assets)).use(async ctx => {
  if (ctx.path === '/_api_/post'){
    ctx.body = await queryPost(ctx.request.body)
  }
  else if (ctx.path === '/_api_/props'){
    ctx.body = JSON.stringify({
      server: true,
      msg: 'This is page ' + ( ctx.request.query.name || '').toUpperCase(),
    })
  } 
  else {
    const { html } = await handler({ request: { ...ctx.request, url: ctx.href } })
    ctx.body = html
  }
})

const port = process.env.SERVER_PORT || 3000
server.listen(port)
console.log(`SERVER LISTENING ON PORT: ${port} `)