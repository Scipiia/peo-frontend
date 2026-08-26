import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios'
import { getToken } from './auth'

axios.interceptors.request.use(config => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Глобально подставляем JWT-токен во ВСЕ fetch-запросы
const originalFetch = window.fetch.bind(window)
window.fetch = (url, options = {}) => {
    const token = getToken()
    if (token) {
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${token}`)
        options = { ...options, headers }
    }
    return originalFetch(url, options)
}

const app = createApp(App);
app.use(router);
app.mount('#app');
