<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '@/auth'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(username.value, password.value)
    // После успешного входа — на главную страницу
    router.push(route.query.redirect || '/orders')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <form class="login-card" @submit.prevent="handleLogin">
      <h2>Система нормирования</h2>
      <p class="subtitle">Вход через доменную учетную запись</p>

      <div v-if="error" class="error">{{ error }}</div>

      <label>
        Логин
        <input
            v-model="username"
            type="text"
            placeholder="inormirovshik"
            required
            autofocus
        />
      </label>

      <label>
        Пароль
        <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
        />
      </label>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Вход...' : 'Войти' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h2 {
  margin: 0;
  color: #1a1a1a;
  text-align: center;
}

.subtitle {
  margin: 0 0 12px;
  color: #888;
  font-size: 14px;
  text-align: center;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

input {
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #1677ff;
}

button {
  padding: 12px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}

button:hover:not(:disabled) {
  background: #0958d9;
}

button:disabled {
  background: #91caff;
  cursor: not-allowed;
}

.error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #cf1322;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
}
</style>