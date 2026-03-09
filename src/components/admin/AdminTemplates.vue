<template>
  <div class="admin-templates">
    <h2>Шаблоны изделий</h2>
    <button @click="handleCreate" class="btn btn-primary">Создать шаблон</button>

    <div v-if="loading">Загрузка...</div>
    <div v-else-if="error" class="error">Ошибка: {{ error }}</div>
<!--    <div>{{ templates.Template }}</div>-->
    <table class="templates-table" v-if="templates.Template && templates.Template.length">
      <thead>
      <tr>
        <th>ID</th>
        <th>Код</th>
        <th>Категория</th>
        <th>Название</th>
        <th>Действия</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="template in templates.Template" :key="template.id">
        <td>{{ template.ID }}</td>
        <td>{{ template.code }}</td>
        <td>{{ template.category }}</td>
        <td>{{ template.name }}</td>
        <td>
          <router-link :to="`/admin/templates/edit/${template.ID}`">Редактировать</router-link>
        </td>
      </tr>
      </tbody>
    </table>
    <div v-else-if="!loading && (!templates.Template || templates.Template.length === 0)">
      Шаблоны не найдены
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const templates = ref({})
const loading = ref(false)
const error = ref(null)
const router = useRouter()

// Загрузка шаблонов
async function fetchTemplates() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/admin/all_templates') // или 'http://localhost:8080/api/admin/templates', но лучше без хоста
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    templates.value = await res.json()
  } catch (err) {
    console.error('Ошибка загрузки шаблонов:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  router.push('/admin/templates/new')
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.admin-templates {
  padding: 20px;
}
.btn {
  padding: 8px 16px;
  margin-bottom: 16px;
  cursor: pointer;
}
.templates-table {
  width: 100%;
  border-collapse: collapse;
}
.templates-table th,
.templates-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
.error {
  color: red;
}
</style>