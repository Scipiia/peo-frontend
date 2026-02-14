<!-- src/components/AdminPanel.vue -->
<template>
  <div class="admin-panel">
    <h1>Админка сервиса нормирования</h1>
    <nav class="admin-nav">
      <router-link to="/admin/templates">Шаблоны</router-link> |
      <router-link to="/admin/peo">ПЭО</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
// Пока ничего не импортируем — всё управление маршрутизацией в router
</script>

<style scoped>
.admin-panel {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
.admin-nav {
  margin: 20px 0;
  font-size: 18px;
}
</style>