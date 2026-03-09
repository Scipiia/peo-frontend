<template>
  <div class="template-edit">
    <h2>Создание нового шаблона</h2>
    <div v-if="loading">Загрузка...</div>
    <form v-else @submit.prevent="saveTemplate">
      <div>
        <label>Код шаблона</label>
        <input v-model="template.code" required />
      </div>
      <div>
        <label>Название для шаблона:</label>
        <input v-model="template.name" required />
      </div>
      <div class="form-checkbox">
        <label for="is_active">Использовать шаблон</label>
        <input type="checkbox" id="is_active" v-model="template.is_active" />
      </div>
      <div>
        <label>Категория:</label>
        <select v-model="template.category">
          <option value="window">Окно</option>
          <option value="door">Дверь</option>
          <option value="glyhar">Гляхарь</option>
          <option value="vitrage">Витраж</option>
          <option value="loggia">Лоджия</option>
        </select>
      </div>
      <div>
        <label>Система(т-теплая,х-холодная, писать т или х):</label>
        <input v-model="template.systema" />
      </div>
      <div>
        <label>Тип изделия(окно гл., окно пов.-отк., 1П, 1.5П,2П,1Пт,1.5Пт,2Пт):</label>
        <input v-model="template.type_izd" />
      </div>
      <div>
        <label>Профиль(сх,ст,ах,ат,ш):</label>
        <input v-model="template.profile" />
      </div>
      <div>
        <label>Заголовок для страницы печати(изготовление П-образ системы Алютех):</label>
        <input v-model="template.head_name" />
      </div>

      <!-- Операции -->
      <h3>Операции</h3>
      <table class="operations-table">
        <thead>
        <tr>
          <th class="col-label">Название</th>
          <th>Название транскрипт</th>
          <th>Количество</th>
          <th>Значения(н/ч)</th>
          <th>Значения(н/м)</th>
          <th>Группа</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(op, index) in template.operations" :key="index">
          <td><input v-model="op.label" /></td>
          <td><input v-model="op.name" /></td>
          <td><input type="number" step="1" min="0" v-model.number="op.count" /></td>
          <td><input type="number" step="0.001" min="0" v-model.number="op.value" /></td>
          <td><input type="number" step="0.001" min="0" v-model.number="op.minutes" /></td>
          <td><input v-model="op.group" /></td>
          <td>
            <button type="button" @click="removeOperation(index)">Удалить</button>
          </td>
        </tr>
        </tbody>
      </table>
      <button type="button" @click="addOperation" class="btn">+ Добавить операцию</button>

      <div class="form-actions">
        <button type="submit">Сохранить</button>
        <router-link to="/admin/templates" class="btn btn-outline">Отмена</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

//const route = useRoute()
const router = useRouter()
const template = ref({
  code: '',
  name: '',
  category: '',
  systema: '',
  type_izd: '',
  profile: '',
  is_active: 1,
  operations: [],
  rules: null,
  head_name: '',
})
const loading = ref(false)


function addOperation() {
  template.value.operations.push({
    label: '',
    name: '',
    count: 0,
    value: 0.0,
    minutes: 0,
    group: '',
    type: 'number',
    required: false
  })
}

function removeOperation(index) {
  template.value.operations.splice(index, 1)
}

async function saveTemplate() {
  try {
    const payload = {
      ...template.value,
      operations: template.value.operations // ← передаём как массив
      // rules оставляем как есть (или null)
    }

    //console.log("PAYYY", payload);

    const res = await fetch(`/api/admin/template/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    alert('Шаблон сохранён')
    router.push('/admin/templates')
  } catch (err) {
    console.error('Ошибка сохранения:', err)
    alert('Не удалось сохранить шаблон')
  }
}

onMounted(() => {
  addOperation() // добавим одну пустую операцию
})
</script>

<style scoped>
.template-edit {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}
input, select {
  width: 100%;
  padding: 6px;
  margin: 6px 0;
}
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

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px; /* отступ между чекбоксом и текстом */
  margin: 8px 0;
}

.col-label{
  width: 30%;
}

.btn {
  padding: 8px 16px;
  margin: 6px;
  cursor: pointer;
}
.form-actions {
  margin-top: 20px;
}

</style>