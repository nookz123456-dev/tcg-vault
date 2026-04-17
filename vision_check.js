const http = require('http')
const fs = require('fs')

const img = fs.readFileSync('C:\\Users\\suwij\\.openclaw\\media\\inbound\\file_13---af86f4ee-b2b0-476a-9e71-06e90ea2c011.jpg')
const b = Buffer.from(img).toString('base64')

const req = http.request({
  hostname: 'localhost',
  port: 11434,
  path: '/api/chat',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let d = ''
  res.on('data', c => d += c)
  res.on('end', () => {
    try {
      const lines = d.split('\n').filter(l => l.trim())
      for (const line of lines) {
        try {
          const j = JSON.parse(line)
          if (j.message?.content) {
            process.stdout.write(j.message.content)
          }
          if (j.done) {
            console.log('\n---DONE---')
          }
        } catch(e) {}
      }
    } catch(e) {
      console.log('Error:', e.message, d.substring(0, 200))
    }
  })
})

req.write(JSON.stringify({
  model: 'gemma3:4b',
  messages: [{
    role: 'user',
    content: 'Describe this screenshot briefly. What website is this? What cards or results are shown?',
    images: [`data:image/jpeg;base64,${b}`]
  }],
  stream: true
}))

req.end()