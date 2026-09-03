<script setup>
/* eslint-disable no-undef */
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// Данные из URL
const legacyId = ref(route.query.legacy_id);
const orderNum = ref(route.query.order_num);

// Поля ввода (сырые данные)
const form = ref({ a: 0, b: 0, c: 0, d: 0 });

// Данные с бэкенда
const existingOps = ref([]);
const customer = ref('');
const loading = ref(false);
const saved = ref(false);
const savedResult = ref(null);
const sqr = ref(0);
const pgm = ref(0);
const count = ref(0);
const calcRezHours = ref(0);

// --- ЗАГРУЗКА ДАННЫХ ПРИ ОТКРЫТИИ ---
onMounted(async () => {
  try {
    const res = await fetch(`/api/orders/nashchelnik/raw/${legacyId.value}`);
    if (!res.ok) throw new Error('Не удалось загрузить данные');

    const data = await res.json();
    //console.log("DATTATAA", data);
    customer.value = data.customer;
    sqr.value = data.sqr || 0;
    pgm.value = data.pgm ? data.pgm / 1000 : 0;
    count.value = data.count || 0;
    existingOps.value = data.existing_ops || [];
    calcRezHours.value = pgm.value + ((sqr.value / pgm.value) * data.count);
  } catch (e) {
    console.error(e);
    alert('Ошибка загрузки данных заказа');
  }
});

// --- ЖИВЫЕ РАСЧЕТЫ (Vue Computed) ---
const calcGibHours = computed(() =>
    (form.value.a * (38.25 / 3600)) + (form.value.b * (42.5 / 3600))
);

const calcEdgeHours = computed(() =>
    (form.value.c * ((38.25 * 1.5) / 3600)) + (form.value.d * ((42.5 * 1.5) / 3600))
);

const gibCount = computed(() => form.value.a + form.value.b + form.value.c + form.value.d);
const edgeCount = computed(() => form.value.c + form.value.d);

// Сумма всех операций (для итоговой строки)
const totalHours = computed(() => {
  const existingSum = existingOps.value.reduce((sum, op) => sum + (op.value || 0), 0);
  return existingSum + calcGibHours.value + calcEdgeHours.value;
});

// --- СОХРАНЕНИЕ ---
const saveAndProceed = async () => {
  loading.value = true;

  // 1. Собираем все операции в один массив
  const operationsToSend = [
    // Старые операции (Резка, Упаковка и т.д.)
    ...existingOps.value.map(op => ({
      operation_name: op.operation_name,
      operation_label: op.operation_name,
      count: op.count,
      value: parseFloat(op.value.toFixed(3)),
      minutes: parseFloat(op.minutes.toFixed(1))
    })),
    // Новая операция: Гиб
    {
      operation_name: 'gib_nashchelnika',
      operation_label: 'Гиб',
      count: gibCount.value,
      value: parseFloat(calcGibHours.value.toFixed(3)),
      minutes: parseFloat((calcGibHours.value * 60).toFixed(1))
    },
    // Новая операция: Отбортовка
    {
      operation_name: 'otbortovka_nashchelnika',
      operation_label: 'Отбортовка',
      count: edgeCount.value,
      value: parseFloat(calcEdgeHours.value.toFixed(3)),
      minutes: parseFloat((calcEdgeHours.value * 60).toFixed(1))
    }
  ];

  // 2. Формируем payload
  const payload = {
    legacy_id: Number(legacyId.value),
    order_num: orderNum.value,
    a: parseFloat(form.value.a),
    b: parseFloat(form.value.b),
    c: parseFloat(form.value.c),
    d: parseFloat(form.value.d),
    count: parseFloat(count.value || 0),
    sqr: parseFloat(sqr.value || 0),
    operations: operationsToSend
  };

  //console.log('Отправляем на бэкэнд:', payload);

  try {
    const res = await fetch('/api/orders/nashchelnik/calc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ошибка сервера: ${res.status} ${errText}`);
    }

    savedResult.value = await res.json();
    saved.value = true;

    // Перенаправление
    router.push('/norm/orders');

  } catch (e) {
    console.error(e);
    alert('Ошибка: ' + e.message);
  } finally {
    loading.value = false;
  }
};

const operationNorms = {
  'Резка': '56 сек за 1м',
  'Разметка': '33 сек за 1шт',
  'Гиб': '38,25 сек до 1,3 м | 42,5 сек от 1,3 м',
  'Отбортовка': '19,125 сек до 1,3 м | 21,25 сек от 1,3 м',
  'Упаковка': '3 мин на 1 уп(10шт)',
};

function getNormDescription(opName) {
  //console.log("NAME", opName)
  return operationNorms[opName] || '—';
}


//const printPage = () => window.print();
const goBack = () => router.back();


