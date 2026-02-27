<template>
  <div class="assign-workers" v-if="assembly">
    <h2>Назначение работников</h2>

    <!-- Общая информация -->
    <div class="info-grid">
      <div><strong>Заказ:</strong></div>
      <div>{{ assembly.main.order_num }}</div>

      <div><strong>Изделие:</strong></div>
      <div>{{ assembly.main.name }}</div>

      <div><strong>Общее время:</strong></div>
      <div class="total-time">
        {{ totalAssemblyTime.toFixed(3) }} ч ({{ Math.round(totalAssemblyTime * 60) }} мин)
      </div>

      <div><strong>Дата создания:</strong></div>
      <div>{{ formatDate(assembly.main.created_at) }}</div>

      <!-- Поле "Дата выполнения" — как часть той же сетки -->
      <div><strong>Дата выполнения:</strong></div>
      <div>
        <input
            v-model="dateAccounting"
            type="date"
            class="input-date"
        />
        <small>Укажите дату изготовления</small>
      </div>
    </div>

    <!-- Список всех нарядов в сборке -->
    <div v-for="item in allItems" :key="item.id" class="item-section">
      <h3>{{ getItemTitle(item)  }}</h3>
      <p>
        <strong>Тип:</strong> {{ getTypeLabel(item.type) }}
      </p>

      <div><strong>Общее время:</strong></div>
      <div class="total-time">
          {{ item.total_time.toFixed(3) }} ч ({{ Math.round(item.total_time * 60) }} мин)
      </div>

      <table class="executors-table">
        <thead>
        <tr>
          <th>Операция</th>
          <th>Норма (мин)</th>
          <th>Норма (ч)</th>
          <th style="width: 50%">
            Исполнители
            <div class="executor-headers">
              <span class="header-label">Исполнитель</span>
              <span class="header-label">Факт (мин)</span>
              <span class="header-label">Факт (ч)</span>
            </div>
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="op in item.operations" :key="op.operation_name"
            :class="{ 'missing-executor': op.executors.every(ex => !ex.employee_id) }"
        >
          <td>{{ op.operation_label }}</td>
          <td class="text-center">{{ op.minutes }}</td>
          <td class="text-center">{{ op.value.toFixed(3) }}</td>
          <td>
            <!-- Исполнители -->
            <div
                v-for="(executor, idx) in op.executors"
                :key="idx"
                class="executor-row"
            >
              <select v-model="executor.employee_id" class="select-employee">
                <option value="">— выберите —</option>
                <option
                    v-for="emp in getEmployeesForType(item.type)"
                    :key="emp.id"
                    :value="emp.id"
                    :disabled="isExecutorSelected(op.executors, emp.id, executor)"
                >
                  {{ emp.name }}
                </option>
              </select>

              <input
                  v-model.number="executor.actual_minutes"
                  type="number"
                  placeholder="мин"
                  class="input-minutes"
                  min="0"
                  step="0.001"
                  @input="syncValue(executor)"
              />

              <input
                  v-model.number="executor.actual_value"
                  type="number"
                  placeholder="ч"
                  class="input-minutes"
                  min="0"
                  step="0.01"
                  @input="syncMinutes(executor)"
              />

              <button
                  type="button"
                  @click="removeExecutor(op, idx)"
                  class="btn-remove"
                  v-if="op.executors.length > 1"
              >
                ✕
              </button>
            </div>

            <button type="button" @click="addExecutor(op)" class="btn-add">
              + Добавить исполнителя
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Кнопки -->
    <div class="actions">
      <button @click="goBack" class="btn-cancel">Назад</button>
      <button @click="saveExecutors" :disabled="loading" class="btn-save">
        {{ loading ? 'Сохраняем...' : 'Сохранить назначения' }}
      </button>
    </div>
  </div>

  <div v-else-if="loading" class="loading">Загрузка сборки...</div>
  <div v-else class="error">Не удалось загрузить данные</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// Состояние
const assembly = ref(null);       // вся сборка: main + subs
//const employees = ref([]);
const loading = ref(false);
const dateAccounting = ref('');
const employeesByType = ref({}); // список сотрудников
const employeesLoading = ref({}); // 👈 Новый реактивный объект для статусов

const isExecutorSelected = (executors, empId, currentExecutor) => {
  return executors.some(ex =>
      ex !== currentExecutor && ex.employee_id === empId
  );
};

