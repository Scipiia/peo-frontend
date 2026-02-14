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
          <th>Позиция</th>
          <th>№</th>
          <th>Спецификация</th>
          <th>№ заказа</th>
          <th>корп/дил</th>
          <th>Заказчик</th>
          <th>Вид продукции</th>
          <th>Система</th>
          <th>Наименование</th>
          <th>Профиль</th>
          <th>Кол-во</th>
          <th>Площадь</th>
          <th>Н/час</th>
          <th>Изготовитель</th>
          <th>Н/руб</th>
          <th v-for="emp in employees" :key="emp.id" class="employee-col">
            {{ emp.name }}
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="prod in filteredProductsWithRowNumber"
            :key="prod.id"
            @click="() => openEditModal(prod)"
            class="clickable-row"
        >
          <td>
            <span :class="`status-badge status-${prod.status}`">{{ getTypeStatus(prod.status) }}</span>
          </td>
          <td>{{ prod.position }}</td>
          <td>{{ prod.rowNumber }}</td>
          <td>{{ prod.parent_assembly }}</td>
          <td>{{ prod.order_num }}</td>
          <td
              :class="{
                'profile-empty': prod.customer_type === '',
                'cell-warning': prod.customer_type === ''
            }"
          >
            {{ prod.customer_type }}
          </td>
          <td>{{ prod.customer }}</td>
          <td>{{ formatType(prod.type) }}</td>
          <td
              :class="{
                'profile-empty': prod.systema === '',
                'cell-warning': prod.systema === ''
            }"
          >
            {{ prod.systema }}
          </td>
          <td
              :class="{
                'profile-empty': prod.type_izd === '',
                'cell-warning': prod.type_izd === ''
            }"
          >
            {{ prod.type_izd }}
          </td>
          <td
              :class="{
                'profile-empty': prod.profile === '',
                'cell-warning': prod.profile === ''
            }"
          >
            {{ prod.profile }}
          </td>
          <td>{{ prod.count }}</td>
          <td>{{ prod.sqr }}</td>
          <td>{{ prod.total_time }}</td>
          <td
              :class="{
                'profile-empty': prod.brigade === '',
                'cell-warning': prod.brigade === ''
            }"
          >
            {{ prod.brigade }}
          </td>
          <td>{{ prod.norm_money }}</td>
          <td v-for="emp in employees" :key="emp.id" class="employee-col">
            {{ getValue(prod, emp.id) }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Кнопка экспорта -->
    <div class="actions">
      <button @click="exportToExcel" class="btn-export">
         Экспорт в Excel
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import ExcelJS from 'exceljs';

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
    label: 'Лоджии',
    types: ['loggia']
  },
  mosquito_net: {
    label: 'Москитные сетки',
    types: ['ms']
  }
};

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

// ========== ВЫЧИСЛЯЕМЫЕ СВОЙСТВА ==========

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

// ========== ФОРМАТИРОВАНИЕ ==========
const formatType = (type) => {
  const map = {
    'window': 'Окно',
    'door': 'Дверь',
    'loggia': 'Лоджия',
    'ms': 'Москитная сетка',
    'glyhar': 'Глухое окно',
  };
  return map[type] || type;
};

const getValue = (product, employeeId) => {
  const value = product.employee_value?.[String(employeeId)];
  return value ? parseFloat(value.toFixed(3)) : '';
};

