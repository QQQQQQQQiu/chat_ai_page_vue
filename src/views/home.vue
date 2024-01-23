<template>
  <div class="page" ref="chatListDom">
    <div class="header sticky flex flex-nowrap w-full items-baseline top-0 px-6 py-4">
      <div class="text-2xl font-bold">{{ AiControl.name }}</div>
      <div class="ml-auto px-3 py-2 text-sm cursor-pointer bg-white rounded-md">
        <select :value="AiControl.name" @change="val => AiControl.change(val.target.value)">
          <option :value="item.label" v-for="item in AiControl.list">{{ item.label }}</option>
        </select>
      </div>
    </div>

    <div class="body mx-2">
      <div class="group flex flex-col px-4 py-3 rounded-lg" v-for="item of messageControl.messageShowList">
        <div class="flex justify-between items-center mb-2">
          <div class="font-bold">{{ messageControl.roleAlias[item.role] }}：</div>
          <Copy class="visible" :content="item.content" />
        </div>
        <div>
          <div class="prose text-sm text-slate-600 leading-relaxed" v-if="item.content" v-html="md.render(item.content)"></div>
          <Loding v-else />
        </div>
      </div>
    </div>
    <div class="footer sticky bottom-0 w-full p-6 pb-8">
      <div class="flex">
        <input class="input" type="text" placeholder="请输入" v-model="inputControl.messageContent" @keydown.enter="inputControl.submit()" />
        <button class="btn" :disabled="inputControl.isTalking" @click="inputControl.submit()">
          {{ '发送' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {ref, watch, nextTick, onMounted, reactive, computed} from 'vue'
  import {GPT} from '@/libs/gpt'
  import {SPARK} from '@/libs/spark'
  import Loding from '@/components/Loding.vue'
  import Copy from '@/components/Copy.vue'
  import {md} from '@/libs/markdown'

  const chatListDom = ref<HTMLDivElement>()

  const messageControl = reactive(
    (() => {
      const defaultList = () => [
        {
          role: 'system',
          content: '你是AI语言模型，尽可能确保内容正确性。'
        }
      ]
      const helloMsg = {
        role: 'waiter',
        content: `你好，我是AI语言模型，我可以提供一些常用服务和信息，例如：
        
  1. 翻译：我可以把中文翻译成英文，英文翻译成中文，还有其他一些语言翻译，比如法语、日语、西班牙语等。

  2. 咨询服务：如果你有任何问题需要咨询，例如健康、法律、投资等方面，我可以尽可能为你提供帮助。

  3. 闲聊：如果你感到寂寞或无聊，我们可以聊一些有趣的话题，以减轻你的压力。

  请告诉我你需要哪方面的帮助，我会根据你的需求给你提供相应的信息和建议。`
      }
      return {
        roleAlias: {user: 'ME', assistant: 'Robot', system: 'System', waiter: 'Waiter'},
        messageList: defaultList(),
        messageShowList: computed(() => {
          let arr = messageControl.messageList.filter(item => !['system'].includes(item.role))
          if (messageControl.messageList.length === 1) {
            arr.push(helloMsg)
          }
          return arr
        }),
        init: () => {
          messageControl.messageList = defaultList()
        },
        add: (role, content) => {
          messageControl.messageList = messageControl.messageList.filter(item => item.role !== 'waiter')
          messageControl.messageList.push({role, content})
        },
        appendLastMessageContent: content => {
          messageControl.messageList[messageControl.messageList.length - 1].content += content
        }
      }
    })()
  )

  const AiControl = reactive({
    list: [
      {label: SPARK.name, value: SPARK},
      {label: GPT.name, value: GPT}
    ],
    currentModel: SPARK,
    name: computed(() => {
      return AiControl.currentModel.name
    }),
    change: label => {
      AiControl.currentModel = AiControl.list.find(item => item.label === label).value
      messageControl.init()
    }
  })

  const inputControl = reactive({
    isTalking: false,
    messageContent: '',
    submit: async () => {
      if (inputControl.isTalking) return
      let content = inputControl.messageContent
      if (!content) return
      inputControl.isTalking = true
      messageControl.add('user', content)
      inputControl.clear()
      let is0 = true
      await AiControl.currentModel.send({
        messageList: messageControl.messageList,
        onMessage: str => {
          if (is0) {
            messageControl.add('assistant', '')
            is0 = false
          }
          messageControl.appendLastMessageContent(str)
          scrollToBottom()
        }
      })
      inputControl.isTalking = false
    },
    clear: () => {
      inputControl.messageContent = ''
    }
  })

  const scrollToBottom = async () => {
    if (!chatListDom.value) return
    let isOnButtom = chatListDom.value.scrollTop + chatListDom.value.offsetHeight >= chatListDom.value.scrollHeight - 5
    if (isOnButtom) {
      await nextTick()
      chatListDom.value.scrollTop = 9999999
    }
  }
</script>

<style>
  .page {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    overflow-y: auto;
    background: #f9f7f7;
  }
  .page > .header {
    left: 0;
    backdrop-filter: blur(14px);
    background: rgba(255, 255, 255, 0.5);
    height: 70px;
  }
  .page > .footer {
    left: 0;
    backdrop-filter: blur(14px);
    background: rgba(255, 255, 255, 0.5);
    height: 98px;
  }
  .page > .body {
    min-height: calc(100% - (70px + 98px));
  }
  div.prose {
    max-width: 100%;
  }
  .prose pre {
    background-color: #1f2937;
    overflow-x: auto;
    font-weight: 400;
    font-size: 0.875em;
    line-height: 1.7142857;
    margin-top: 1.7142857em;
    border-radius: 0.375rem;
    padding: 0.8571429em 1.1428571em;
    color: #e5e7eb;
  }
  pre {
    font-family: -apple-system, 'Noto Sans', 'Helvetica Neue', Helvetica, 'Nimbus Sans L', Arial, 'Liberation Sans', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Source Han Sans SC', 'Source Han Sans CN', 'Microsoft YaHei', 'Wenquanyi Micro Hei', 'WenQuanYi Zen Hei', 'ST Heiti', SimHei, 'WenQuanYi Zen Hei Sharp', sans-serif;
  }
</style>
