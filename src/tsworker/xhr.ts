export function syncXHR(options: {
  url: string
  method?: 'GET' | 'POST'
  json: {}
  headers?: Record<string, string>
}) {
  const xhr = new XMLHttpRequest()

  const uri = options.url
  const method = options.method || 'POST'
  let body
  const headers = options.headers || {}
  let isJson = false

  if ('json' in options && options.json !== false) {
    headers['accept'] || headers['Accept'] || (headers['Accept'] = 'application/json') //Don't override existing accept header declared by user
    if (method !== 'GET') {
      headers['content-type'] || headers['Content-Type'] || (headers['Content-Type'] = 'application/json') //Don't override existing accept header declared by user
      body = JSON.stringify(options.json === true ? body : options.json)
    }
  }

  xhr.open(method, uri, false)

  if (xhr.setRequestHeader) {
    for (const key in headers) {
      if (headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, headers[key])
      }
    }
  }

  xhr.send(body || null)

  body = xhr.response ? xhr.response : xhr.responseText
  return JSON.parse(body)
}