// --- Загрузка данных ---
onMounted(async () => {
  const id = route.params.id;
  if (!id) return;

  loading.value = true;

  try {
    // Прямо используем id как rootId — потому что он гарантированно main
    const assemblyRes = await fetch(`/api/orders/order-norm/${id}`);
    if (!assemblyRes.ok) throw new Error('Не удалось загрузить сборку');
    const data = await assemblyRes.json();


    const processedItems = data.map(item => ({
      ...item,
      operations: item.operations.map(op => {
        // Если есть assign_workers и это массив — используем его
        const executors = Array.isArray(op.assign_workers) && op.assign_workers.length > 0
            ? op.assign_workers.map(ex => ({
              employee_id: ex.employee_id,
              actual_minutes: ex.actual_minutes,
              actual_value: parseFloat(ex.actual_value.toFixed(3))
            }))
            : [{
              // Иначе — один пустой исполнитель с нормой времени
              employee_id: '',
              actual_minutes: op.minutes,
              actual_value: parseFloat(op.value.toFixed(3))
            }];

        return {
          ...op,
          executors // ← уже массив
        };
      })
    }));


    // Разделяем
    const main = processedItems.find(i => i.part_type === 'main') || processedItems[0];
    const subs = processedItems.filter(i => i.part_type === 'sub');


    // console.log("MAIN", main);
    // console.log("SUB", subs);

    assembly.value = { main, subs };
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    alert('Не удалось загрузить данные');
  } finally {
    loading.value = false;
  }

  const today = new Date().toISOString().split('T')[0];
  // Извлекаем дату из ISO-строки (убираем время)
  const rawDate = assembly.value.main.ready_date;

  let accountingDate = today;

  if (rawDate) {
    // Пробуем преобразовать, если это ISO-строка
    const datePart = new Date(rawDate).toISOString().split('T')[0];
    // Проверим, валидна ли дата
    if (datePart !== 'Invalid date') {
      accountingDate = datePart;
    }
  }

  dateAccounting.value = accountingDate;

  // Загрузка сотрудников
  // try {
  //   const empRes = await fetch('/api/workers/all');
  //   employees.value = await empRes.json();
  //
  //   console.log("EMPP", employees.value);
  // } catch (err) {
  //   console.error('Ошибка загрузки сотрудников:', err);
  // }
});

const loadEmployeesForType = async (type) => {
  // Если уже загружено или в процессе загрузки — не дёргаем API
 // const normalizedType = type || '';

  if (employeesByType.value[type] || employeesLoading.value[type]) {
    return;
  }

  employeesLoading.value[type] = true;


  //console.log(`Загрузка сотрудников для типа: "${type}" (typeof: ${typeof type})`);

  try {
    // 👈 Ключевое изменение: передаём type в запрос
    const res = await fetch(`/api/workers/all?type=${type}`);
    //console.log(`🌐 Запрос: ${res}`);

    if (!res.ok) throw new Error('Не удалось загрузить сотрудников');
    employeesByType.value[type] = await res.json();
  } catch (err) {
    console.error(`Ошибка загрузки сотрудников для ${type}:`, err);
    employeesByType.value[type] = []; // fallback
  } finally {
    employeesLoading.value[type] = false
  }
};

// Хелпер для шаблона: возвращает список + триггерит загрузку при необходимости
const getEmployeesForType = (type) => {
  if (!employeesByType.value[type] && !employeesLoading.value[type]) {
    loadEmployeesForType(type); // запускаем загрузку
  }

  return employeesByType.value[type] || [];
};

// --- Все наряды ---
const allItems = computed(() => {
  if (!assembly.value) return [];
  return [assembly.value.main, ...assembly.value.subs];
});

// --- Общее время всей сборки ---
const totalAssemblyTime = computed(() => {
  return allItems.value.reduce((sum, item) => sum + item.total_time, 0);
});

// --- Вспомогательные функции ---
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const getItemTitle = (item) => {
  if (item.part_type === 'main') return `${item.name}`;
  return `${item.name} (часть изделия)`;
};

const getTypeLabel = (type) => {
  const labels = {
    window: 'Окно',
    glyhar: 'Глухарь',
    door: 'Дверь',
    loggia: 'Лоджия',
    vitrage: 'Витраж'
  };
  return labels[type] || type;
};

// --- Синхронизация: минуты ↔ часы ---
const syncValue = (executor) => {
  const minutes = Number(executor.actual_minutes);
  executor.actual_value = isNaN(minutes) ? 0 : parseFloat((minutes / 60).toFixed(3));
};

const syncMinutes = (executor) => {
  const hours = Number(executor.actual_value);
  executor.actual_minutes = isNaN(hours) ? 0 : Number((hours * 60).toFixed(3));
};

