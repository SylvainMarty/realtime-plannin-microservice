import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { WebsocketPlugin } from '@/plugins/websocket';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(new WebsocketPlugin(), {
  websocketEndpoint: import.meta.env.VITE_WEBSOCKET_ENDPOINT,
});

app.mount('#app')