// ========== ЭКСПОРТ В EXCEL ==========
const exportToExcel = async () => {
  const monthName = months[month.value - 1];
  const exportYear = year.value;

  const activeType = activeBackendTypes.value;

  let typeLabel = 'Все типы';
  const combinedSet = new Set(['window', 'door', 'glyhar']);
  const activeSet = new Set(activeType);

  if (activeType.length > 4) {
    typeLabel = 'Все типы';
  } else if (
      activeSet.size === combinedSet.size &&
      [...combinedSet].every(t => activeSet.has(t))
  ) {
    typeLabel = 'Окна';
  } else if (activeSet.size === 1 && activeSet.has('loggia')) {
    typeLabel = 'Лоджии';
  } else if (activeSet.size === 1 && activeSet.has('ms')) {
    typeLabel = 'Москитки';
  } else {
    typeLabel = [...new Set(activeType.map(formatType))].sort().join(', ');
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Отчёт ПЭО - ${monthName} ${exportYear} ${typeLabel}`);

  // === 1. Заголовки основной таблицы ===
  const headers = [
    '№', 'Спецификация', '№ заказа', 'корп/дил', 'Заказчик',
    'Вид продукции', 'Система', 'Наименование', 'Профиль',
    'Количество', 'Площадь', 'Н/час', 'Изготовитель', 'Н/руб'
  ];

  const employeeNames = employees.value.map(emp => emp.name);
  const allHeaders = [...headers, ...employeeNames, 'Итого'];

  const headerRow = worksheet.addRow(allHeaders);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
    cell.border = { style: 'thin' };
  });

  // === 2. Данные строк ===
  filteredProductsWithRowNumber.value.forEach(prod => {
    const row = [
      prod.rowNumber,
      prod.parent_assembly || '',
      prod.order_num || 'не определено',
      prod.customer_type || 'не определено',
      prod.customer || 'не определено',
      formatType(prod.type),
      prod.systema || 'не определено',
      prod.type_izd || 'не определено',
      prod.profile || 'не определено',
      prod.count || 0,
      prod.sqr || 0,
      prod.total_time || 0,
      prod.brigade || 'не определено',
      prod.norm_money || 0
    ];

    // === Значения по сотрудникам ===
    const employeeValues = employees.value.map(emp => {
      const val = getValue(prod, emp.id);
      return val ? parseFloat(val) : 0;
    });

// === Сумма по всем сотрудникам ===
    const totalEmpValue = employeeValues.reduce((sum, val) => sum + val, 0);
    const totalEmpFormatted = totalEmpValue > 0 ? parseFloat(totalEmpValue.toFixed(3)) : '';

// === Форматированные строки для ячеек (оставляем как было, но с пустыми строками для 0) ===
    const employeeValueCells = employees.value.map(emp => {
      const val = getValue(prod, emp.id);
      return val ? val : ''; // пусто, если 0 или нет значения
    });

// === Добавляем итоговый столбец после всех сотрудников ===
    const fullRow = [
      ...row,
      ...employeeValueCells,
      totalEmpFormatted
    ];

    const excelRow = worksheet.addRow(fullRow);
    // последний столбец — итого по сотрудникам
    if (totalEmpValue > 0 && Math.abs(totalEmpValue - (parseFloat(prod.total_time) || 0)) > 0.001) {
      // Например, выделить жёлтым фоном
      excelRow.eachCell((cell, colNum) => {
        if (colNum === fullRow.length) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF99' }
          };
        }
      });
    }

    excelRow.eachCell((cell) => {
      cell.font = { size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { style: 'thin' };

      if (typeof cell.value === 'string' && cell.value === 'не определено') {
        cell.font = { bold: true, size: 10, color: { argb: 'FFFF0000' } };
      }
    });
  });

  // ===  Пустая строка перед итогами ===
  worksheet.addRow([]);

  // ===  Сводная статистика (по типам) ===
  // (оставлю для полноты, но можно закомментировать)

  const products = filteredProductsWithRowNumber.value;

  function normalize(str) {
    return (str || '').trim().toLowerCase();
  }

  function aggregate(items) {
    const total = items.reduce((acc, p) => {
      acc.sqr += parseFloat(p.sqr) || 0;
      acc.hours += parseFloat(p.total_time) || 0;
      acc.money += parseFloat(p.norm_money) || 0;
      acc.count += parseInt(p.count) || 0;
      return acc;
    }, { count: 0, sqr: 0, hours: 0, money: 0 });

    return {
      count: parseFloat(total.count.toFixed(3)),
      sqr: parseFloat(total.sqr.toFixed(3)),
      hours: parseFloat(total.hours.toFixed(3)),
      money: parseFloat(total.money.toFixed(3))
    };
  }

  // --- 1. Холодные и тёплые окна ---
  const coldWindows = products.filter(p =>
      (p.type === 'window' || p.type === 'glyhar') && normalize(p.systema).includes('х') && normalize(p.type_izd) !== 'витраж к двери'
  );

  const hotWindows = products.filter(p =>
      (p.type === 'window' || p.type === 'glyhar') && normalize(p.systema).includes('т') && normalize(p.type_izd) !== 'витраж к двери'
  );

  // --- 2. Глухие окна (только те, где НЕ витраж к двери) ---
  // const glyhar = products.filter(p =>
  //     p.type === 'glyhar' &&
  //     normalize(p.type_izd) !== 'витраж к двери'
  // );

  // --- 3. Витраж к двери (отдельно) ---
  const vitrajDoors = products.filter(p =>
      p.type === 'glyhar' &&
      normalize(p.type_izd) === 'витраж к двери'
  );

  const allWindows = [...coldWindows, ...hotWindows, ...vitrajDoors];

  // const coldWindows = products.filter(p =>
  //     p.type === 'window' && normalize(p.systema).includes('х')
  // );
  // const hotWindows = products.filter(p =>
  //     p.type === 'window' && normalize(p.systema).includes('т')
  // );
  //const allWindows = products.filter(p => p.type === 'window' || p.type === 'glyhar');
  // const doors1p = products.filter(p => p.type === 'door' && ['1П', '1Пт'].includes(p.type_izd));
  // const doors15p = products.filter(p => p.type === 'door' && ['1.5П', '1.5Пт'].includes(p.type_izd));
  // const doors2p = products.filter(p => p.type === 'door' && ['2П', '2Пт'].includes(p.type_izd));

  const doors1p = products.filter(p =>p.type ==='door' && (p.type_izd === '1П' || p.type_izd === '1Пт'));
  const doors15p = products.filter(p =>p.type ==='door' && (p.type_izd === '1.5П' || p.type_izd === '1.5Пт'));
  const doors2p = products.filter(p =>p.type ==='door' && (p.type_izd === '2П' || p.type_izd === '2Пт'));

  //const glyhar = products.filter(p => p.type === 'glyhar' && p.type_izd === 'окно гл.');
  //const vitrajDoors = products.filter(p => normalize(p.type_izd) === 'витраж к двери');

  //TODO
  //const loggias = products.filter(p => p.type === 'loggia');
  //const mosquitoNets = products.filter(p => p.type === 'ms');

  const coldStats = aggregate(coldWindows);
  const hotStats = aggregate(hotWindows);
  const allWindowStats = aggregate(allWindows);
  const door1pStats = aggregate(doors1p);
  const door15pStats = aggregate(doors15p);
  const door2pStats = aggregate(doors2p);
  const vitrajStats = aggregate(vitrajDoors);
  //const glyharStats = aggregate(glyhar);
  //TODO на будущее
  //const loggiaStats = aggregate(loggias);
  //const mosquitoStats = aggregate(mosquitoNets);

  const total = [allWindowStats, door1pStats, door15pStats, door2pStats] //glyharStats vitrajStats
      .reduce((acc, g) => ({
        count: acc.count + g.count,
        sqr: acc.sqr + g.sqr,
        hours: acc.hours + g.hours,
        money: acc.money + g.money
      }), { count: 0, sqr: 0, hours: 0, money: 0 });

  const totalRounded = {
    count: parseFloat(total.count.toFixed(3)),
    sqr: parseFloat(total.sqr.toFixed(3)),
    hours: parseFloat(total.hours.toFixed(3)),
    money: parseFloat(total.money.toFixed(3))
  };

  // === 5. Заголовок сводки ===
  const summaryHeader = worksheet.addRow(['Сводная статистика']);
  summaryHeader.getCell(1).font = { bold: true, size: 14 };
  worksheet.addRow([]); // пустая строка

  const summaryTableHeaders = ['', '', 'Кол-во', 'Площадь, м²', 'Н/час', 'Н/руб'];
  const summaryHeaderRow = worksheet.addRow(summaryTableHeaders);
  summaryHeaderRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } };
    cell.border = { style: 'thin' };
  });

  const addSummaryRow = (name, profile, data) => {
    const row = worksheet.addRow([
      name,
      '',
      data.count,
      data.sqr,
      data.hours,
      data.money
    ]);
    row.eachCell(cell => {
      cell.border = { style: 'thin' };
      if (data.count === 0 && data.sqr === 0 && data.hours === 0 && data.money === 0) {
        cell.font = { italic: true, color: { argb: 'FF888888' } };
      }
    });
  };

  addSummaryRow('Холодные окна', '', coldStats);
  addSummaryRow('Теплые окна', '', hotStats);
  addSummaryRow('Витраж к двери', '', vitrajStats);
  addSummaryRow('Всего окон', '', allWindowStats);
  addSummaryRow('Всего 1П дверей', '', door1pStats);
  addSummaryRow('Всего 1.5П дверей', '', door15pStats);
  addSummaryRow('Всего 2П дверей', '', door2pStats);
  //if (glyharStats.count > 0) addSummaryRow('Глухие окна', '', glyharStats);
  //addSummaryRow('Лоджии', '', loggiaStats);
  //addSummaryRow('Москитные сетки', '', mosquitoStats);

  worksheet.addRow([]);
  const totalRow = worksheet.addRow(['', 'ИТОГО:', totalRounded.count, totalRounded.sqr, totalRounded.hours, totalRounded.money]);
  totalRow.eachCell((cell, colNum) => {
    if (colNum >= 3) {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFFFF' } };
    }
  });

  // === 6. ПУСТАЯ СТРОКА ПЕРЕД ДЕТАЛИЗАЦИЕЙ ===
  worksheet.addRow([]);
  worksheet.addRow([]);

  // === ДЕТАЛЬНАЯ ГРУППИРОВКА ПО ПРОФИЛЯМ  ===

  const expectedGroups = [
    { type_izd: 'окно гл.', profile: 'ах' },
    { type_izd: 'окно гл.', profile: 'ат' },
    { type_izd: 'окно гл.', profile: 'ш' },
    { type_izd: 'окно гл.', profile: 'сх' },
    { type_izd: 'окно гл.', profile: 'ст' },
    { type_izd: 'окно пов.-отк.', profile: 'ах' },
    { type_izd: 'окно пов.-отк.', profile: 'ат' },
    { type_izd: 'окно пов.-отк.', profile: 'ст' },
    { type_izd: 'окно пов.-отк.', profile: 'сх' },
    { type_izd: 'окно пов.-отк.', profile: 'ш' },
    { type_izd: '1П', profile: 'ах'},
    { type_izd: '1П', profile: 'сх'},
    { type_izd: '1Пт', profile: 'ат' },
    { type_izd: '1Пт', profile: 'ст' },
    { type_izd: '1Пт', profile: 'ш' },
    { type_izd: '1.5П', profile: 'ах' },
    { type_izd: '1.5П', profile: 'сх' },
    { type_izd: '1.5Пт', profile: 'ат' },
    { type_izd: '1.5Пт', profile: 'ст' },
    { type_izd: '1.5Пт', profile: 'ш' },
    { type_izd: '2П', profile: 'ах' },
    { type_izd: '2П', profile: 'сх' },
    { type_izd: '2Пт', profile: 'ат' },
    { type_izd: '2Пт', profile: 'ст' },
    { type_izd: '2Пт', profile: 'ш' },
  ];

  // Заголовок детальной группировки
  const detailHeader = worksheet.addRow(['Детализация по профилям']);
  detailHeader.getCell(1).font = { bold: true, size: 14 };
  worksheet.addRow([]); // пустая строка

  // Заголовки таблицы детализации
  const detailHeaders = [
    'Наименование',
    'Профиль',
    'Кол-во',
    'Площадь',
    'н/час',
    'н/руб',
  ];
  const detailHeaderRow = worksheet.addRow(detailHeaders);
  detailHeaderRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } };
    cell.border = { style: 'thin' };
  });

  // Функция для суммирования по группе
  const groupAggregates = {};

  // Инициализируем все группы
  expectedGroups.forEach(group => {
    const key = `${group.type_izd}__${group.profile}`;
    groupAggregates[key] = {
      count: 0,
      sqr: 0,
      hours: 0,
      money: 0,
    };
  });

  // Агрегируем данные
  products.forEach(p => {
    const key = `${p.type_izd}__${p.profile}`;
    if (!groupAggregates[key]) return; // пропускаем неизвестные комбинации

    const agg = groupAggregates[key];
    agg.count += parseInt(p.count) || 0;
    agg.sqr += parseFloat(p.sqr) || 0;
    agg.hours += parseFloat(p.total_time) || 0;
    agg.money += parseFloat(p.norm_money) || 0;
  });

  // Добавляем строки
  expectedGroups.forEach(group => {
    const key = `${group.type_izd}__${group.profile}`;
    const agg = groupAggregates[key] || {
      count: 0,
      sqr: 0,
      hours: 0,
      money: 0,
    };

    const row = worksheet.addRow([
      group.type_izd,
      group.profile,
      agg.count,
      parseFloat(agg.sqr.toFixed(3)),
      parseFloat(agg.hours.toFixed(3)),
      parseFloat(agg.money.toFixed(3)), // как в примере — 2 знака
    ]);

    row.eachCell(cell => {
      cell.border = { style: 'thin' };
      if (agg.count === 0 && agg.sqr === 0 && agg.hours === 0 && agg.money === 0) {
        cell.font = { italic: true, color: { argb: 'FF888888' } };
      }
    });
  });

  // === Автоширина ===
  worksheet.columns.forEach(column => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: true }, cell => {
      const length = cell.value ? String(cell.value).length : 10;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(maxLength + 2, 30);
  });

  // === 9. Экспорт ===
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `peo-report-${exportYear}-${String(month.value).padStart(2, '0')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
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

    //console.log("RESSS", res);
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
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

td:nth-child(16),
th:nth-child(16) {
  background-color: #ebf8ff !important;
  font-weight: bold;
  color: #2c5282;
}

td:nth-child(14),
th:nth-child(14) {
  background-color: #ebf8ff !important;
  font-weight: bold;
  color: royalblue;
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

.summary-stats {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  font-size: 14px;
}

.summary-stats h4 {
  margin: 0 0 12px 0;
  color: #2d3748;
  font-size: 15px;
  font-weight: 600;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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