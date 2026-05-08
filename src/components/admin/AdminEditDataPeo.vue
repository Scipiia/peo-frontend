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
        <th>Бригады</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="emp in employees" :key="emp.id">
        <td>{{ emp.id }}</td>
        <td><input v-model="emp.name"></td>
        <td><input type="checkbox"  v-model="emp.is_active" /></td>
        <td>
          <!-- Чекбоксы бригад -->
          <div v-if="teams.length" class="teams-checkboxes">
            <label
                v-for="team in teams"
                :key="team.id"
                class="team-label"
            >
              <input
                  type="checkbox"
                  :value="team.id"
                  v-model="emp.selected_team_ids"
              />
              {{ team.name }}
            </label>
          </div>
          <div v-else class="text-muted">Нет доступных бригад</div>
        </td>
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
        <th>Бригады</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td><input v-model="addEmployer.name"></td>
        <td><input type="checkbox"  v-model="addEmployer.is_active" /></td>
        <td>
          <!-- В шаблоне формы добавления -->
          <div class="form-group">
            <div v-if="teams.length" class="teams-checkboxes">
              <label v-for="team in teams" :key="team.id" class="team-label">
                <input
                    type="checkbox"
                    :value="team.id"
                    v-model="addEmployer.team_ids"
                />
                {{ team.name }}
              </label>
            </div>
            <div v-else class="text-muted">Загрузка бригад...</div>
          </div>
        </td>
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
const teams = ref([])


async function loadCoefficient() {
  const res = await fetch('/api/admin/coefficient')
  if (!res.ok) throw new Error('Ошибка коэффициентов')
  return await res.json()
}

async function loadTeams() {
  const res = await  fetch('/api/admin/employees/teams')
  if (!res.ok) throw new Error('Ошибка бригад')
  return await res.json()
}

async function loadEmployees() {
  const res = await fetch('/api/admin/employees')
  if (!res.ok) throw new Error('Ошибка сотрудников')
  const data = await res.json()
  return data.map(emp => ({
    ...emp,
    selected_team_ids: emp.teams?.map(t => t.id) || []
  }))
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
    for (const emp of employees.value) {
      const payload = {
        name: emp.name,
        is_active: emp.is_active,
        team_ids: emp.selected_team_ids // Только выбранные бригады
      }

      const res = await fetch(`/api/admin/employees/update/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(`Ошибка обновления ${emp.name}: ${errData.message || res.statusText}`)
      }
    }
  } catch (err) {
    console.log("Сотрудники не обновлены", err)
  }
}

const addEmployer = ref({
  name: '',
  is_active: true,
  team_ids: []
})

async function saveEmployer() {
  try {
    // 🔥 Логируем что отправляем
    //console.log("📤 CREATE payload:", JSON.stringify(addEmployer.value))

    const res = await fetch(`/api/admin/employees/save`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addEmployer.value)
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(`HTTP ${res.status}: ${errData.message || res.statusText}`)
    }

    //const result = await res.json()
    // console.log("✅ Сотрудник создан:", result)

    await loadEmployees();

    // Очистка формы и перезагрузка списка
    addEmployer.value = { name: '', is_active: true, team_ids: [] }
    await loadEmployees() // твоя функция загрузки списка

  } catch (err) {
    console.error("❌ Новый сотрудник не сохранен:", err)
    alert('Ошибка: ' + err.message)
  }
}


onMounted(async ()=>{
  loading.value = true
  try {
    const [coeff, emps, team] = await Promise.all([
        loadCoefficient(),
        loadEmployees(),
        loadTeams()
    ])
    coefficients.value = coeff
    employees.value = emps
    teams.value = team

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