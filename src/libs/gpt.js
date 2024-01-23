const decoder = new TextDecoder('utf-8')



export const GPT = {
  name: 'Chat GPT',
  send: async (options)=>{
    const {
      onMessage = ()=>{},
      messageList = []
    } = options
    /* const {body, status} = await chat(messageList, 'getAPIKey()')
    if (body) {
      const reader = body.getReader()
      await readStream(reader, status, onMessage)
    } */
    onMessage('开发中...')
  },
}

async function readStream (reader, status, cb=()=>{}) {
  let partialLine = ''
  while (true) {
    const {value, done} = await reader.read()
    if (done) break
    const decodedText = decoder.decode(value, {stream: true})
    if (status !== 200) {
      const json = JSON.parse(decodedText) // start with "data: "
      const content = json.error.message ?? decodedText
      cb(content)
      return
    }
    const chunk = partialLine + decodedText
    const newLines = chunk.split(/\r?\n/)

    partialLine = newLines.pop() ?? ''

    for (const line of newLines) {
      if (line.length === 0) continue // ignore empty message
      if (line.startsWith(':')) continue // ignore sse comment message
      if (line === 'data: [DONE]') return //
      const json = JSON.parse(line.substring(6)) // start with "data: "
      const content = status === 200 ? json.choices[0].delta.content ?? '' : json.error.message
      cb(content)
    }
  }
}

async function chat(messageList, apiKey) {
  try {
    const result = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "post",
      // signal: AbortSignal.timeout(8000),
      // 开启后到达设定时间会中断流式输出
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        stream: true,
        messages: messageList,
      }),
    });
    return result;
  } catch (error) {
    throw error;
  }
}