import VitrageCalculator from './VitrageCalculator.vue';
const showCalculator = ref(false);
const calculatorTargetField = ref(null); // 'a', 'b', 'c' или 'd'

function openCalculatorFor(fieldName) {
  //console.log('🧮 Открываем калькулятор для поля:', fieldName);
  calculatorTargetField.value = fieldName;
  showCalculator.value = true;
}

// Обработчик применения результата из калькулятора
function handleCalculatorApply(value) {
  //console.log('📥 Получен результат:', value, 'для поля:', calculatorTargetField.value);

  if (calculatorTargetField.value && calculatorTargetField.value in form.value) {
    form.value[calculatorTargetField.value] = value;
    //console.log('✅ Поле', calculatorTargetField.value, 'обновлено:', value);
  }

  calculatorTargetField.value = null;
}

const printPage = () => {
  const printContents = document.getElementById('printable').innerHTML
  const win = window.open('', '', 'width=900,height=650')

  win.document.write(`
    <html>
      <head>
        <title>Печать</title>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 15px;
            text-align: center;
          }

          th, td {
            border: 1px solid black;
            padding: 2px;
          }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
    </html>
  `)

  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
    win.close()
  }, 250);
}
</script>

<template>
  <div class="page-container">
    <!-- Шапка -->
    <div class="header no-print">
      <button @click="goBack" class="btn-back">← Назад</button>
      <h2>Нащельники: {{ orderNum }}</h2>
      <span class="customer">Заказчик: {{ customer }}</span>
    </div>

    <!-- Ввод параметров -->
    <div class="input-section no-print">
      <h3>Параметры нащельника</h3>
      <div class="form-grid">
        <div class="field">
          <label>A. Гиб (до 1300мм)</label>
          <input type="number" v-model.number="form.a" min="0" />
          <button
              type="button"
              @click="openCalculatorFor('a')"
              class="calc-trigger-btn"
              title="Рассчитать по формуле"
          >
            🧮
          </button>
        </div>
        <div class="field">
          <label>B. Гиб (больше 1300мм)</label>
          <input type="number" v-model.number="form.b" min="0" />
          <button
              type="button"
              @click="openCalculatorFor('b')"
              class="calc-trigger-btn"
              title="Рассчитать по формуле"
          >
            🧮
          </button>
        </div>
        <div class="field">
          <label>C. Отбортовка (до 1300мм)</label>
          <input type="number" v-model.number="form.c" min="0" />
          <button
              type="button"
              @click="openCalculatorFor('c')"
              class="calc-trigger-btn"
              title="Рассчитать по формуле"
          >
            🧮
          </button>
        </div>
        <div class="field">
          <label>D. Отбортовка (больше 1300мм)</label>
          <input type="number" v-model.number="form.d" min="0" />
          <button
              type="button"
              @click="openCalculatorFor('d')"
              class="calc-trigger-btn"
              title="Рассчитать по формуле"
          >
            🧮
          </button>
        </div>
      </div>
    </div>

    <!-- Таблица операций -->
    <div class="operations-section">
      <!-- Существующие операции (из системы) -->
      <div v-if="existingOps.length > 0" class="ops-group">
        <table class="ops-table">
          <thead>
          <tr>
            <th>Операция</th>
            <th>Норма на единицу</th>
            <th>Кол-во</th>
            <th>Площадь</th>
            <th>М/п</th>
            <th>Длина реза</th>
            <th>Н/мин</th>
            <th>Н/час</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="op in existingOps" :key="op.name">
            <td>{{ op.operation_label }}</td>
            <td>{{ getNormDescription(op.operation_label) }}</td>
            <td>{{ op.count }}</td>
            <td></td>
            <td></td>
            <td v-if="op.operation_label === 'Резка'">{{ calcRezHours.toFixed(2) }}</td>
            <td v-else></td>
            <td>{{ (op.value * 60).toFixed(1) }}</td>
            <td>{{ op.value?.toFixed(3) }}</td>
          </tr>
          <tr>
            <td>Гиб</td>
            <td>{{ getNormDescription('Гиб') }}</td>
            <td>{{ gibCount }}</td>
            <td></td>
            <td></td>
            <td></td>
            <td>{{ (calcGibHours * 60).toFixed(1) }}</td>
            <td>{{ calcGibHours.toFixed(3) }}</td>
          </tr>
          <tr>
            <td>Отбортовка</td>
            <td>{{ getNormDescription('Отбортовка') }}</td>
            <td>{{ edgeCount }}</td>
            <td></td>
            <td></td>
            <td></td>
            <td>{{ (calcEdgeHours * 60).toFixed(1) }}</td>
            <td>{{ calcEdgeHours.toFixed(3) }}</td>
          </tr>
           <tr>
             <td><strong>Итого</strong></td>
             <td></td>
             <td><strong>{{ count }}</strong></td>
             <td><strong>{{sqr}}</strong></td>
             <td><strong>{{ pgm }}</strong></td>
             <td><strong>{{ calcRezHours.toFixed(2) }}</strong></td>
             <td><strong>{{(totalHours * 60).toFixed(1)}}</strong></td>
             <td><strong>{{totalHours.toFixed(3)}}</strong></td>
           </tr>
          </tbody>
        </table>
      </div>

      <!-- Итого -->
      <div class="total-row no-print">
        <strong>ИТОГО:</strong>
        <span>{{ totalHours.toFixed(3) }} ч</span>
        <span class="minutes">({{ (totalHours * 60).toFixed(1) }} мин)</span>
      </div>
    </div>

