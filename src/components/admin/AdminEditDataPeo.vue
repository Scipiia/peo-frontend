<template>
  <div class="template-edit">
    <h2>Редактирование коэффициентов ПЭО</h2>
    <div v-if="loading">Загрузка...</div>
    <form v-else @submit.prevent="saveCoefficient" class="operations-table">
      <table>
      <thead>
      <tr>
        <th>Тип изделия</th>
        <th>Коэффициент</th>
        <th>Использовать</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="coef in coefficients" :key="coef.id">
        <td>{{ coef.type }}</td>
        <td><input min="0" step="0.001" v-model.number="coef.coefficient"></td>
        <td><input type="checkbox"  v-model="coef.is_active" /></td>
      </tr>
      </tbody>

      </table>
      <div>
        <button type="submit">Сохранить</button>
      </div>
    </form>
  </div>

  <div class="template-edit">
    <h2>Редактирование сотрудников ПЭО</h2>
    <div v-if="loading">Загрузка...</div>
    <form v-else @submit.prevent="saveEmployees" class="operations-table">
      <table>
      <thead>
      <tr>
        <th>ID</th>
        <th>Имя</th>
        <th>Работает или нет</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="emp in employees" :key="emp.id">
        <td>{{ emp.id }}</td>
        <td><input v-model="emp.name"></td>
        <td><input type="checkbox"  v-model="emp.is_active" /></td>
      </tr>
      </tbody>
      </table>
      <div>
        <button type="submit">Сохранить</button>
      </div>
    </form>
  </div>

  <div class="template-edit">
    <h2>Добавить сотрудника</h2>
    <div v-if="loading">Загрузка...</div>
    <form v-else @submit.prevent="saveEmployer" class="operations-table">
      <table>
      <thead>
      <tr>
        <th>Имя</th>
        <th>Работает или нет</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td><input v-model="addEmployer.name"></td>
        <td><input type="checkbox"  v-model="addEmployer.is_active" /></td>
      </tr>
      </tbody>
      </table>
      <div>
        <button type="submit">Сохранить</button>
      </div>
    </form>
  </div>

</template>

<script setup>

import {onMounted, ref} from "vue";

const loading = ref(false)
const coefficients = ref([])
const employees = ref([])

const addEmployer = ref({
  name: '',
  is_active: false,
})

async function loadCoefficient() {
  const res = await fetch('/api/admin/coefficient')
  if (!res.ok) throw new Error('Ошибка коэффициентов')
  return await res.json()
}

async function loadEmployees() {
  const res = await fetch('/api/admin/employees')
  if (!res.ok) throw new Error('Ошибка сотрудников')
  return await res.json()
}

async function saveCoefficient() {
  try {
    const res = await fetch(`/api/admin/coefficient/update`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coefficients.value)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.log("Коэффициенты не обновлены", err)
  }
}

async function saveEmployees() {
  try {
    const res = await fetch(`/api/admin/employees/update`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employees.value)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.log("Коэффициенты не обновлены", err)
  }
}

async function saveEmployer() {
  try {
    const res = await fetch(`/api/admin/employees/save`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addEmployer.value)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.log("Новый сотрудник не сохранен", err)
  }
}


onMounted(async ()=>{
  loading.value = true
  try {
    const [coeff, emps] = await Promise.all([
        loadCoefficient(),
        loadEmployees()
    ])
    coefficients.value = coeff
    employees.value = emps
  } catch (err) {
    console.log("Ошибка получения данных", err)
  } finally {
    loading.value = false
  }
})


</script>

<style>

.operations-table {
  width: 100%;
  margin: 16px 0;
  border-collapse: collapse;
}

.operations-table th,
.operations-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
.operations-table input,
.operations-table select {
  width: 100%;
  margin: 0;
}

</style>