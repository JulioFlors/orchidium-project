import https from 'node:https'

import fetch from 'node:fetch'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function testFetch() {
  try {
    console.log('Fetching BCV...')
    const res = await fetch('https://www.bcv.org.ve/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      },
    })

    console.log('Status:', res.status)
    const html = await res.text()

    console.log('HTML Length:', html.length)

    // Look for "dolar" or ID/class
    const regexDolar = /id=["']dolar["'][\s\S]*?<strong>\s*([\d,.]+)\s*<\/strong>/i
    const match = html.match(regexDolar)

    if (match) {
      console.log('Match found directly:', match[0])
      console.log('Extracted value:', match[1])
    } else {
      console.log('Direct regex match failed. Searching for exchange rate container...')
      // Let's print some lines containing "dolar" or "USD"
      const lines = html.split('\n')
      let foundCount = 0

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('dolar') || lines[i].includes('USD') || lines[i].includes('dólar')) {
          console.log(`Line ${i}:`, lines[i].trim())
          foundCount++
          if (foundCount > 30) break
        }
      }
    }
  } catch (error) {
    console.error('Error fetching:', error)
  }
}

testFetch()
