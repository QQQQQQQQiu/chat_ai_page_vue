import { HmacSHA256, enc } from 'crypto-js'

let submitTime = 0
const APPID = '54bc57e3'
const API_SECRET = 'N2Y2NjNhOTY1Mzc0OGFmYzc0NzMxNDBk'
const API_KEY = 'fb7bdb9330d8208755ee58f34a3012c5'
const API_VERSION = 'v3.5'

export const SPARK = {
  name: '讯飞星火',
  onMessage: ()=>{},
  send: async (options)=>{
    const {
      onMessage = ()=>{},
      messageList = []
    } = options
    await queryKeyword(messageList, onMessage)
  },
}

export const queryKeyword = async (chatMsgArr = [], onProgress = () => { }) => {
  console.log('params :>> ', createParams(chatMsgArr))
  submitTime = +new Date()
  let reqTime = submitTime
  const url = await getWebsocketUrl()
  let resStr = ''
  let ttsWS = new WebSocket(url)
  ttsWS.onopen = e => {
    ttsWS.send(JSON.stringify(createParams(chatMsgArr)))
  }
  ttsWS.onmessage = e => {
    if (reqTime !== submitTime) return
    let res = JSON.parse(e.data)
    let str = ''
    if (res.header?.code !== 0) {
      str = res.header.message
    }
    else {
      str = res.payload?.choices?.text[0]?.content || ''
    }
    // console.log('e.data :>> ', e.data)
    // resStr += str
    onProgress(str)
  }
  ttsWS.onerror = e => {
    console.error(`详情查看：${encodeURI(url.replace('wss:', 'https:'))}`, e)
  }
  ttsWS.onclose = e => {
    console.log('onclose :>> ', e);
  }
}

function createParams(chatMsgArr = []) {
  let arr = chatMsgArr.map(item => {
    let role = item.role
    return {
      role,
      content: item.content
    }
  })
  var params = {
    "header": {
      "app_id": APPID,
      "uid": "fd3f411e2-32d"
    },
    "parameter": {
      "chat": {
        "domain": `general${API_VERSION}`,
        "temperature": 1,
        "max_tokens": 8192
      }
    },
    "payload": {
      "message": {
        "text": arr
      }
    }
  }
  return params
}

function getWebsocketUrl() {
  return new Promise((resolve, reject) => {
    var apiKey = API_KEY
    var apiSecret = API_SECRET
    var url = `wss://spark-api.xf-yun.com/${API_VERSION}/chat`
    var host = location.host
    var date = new Date().toGMTString()
    var algorithm = 'hmac-sha256'
    var headers = 'host date request-line'
    var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /${API_VERSION}/chat HTTP/1.1`
    var signatureSha = HmacSHA256(signatureOrigin, apiSecret)
    var signature = enc.Base64.stringify(signatureSha)
    var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
    var authorization = btoa(authorizationOrigin)
    url = `${url}?authorization=${authorization}&date=${date}&host=${host}`
    resolve(url)
  })
}