<template>
  <div class="peo-report">
    <!-- Фильтры по типу -->
    <div class="filters">
      <!-- Год -->
      <div class="filter-group">
        <label for="year-select">Год</label>
        <select id="year-select" v-model="year" @change="loadData" class="filter-select">
          <option v-for="y in [2023, 2024, 2025, 2026, 2027]" :key="y">{{ y }}</option>
        </select>
      </div>

      <!-- Месяц -->
      <div class="filter-group">
        <label for="month-select">Месяц</label>
        <select id="month-select" v-model="month" @change="loadData" class="filter-select">
          <option v-for="(name, index) in months" :key="index + 1" :value="index + 1">
            {{ name }}
          </option>
        </select>
      </div>

      <!-- Номер заказа -->
      <div class="filter-group">
        <label for="order-input">№ заказа</label>
        <input
            id="order-input"
            type="text"
            v-model="orderNum"
            placeholder=""
            @input="loadData"
            class="filter-input"
        />
      </div>

      <div class="actions">
        <button @click="downloadExcel" class="btn-export">
          Экспорт в Excel
        </button>
      </div>

      <!-- Типы продукции -->
      <div class="type-filters">
        <label v-for="(group, key) in typeGroups" :key="key" class="checkbox-label">
          <input
              type="checkbox"
              :value="key"
              v-model="selectedTypes"
              @change="loadData"
              class="checkbox-input"
          />
          <span class="checkbox-text">{{ group.label }}</span>
        </label>
      </div>
    </div>

    <!-- После фильтров -->
    <SummaryReport :products="filteredProductsWithRowNumber" />

    <!-- Модальное окно (если нужно редактировать) -->
    <EditProductModal
        v-if="editingProduct"
        :product="editingProduct"
        :employees="employees"
        @close="saveAndClose"
        @cancel="editingProduct = null"
    />

    <!-- Таблица -->
    <div class="table-container">
      <table class="report-table">
        <thead>
        <tr>
          <th>Статус</th>
          <th>№</th>

          <!-- Динамические колонки -->
          <th
              v-for="(col, index) in dynamicColumns"
              :key="`${col.key}_${index}`"
              :style="{ width: col.width, textAlign: col.align || 'left' }"
              class="dynamic-col"
          >
            {{ col.label }}
          </th>

          <!-- Колонки сотрудников -->
          <th
              v-for="emp in employees"
              :key="emp.id"
              class="employee-col"
          >
            {{ emp.name }}
          </th>
        </tr>
        </thead>
        <tbody>
          <tr v-for="prod in filteredProductsWithRowNumber" :key="prod.id" class="clickable-row" @click="() => openEditModal(prod)">
                <!-- Статические колонки (всегда в начале) -->
            <td>
              <span :class="`status-badge status-${prod.status}`">
                {{ getTypeStatus(prod.status) }}
              </span>
            </td>
            <td>{{ prod.rowNumber }}</td>

              <!-- 👇 ДИНАМИЧЕСКИЕ КОЛОНКИ (порядок из computed) -->
            <td
                v-for="col in dynamicColumns"
                :key="col.key"
                :style="{ textAlign: col.align || 'left' }"
                :class="[
                      col.class,
                      { 'cell-empty': getValueByColumn(prod, col.key) === '—' }
                        ]"
            >
              {{ getValueByColumn(prod, col.key) }}
            </td>
              <!-- Статические колонки (в конце) -->
            <td v-for="emp in employees" :key="emp.id" class="employee-col">
              {{ getValue(prod, emp.id) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const currentYear = new Date().getFullYear();
const year = ref(currentYear); // можно добавить выбор года, если нужно
const month = ref(new Date().getMonth() + 1); // текущий месяц: 1–12
const orderNum = ref('');

//TODO модальное окно
const editingProduct = ref(null);
const openEditModal = (product) => {
  // Создаём копию, чтобы не изменять оригинальный объект до сохранения
  editingProduct.value = { ...product };
};

const saveAndClose = async (updatedProduct) => {
  try {
    const cleanedProduct = {
      ...updatedProduct,
      sqr: parseFloat(updatedProduct.sqr) || 0,
      norm_money: parseFloat(updatedProduct.norm_money) || 0,
      coefficient: parseFloat(updatedProduct.coefficient),
      total_time: parseFloat(updatedProduct.total_time) || 0,
      count: parseInt(updatedProduct.count) || 0,
    };

    await axios.put(`/api/final/update/${updatedProduct.id}`, cleanedProduct);

    // Обновляем данные в списке
    const index = products.value.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      products.value[index] = updatedProduct;
    }

    editingProduct.value = null;
    loadData(); // или просто обнови computed
  } catch (error) {
    console.error('Ошибка сохранения', error);
  }
};
import EditProductModal from "@/components/EditProductModal.vue";
import SummaryReport from '@/components/SummaryStats.vue';

const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const typeStatus = {
  assigned: "Сотрудники назначены",
  final: "Готов",
};

const getTypeStatus = (type) => {
  return typeStatus[type] || type;
};

const filterFrom = computed(() => {
  return `${year.value}-${String(month.value).padStart(2, '0')}-01`;
});

const filterTo = computed(() => {
  const nextMonth = new Date(year.value, month.value, 0); // 0 = последний день
  const day = String(nextMonth.getDate()).padStart(2, '0');
  const mm = String(month.value).padStart(2, '0');
  return `${year.value}-${mm}-${day}`;
});

// ТИПЫ
const typeGroups = {
  combined: {
    label: 'Окна и двери',
    types: ['window', 'door', 'glyhar']
  },
  loggia: {
    label: 'Лоджии и витражи',
    types: ['loggia', 'vitrage']
  },
  mosquito_net: {
    label: 'Москитные сетки',
    types: ['ms']
  }
};

// TODO динамические колонки

// Вычисляем, какие колонки показывать, на основе выбранных типов
const dynamicColumns = computed(() => {
  const selected = activeBackendTypes.value;
  const hasWindows = selected.some(t => ['window', 'door', 'glyhar'].includes(t));
  const hasLoggias = selected.some(t => ['loggia', 'vitrage'].includes(t));

  const columns = [];

  if (hasWindows) {
    columns.push(
        {key: 'parent_assembly', label: 'спецификация', width: '90px', align: 'center'}
    )
  }

  if (hasLoggias) {
    columns.push(
        {key: 'parent_assembly', label: 'витраж', width: '90px', align: 'center'}
    )
  }

  columns.push(
      {key: 'order_num', label: '№ заказа', width: '100px'},
      {key: 'customer_type', label: 'тип клиента', width: '100px'},
      {key: 'customer', label: 'заказчик', width: '100px'},
  )

  if (hasLoggias) {
    columns.push(
        {key: 'type_izd', label: 'наименование', width: '90px', align: 'center'},
        {key: 'count', label: 'количество', width: '90px', align: 'center'},
        {key: 'sqr', label: 'площадь', width: '90px', align: 'center'},
        {key: 'sqr_stv', label: 'площадь створки', width: '90px', align: 'center'},
        {key: 'total_time', label: 'н/час', width: '90px', align: 'center', class: 'col-total'},
    )
  }

  if (hasWindows) {
    columns.push(
        {key: 'type', label: 'вид продукции', width: '90px', align: 'center'},
        {key: 'systema', label: 'система', width: '90px', align: 'center'},
        {key: 'type_izd', label: 'наименование', width: '90px', align: 'center'},
        {key: 'profile', label: 'профиль', width: '90px', align: 'center'},
        {key: 'count', label: 'количество', width: '90px', align: 'center'},
        {key: 'sqr', label: 'площадь', width: '90px', align: 'center'},
        {key: 'total_time', label: 'н/час', width: '90px', align: 'center', class: 'col-total'},
    )
  }


  columns.push(
      { key: 'brigade', label: 'изготовитель', width: '80px', align: 'center' },
      { key: 'norm_money', label: 'Н/руб', width: '80px', align: 'center', class: 'col-money' },
  );

  return columns;
});

// Получает значение из объекта по ключу, например 'parent_assembly' или 'coefficient'
const getValueByColumn = (product, columnKey) => {
  const value = product[columnKey];

  // 1. Обработка пустых значений
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  // 2. Форматирование типа изделия (если колонка называется 'type')
  if (columnKey === 'type') {
    return formatType(value);
  }

  // 3. Форматирование чисел
  if (typeof value === 'number') {
    // Для денег и площадей — 3 знака после запятой
    if (['sqr', 'sqr_stv', 'norm_money', 'total_time'].includes(columnKey)) {
      return parseFloat(value.toFixed(3));
    }
    // Для количества — целое число
    if (columnKey === 'count') {
      return parseInt(value);
    }
    // Для коэффициента — 3 знака
    if (columnKey === 'coefficient') {
      return parseFloat(value.toFixed(3));
    }
    return value;
  }

  // 4. Всё остальное — как есть (строки, даты и т.д.)
  return value;
};

//TODO

const selectedTypes = ref(['combined']);

// Активные реальные типы (backend-уровень)
const activeBackendTypes = computed(() => {
  const result = [];
  selectedTypes.value.forEach(key => {
    const group = typeGroups[key];
    if (group) {
      result.push(...group.types);
    }
  });

  return result;
});

// ========== ДАННЫЕ ==========
const employees = ref([]);
const products = ref([]);


// Присваиваем порядковые номера
const productsWithRowNumber = computed(() => {
  const list = products.value || [];

  const sortedList = [...list].sort((a, b) => {
    // Сначала сравниваем по ready_date
    const dateA = a.ready_date ? new Date(a.ready_date) : new Date(0);
    const dateB = b.ready_date ? new Date(b.ready_date) : new Date(0);
    const dateDiff = dateB - dateA; // DESC: свежие первыми

    if (dateDiff !== 0) return dateDiff;

    // Если оба main или оба sub — по ID (стабильность)
    return a.id - b.id;
  });

  const mainIdToRowNumber = new Map();
  let counter = 1;
  for (const item of sortedList) {
    if (item.part_type === 'main') {
      mainIdToRowNumber.set(item.id, counter++);
    }
  }

  // 3. Добавляем rowNumber ко всем изделиям
  return sortedList.map(product => {
    let rowNumber = 0;
    if (product.part_type === 'main') {
      rowNumber = mainIdToRowNumber.get(product.id) || 0;
    } else if (product.part_type === 'sub' && product.parent_product_id) {
      rowNumber = mainIdToRowNumber.get(product.parent_product_id) || 0;
    }
    return { ...product, rowNumber };
  });
});

// Фильтруем продукты по выбранным группам
const filteredProductsWithRowNumber = computed(() => {
  const allowedTypes = activeBackendTypes.value;
  if (allowedTypes.length === 0) return [];

  return productsWithRowNumber.value.filter(p => allowedTypes.includes(p.type));
});

const formatType = (type) => {
  if (!type) return '—';

  const map = {
    'window': 'Окно',
    'door': 'Дверь',
    'loggia': 'Лоджия',
    'vitrage': 'Витраж',
    'ms': 'Москитная сетка',
    'glyhar': 'Глухое окно',
  };

  return map[type] || type;
};

const getValue = (product, employeeId) => {
  const value = product.employee_value?.[String(employeeId)];
  return value ? parseFloat(value.toFixed(3)) : '';
};

// ========== ЗАГРУЗКА ДАННЫХ ==========
const loadData = async () => {
  try {
    const params = new URLSearchParams();

    // Отправляем каждый активный тип как ?type=...
    activeBackendTypes.value.forEach(type => {
      params.append('type', type);
    });

    // Диапазон дат по месяцу
    params.append('from', filterFrom.value);
    params.append('to', filterTo.value);
    params.append('order_num', orderNum.value);



    const res = await axios.get(`/api/all_final_order?${params}`);
    employees.value = res.data.employees;
    products.value = res.data.products;

    //console.log(products.value);

  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
};

const loading = ref(false);

const downloadExcel = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();

    // Отправляем каждый активный тип как ?type=...
    activeBackendTypes.value.forEach(type => {
      params.append('type', type);
    });

    // Диапазон дат по месяцу
    params.append('from', filterFrom.value);
    params.append('to', filterTo.value);
    params.append('order_num', orderNum.value);


    const response = await axios.get('/api/report/excel', {
      params: params, // передаем from, to, order_num и т.д.
      responseType: 'blob', // КРИТИЧНО: говорим axios ждать бинарные данные
    });

    // Создаем ссылку в памяти браузера
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Имя файла (можно достать из заголовка или задать самому)
    link.setAttribute('download', `report_${new Date().toLocaleDateString()}.xlsx`);

    document.body.appendChild(link);
    link.click();

    // Чистим за собой
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Ошибка при загрузке Excel:', error);
    alert('Не удалось скачать файл');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.peo-report {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* Группировка label + input/select */
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.filter-group label {
  font-weight: 500;
  color: #333;
  font-size: 13px;
  min-width: 50px;
  text-align: right;
}

/* Селекты */
.filter-select,
.filter-input {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 13px;
  background-color: white;
  transition: border 0.2s ease, box-shadow 0.2s ease;
  min-width: 100px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.filter-input {
  min-width: 120px;
  padding: 6px 10px;
}

/* Чекбоксы — кастомный вид */
.type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-left: auto;
  padding-left: 12px;
  border-left: 1px solid #ddd;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-text {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: #fff;
  transition: all 0.2s;
  color: #444;
}

.checkbox-label:hover .checkbox-text {
  border-color: #2563eb;
  color: #1e40af;
  background-color: #eff6ff;
}

.checkbox-input:checked + .checkbox-text {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
  color: #2d3748;
}

.report-table th,
.report-table td {
  border: 1px solid #eee;
  padding: 8px 10px;
  text-align: center;
  font-size: 13px;
}

.report-table th {
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
  font-weight: 600;
}

.employee-col {
  min-width: 60px;
}

.actions {
  text-align: center;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-export:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.btn-export:active {
  transform: translateY(0);
}

.col-total {
  font-weight: 700;
  color: #000;
  background-color: #f6f0ff !important;
}

.col-money {
  font-weight: 700;
  color: #000;
  background-color: #fff9db !important;
}

.summary-stats h4 {
  margin: 0 0 12px 0;
  color: #2d3748;
  font-size: 15px;
  font-weight: 600;
}


.summary-table th,
.summary-table td {
  padding: 8px 10px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.summary-table th {
  background-color: #edf2f7;
  color: #4a5568;
  font-weight: 600;
  font-size: 13px;
  text-transform: none;
}

.summary-table tbody tr:hover {
  background-color: #f7fafc;
}

/* Итоговая строка */
.total-row {
  background-color: #ebf8ff !important;
  border-top: 2px solid #bee3f8;
}

.total-row td {
  font-weight: bold;
  color: #2b6cb0;
  padding: 10px 10px;
}

.cell-warning {
  background-color: #fee;
  color: #c33 !important;
  font-weight: 500;
  border-left: 3px solid #c33;
}

/* Опционально: подсказка при наведении */
.cell-warning:hover {
  background-color: #fdd;
  transition: background-color 0.2s;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.1s;
}

.clickable-row:hover {
  background-color: #f0f8ff !important;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  line-height: 1.3;
  min-height: 22px;
  box-sizing: border-box;
}

.status-badge.status-final { background: #28a745;  }
.status-badge.status-assigned{ background: #fd7e14; }
</style>