// --- Работа с исполнителями ---

// Добавляем нового исполнителя
const addExecutor = (op) => {
  // ВСЕГДА считаем от общей нормы операции (op.minutes)
  const totalValue = op.value; // например, 60 мин
  const newCount = op.executors.length + 1;

  const perPersonValue = parseFloat((totalValue / newCount).toFixed(3));

  op.executors.push({
    employee_id: '',
    actual_minutes: Number(parseFloat((perPersonValue * 60).toFixed(3))),
    actual_value: perPersonValue
  });

  // Перераспределяем поровну
  updateExecutorsEvenly(op);
};

// Удаляем исполнителя
const removeExecutor = (op, idx) => {
  if (op.executors.length <= 1) return;
  op.executors.splice(idx, 1);

  // После удаления — перераспределяем поровну от общей нормы
  updateExecutorsEvenly(op);
};

// Единая функция для перераспределения
const updateExecutorsEvenly = (op) => {
  const totalValue = op.value; // общая норма операции
  const count = op.executors.length;

  if (count === 0) return;

  const perPersonValue = parseFloat((totalValue / count).toFixed(3));

  op.executors.forEach(ex => {
    ex.actual_minutes = Number(parseFloat((perPersonValue * 60).toFixed(3)));
    ex.actual_value = perPersonValue;
  });
};

// --- Сохранение ---
const saveExecutors = async () => {
  const payload = {
    assignments: [],
    update_status: "assigned",
    root_product_id: assembly.value.main.id,
    ready_date: dateAccounting.value,
  };

  const errors = [];

  for (const item of allItems.value) {
    for (const op of item.operations) {

      const validExecutors = op.executors.filter(ex => ex.employee_id);
      if (validExecutors.length === 0) {
        errors.push(`Операция "${op.operation_label}" (${item.name}) — не назначен исполнитель`);
        continue;
      }
      for (const exec of op.executors) {
        if (!exec.employee_id) {
          errors.push(`У операции "${op.operation_label}" (${item.name}) указан исполнитель без ФИО`);
        }
        if (exec.employee_id) {
          payload.assignments.push({
            product_id: item.id,
            operation_name: op.operation_name,
            employee_id: exec.employee_id,
            actual_minutes: exec.actual_minutes || op.minutes,
            actual_value: exec.actual_value || op.value,
            notes: ''
          });
        }
      }
    }
  }

  // Если есть ошибки — не отправляем
  if (errors.length > 0) {
    alert('Не все операции назначены:\n\n' + errors.join('\n'));
    return;
  }

  if (payload.assignments.length === 0) {
    alert('Нет ни одной операции с назначением');
    return;
  }

  //console.log("PAYYY", payload);

  try {
    const res = await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      //alert('Все исполнители назначены');
      router.push('/norm/orders');
    }
  } catch (err) {
    console.error('Ошибка отправки:', err);
    //alert('Не удалось сохранить');
  }
};

// --- Возврат ---
const goBack = () => {
  router.back();
};
</script>

<style scoped>
.assign-workers {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.info-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 8px 12px;
  margin-bottom: 24px;
  font-size: 14px;
}

.info-grid > div {
  margin: 0;
}

.total-time {
  font-weight: bold;
}

.item-section {
  margin-bottom: 32px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

h3 {
  color: #2c3e50;
  margin: 0 0 12px 0;
}

.executors-table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 14px;
}

.executors-table th,
.executors-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.executors-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.text-center {
  text-align: center;
}

/* Строка исполнителя */
.executor-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  align-items: center;
}

.select-employee {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.input-minutes {
  width: 100px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: right;
}

.btn-remove {
  background: #e74c3c;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
}

.btn-add {
  margin-top: 4px;
  padding: 6px 10px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-add:hover {
  background: #218838;
}

.actions {
  margin-top: 30px;
  text-align: right;
}

.btn-cancel {
  padding: 10px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-save {
  padding: 10px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-save:disabled {
  background: #6c757d;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.missing-executor {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
}

.executor-headers {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: #6c757d;
  text-align: right;
}

.header-label {
  flex: 1;
  white-space: nowrap;
}

.input-date {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}

/* Для small текста под полем */
.info-grid small {
  display: block;
  margin-top: 4px;
}

.input-date,
.select-employee,
.input-minutes {
  width: 20%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.input-date {
  /* Убираем стрелки у date-picker в некоторых браузерах */
  padding-right: 10px;
}

/* Стили для подсказок под полями */
.info-grid small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #666;
  line-height: 1.2;
}

</style>