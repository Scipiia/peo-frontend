<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser, logout } from '@/auth'

const route = useRoute()
const router = useRouter()

// localStorage не реактивен, поэтому перечитываем пользователя
// каждый раз, когда меняется маршрут (после входа/выхода).
const user = ref(getUser())
watch(() => route.fullPath, () => {
    user.value = getUser()
})

function handleLogout() {
    logout()              // чистим токен и пользователя
    router.push('/login') // уходим на страницу входа
}
</script>

<template>
    <!-- Рисуем блок только если есть залогиненный пользователь -->
    <div v-if="user" class="user-block">
        <span class="user-name">{{ user.full_name }}</span>
        <button class="logout-btn" @click="handleLogout">Выйти</button>
    </div>
</template>

<style scoped>
.user-block {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-left: 16px;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.user-name {
    color: #ffffffcc;
    font-size: 0.9rem;
    white-space: nowrap;
}

.logout-btn {
    background: transparent;
    color: #ffffffcc;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    padding: 5px 12px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.logout-btn:hover {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.5);
}
</style>