<!--    печать-->
    <div class="operations-section no-screen" id="printable">
      <div v-if="existingOps.length > 0" class="ops-group">
        <table class="ops-table">
          <thead>
          <tr>
            <th>Операция</th>
            <th>Норма на единицу</th>
            <th>Кол-во</th>
            <th>Площадь</th>
            <th>М/п</th>
            <th>Длина реза</th>
            <th>Н/мин</th>
            <th>Н/час</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="op in existingOps" :key="op.name">
            <td>{{ op.operation_label }}</td>
            <td>{{ getNormDescription(op.operation_label) }}</td>
            <td>{{ op.count }}</td>
            <td></td>
            <td></td>
            <td v-if="op.operation_label === 'Резка'">{{ calcRezHours.toFixed(2) }}</td>
            <td v-else></td>
            <td>{{ (op.value * 60).toFixed(1) }}</td>
            <td>{{ op.value?.toFixed(3) }}</td>
          </tr>
          <tr>
            <td>Гиб</td>
            <td>{{ getNormDescription('Гиб') }}</td>
            <td>{{ gibCount }}</td>
            <td></td>
            <td></td>
            <td></td>
            <td>{{ (calcGibHours * 60).toFixed(1) }}</td>
            <td>{{ calcGibHours.toFixed(3) }}</td>
          </tr>
          <tr>
            <td>Отбортовка</td>
            <td>{{ getNormDescription('Отбортовка') }}</td>
            <td>{{ edgeCount }}</td>
            <td></td>
            <td></td>
            <td></td>
            <td>{{ (calcEdgeHours * 60).toFixed(1) }}</td>
            <td>{{ calcEdgeHours.toFixed(3) }}</td>
          </tr>
          <tr>
            <td><strong>Итого</strong></td>
            <td></td>
            <td><strong>{{ count }}</strong></td>
            <td><strong>{{sqr}}</strong></td>
            <td><strong>{{ pgm }}</strong></td>
            <td><strong>{{ calcRezHours.toFixed(2) }}</strong></td>
            <td><strong>{{(totalHours * 60).toFixed(1)}}</strong></td>
            <td><strong>{{totalHours.toFixed(3)}}</strong></td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Кнопки действий -->
    <div class="actions no-print">
      <button @click="printPage" class="btn-print">Печать</button>
      <button @click="saveAndProceed" :disabled="loading || saved" class="btn-save">
        {{ loading ? 'Сохранение...' : saved ? 'Сохранено! Переход...' : 'Сохранить' }}
      </button>
      <span v-if="saved" class="hint">Переход к назначению сотрудников...</span>
    </div>
  </div>
  <VitrageCalculator
      v-model:isOpen="showCalculator"
      @apply="handleCalculatorApply"
  />
</template>

<style scoped>
/* --- Обычные стили интерфейса --- */
.page-container { max-width: 700px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
.header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
.customer { margin-left: auto; color: #666; font-size: 14px; }


.input-section { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field label { display: block; font-size: 13px; color: #555; margin-bottom: 4px; }
.field input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }

.operations-section { margin: 25px 0; }


.minutes { color: #64748b; font-weight: normal; font-size: 13px; }

.actions { display: flex; align-items: center; gap: 15px; margin-top: 20px; }
.btn-save, btn-print {
  padding: 12px 24px; background: #2563eb; color: white; border: none;
  border-radius: 6px; font-size: 15px; cursor: pointer; font-weight: 500;
}
.btn-back { padding: 6px 12px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; }

.btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
.hint { color: #10b981; font-size: 14px; }

.ops-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 10px;
  text-align: center;
}

.ops-table th,
.ops-table td {
  padding: 8px 10px;
  border: 1px solid black;
  text-align: center;
}

.no-screen {
  display: none;
}

.single-mode-summary td:last-child {
  font-weight: 500;
  color: #28a745;
}
</style>

