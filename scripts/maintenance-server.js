#!/usr/bin/env node
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 3000
const HTML_PATH = path.join(__dirname, 'maintenance.html')
const PID_FILE = path.join(__dirname, '.maintenance.pid')

const html = fs.readFileSync(HTML_PATH, 'utf-8')

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
})

server.listen(PORT, () => {
  fs.writeFileSync(PID_FILE, String(process.pid))
  console.log(`Maintenance page on http://localhost:${PORT}`)
})

process.on('SIGTERM', () => {
  server.close(() => {
    try { fs.unlinkSync(PID_FILE) } catch {}
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  server.close(() => {
    try { fs.unlinkSync(PID_FILE) } catch {}
    process.exit(0)
  })
})
