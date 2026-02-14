<script setup>
/* eslint-disable */
import { computed } from 'vue';
import { ref } from 'vue';

const props = defineProps({
  products: {
    type: Array,
    required: true
  }
});


function normalize(str) {
  return (str || '').trim().toLowerCase();
}

function aggregate(items) {
  const total = items.reduce((acc, p) => {
    acc.count += parseFloat(p.count) || 0;
    acc.sqr += parseFloat(p.sqr) || 0;
    acc.hours += parseFloat(p.total_time) || 0;
    acc.money += parseFloat(p.norm_money) || 0;
    return acc;
  }, { count: 0, sqr: 0, hours: 0, money: 0 });

  return {
    count: parseFloat(total.count.toFixed(3)),
    sqr: parseFloat(total.sqr.toFixed(3)),
    hours: parseFloat(total.hours.toFixed(3)),
    money: parseFloat(total.money.toFixed(3))
  };
}

const summaryData = computed(() => {
  const products = props.products;

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

  // --- 4. Все окна = cold + hot + чистые глухари ---
  const allWindows = [...coldWindows, ...hotWindows, ...vitrajDoors];

  const allDoors1p = products.filter(p =>p.type ==='door' && (p.type_izd === '1П' || p.type_izd === '1Пт'));
  const allDoors15p = products.filter(p =>p.type ==='door' && (p.type_izd === '1.5П' || p.type_izd === '1.5Пт'));
  const allDoors2p = products.filter(p =>p.type ==='door' && (p.type_izd === '2П' || p.type_izd === '2Пт'));

  const loggias = products.filter(p => p.type === 'loggia');
  const mosquitoNets = products.filter(p => p.type === 'ms');

  const coldStats = aggregate(coldWindows);
  const hotStats = aggregate(hotWindows);
  const allWindowStats = aggregate(allWindows);
  //const glyharStats = aggregate(glyhar);
  const vitrajStats = aggregate(vitrajDoors);

  const loggiaStats = aggregate(loggias);
  const mosquitoStats = aggregate(mosquitoNets);

  const allDoor1p = aggregate(allDoors1p)
  const allDoor15p = aggregate(allDoors15p)
  const allDoor2p = aggregate(allDoors2p)

  // Формируем группы
  const windowGroups = [
    { type_izd: 'Холодные окна', profile: 'х', ...coldStats },
    { type_izd: 'Теплые окна', profile: 'т', ...hotStats },
    //{ type_izd: 'Всего глухих окон', profile: '', ...glyharStats },
    { type_izd: 'Витраж к двери', profile: '', ...vitrajStats },
    { type_izd: 'Всего окон', profile: '', ...allWindowStats },
    { type_izd: 'Всего 1П дверей', profile: '', ...allDoor1p },
    { type_izd: 'Всего 1.5П дверей', profile: '', ...allDoor15p },
    { type_izd: 'Всего 2П дверей', profile: '', ...allDoor2p },
  ].filter(g => g.count > 0);

  const loggiaGroup = loggiaStats.count > 0 ? [{
    type_izd: 'Лоджии',
    profile: '',
    ...loggiaStats
  }] : [];

  const mosquitoGroup = mosquitoStats.count > 0 ? [{
    type_izd: 'Москитные сетки',
    profile: '',
    ...mosquitoStats
  }] : [];

  // Общие итоги(позже добавятся витражи, москитки)
  const total = [allWindowStats, allDoor1p, allDoor15p, allDoor2p]
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

  return {
    windowGroups,
    loggiaGroup,
    mosquitoGroup,
    totalRounded
  };
});

// Список всех нужных комбинаций
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
  { type_izd: '2Пт', profile: 'ш' }
];

function getFixedGroupingWithUnmatched(products) {
  const mapKey = (p) => {
    const typeIzd = (p.type_izd || '').trim();
    const profile = (p.profile == null ? '' : String(p.profile).trim());
    return `${typeIzd}__${profile}`;
  };

  // Создаём множество ожидаемых ключей
  const expectedKeys = new Set(
      expectedGroups.map(g => {
        const typeIzd = (g.type_izd || '').trim();
        const profile = (g.profile == null ? '' : String(g.profile).trim());
        return `${typeIzd}__${profile}`;
      })
  );

  const productMap = new Map();
  const unmatched = []; // ← сюда попадут "потерянные"

  products.forEach(p => {
    const key = mapKey(p);
    if (expectedKeys.has(key)) {
      if (!productMap.has(key)) {
        productMap.set(key, { count: 0, sqr: 0, hours: 0, money: 0 });
      }
      const acc = productMap.get(key);
      acc.count += p.count || 0;
      acc.sqr += p.sqr || 0;
      acc.hours += p.total_time || 0;
      acc.money += p.norm_money || 0;
    } else {
      // Изделие не попало ни в одну группу
      unmatched.push(p);
    }
  });

  // Формируем фиксированные группы
  const fixedGroups = expectedGroups.map(group => {
    const safeProfile = (group.profile == null ? '' : String(group.profile).trim());
    const key = `${group.type_izd.trim()}__${safeProfile}`;
    const data = productMap.get(key) || { count: 0, sqr: 0, hours: 0, money: 0 };
    return {
      type_izd: group.type_izd,
      profile: group.profile,
      count: parseFloat(data.count.toFixed(3)),
      sqr: parseFloat(data.sqr.toFixed(3)),
      hours: parseFloat(data.hours.toFixed(3)),
      money: parseFloat(data.money.toFixed(3))
    };
  });

  return { fixedGroups, unmatched };
}

const groupingResult = computed(() => {
  return getFixedGroupingWithUnmatched(props.products);
});

const fixedGroupsShow = computed(() => groupingResult.value.fixedGroups);
const unmatchedProducts = computed(() => groupingResult.value.unmatched);

const isDetailsOpen = ref(false);

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

</script>

<template>
  <!-- Если нет данных -->
  <div v-if="!props.products.length" class="no-data">
    Нет данных для отображения.
  </div>

  <!-- Окна и двери -->
  <div v-if="summaryData.windowGroups.length > 0" class="summary-stats">
    <h4>Окна и двери</h4>
    <table class="summary-table">
        <thead>
        <tr>
          <th>Наименование</th>
          <th>Профиль</th>
          <th>Кол-во</th>
          <th>Площадь, м²</th>
          <th>Н/час</th>
          <th>Н/руб</th>
        </tr>
        </thead>
      <tbody>
      <tr v-for="group in summaryData.windowGroups" :key="group.type_izd">
        <td>{{ group.type_izd }}</td>
        <td>{{ group.profile }}</td>
        <td>{{ group.count }}</td>
        <td>{{ group.sqr }}</td>
        <td>{{ group.hours }}</td>
        <td>{{ group.money }}</td>
      </tr>
      </tbody>
    </table>
    </div>

  <!-- Лоджии -->
  <div v-if="summaryData.loggiaGroup.length > 0" class="summary-stats">
    <h4>Лоджии</h4>
    <table class="summary-table">
      <tbody>
      <tr v-for="group in summaryData.loggiaGroup" :key="group.type_izd">
        <td>{{ group.type_izd }}</td>
        <td>{{ group.profile }}</td>
        <td>{{ group.count }}</td>
        <td>{{ group.sqr }}</td>
        <td>{{ group.hours }}</td>
        <td>{{ group.money }}</td>
      </tr>
      </tbody>
    </table>
  </div>

  <!-- Москитные сетки -->
  <div v-if="summaryData.mosquitoGroup.length > 0" class="summary-stats">
    <h4>Москитные сетки</h4>
    <table class="summary-table">
      <tbody>
      <tr v-for="group in summaryData.mosquitoGroup" :key="group.type_izd">
        <td>{{ group.type_izd }}</td>
        <td>{{ group.profile }}</td>
        <td>{{ group.count }}</td>
        <td>{{ group.sqr }}</td>
        <td>{{ group.hours }}</td>
        <td>{{ group.money }}</td>
      </tr>
      </tbody>
    </table>
  </div>

  <!-- Общие итоги -->
  <div v-if="summaryData.totalRounded.count > 0" class="summary-stats total-summary">
    <h4>Всего за месяц</h4>
    <table class="summary-table">
      <thead>
      <tr>
        <th></th>
        <th></th>
        <th>Кол-во</th>
        <th>Площадь, м²</th>
        <th>Н/час</th>
        <th>Н/руб</th>
      </tr>
      </thead>
      <tbody>
      <tr class="total-row">
        <td colspan="2"><strong>Итого:</strong></td>
        <td><strong>{{ summaryData.totalRounded.count }}</strong></td>
        <td><strong>{{ summaryData.totalRounded.sqr }}</strong></td>
        <td><strong>{{ summaryData.totalRounded.hours }}</strong></td>
        <td><strong>{{ summaryData.totalRounded.money }}</strong></td>
      </tr>
      </tbody>
    </table>
  </div>

  <!-- Кнопка разворота -->
  <div class="toggle-section">
    <button @click="isDetailsOpen = !isDetailsOpen" class="btn-toggle">
      {{ isDetailsOpen ? 'Скрыть детали' : 'Показать детальную информацию' }}
    </button>
  </div>

  <!-- Детальная группировка (по клику) -->
  <transition name="slide">
<!--   все изделия попавшие в условия фильтра -->
    <div v-if="isDetailsOpen && fixedGroupsShow.length > 0" class="summary-stats detailed-grouping">
      <h4>Детализация по профилям</h4>
      <table class="summary-table">
        <thead>
        <tr>
          <th>Наименование</th>
          <th>Профиль</th>
          <th>Кол-во</th>
          <th>Площадь, м²</th>
          <th>Н/час</th>
          <th>Н/руб</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="g in fixedGroupsShow" :key="`${g.type_izd}_${g.profile}`">
          <td>{{ g.type_izd }}</td>
          <td>{{ g.profile }}</td>
          <td>{{ g.count }}</td>
          <td>{{ g.sqr }}</td>
          <td>{{ g.hours }}</td>
          <td>{{ g.money }}</td>
        </tr>
        </tbody>
      </table>

      <!--    не попавшие в фильтры изделия-->
      <div v-if="isDetailsOpen && unmatchedProducts.length > 0" class="summary-stats unmatched-grouping">
        <h4 style="color: #e53e3e;">⚠️ Изделия, не попавшие в отчёт</h4>
        <p style="font-size: 12px; color: #e53e3e; margin-bottom: 8px;">
          Эти изделия не соответствуют ни одному из правил группировки.
          Проверьте написание «Наименование» и «Профиль».
        </p>
        <table class="summary-table">
          <thead>
          <tr>
            <th>Заказ</th>
            <th>Наименование</th>
            <th>Профиль</th>
            <th>Тип</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="p in unmatchedProducts" :key="p.id">
            <td>{{ p.order_num }}</td>
            <td>{{ p.type_izd }}</td>
            <td>{{ p.profile }}</td>
            <td>{{ formatType(p.type) }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.no-data {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
}

.summary-stats {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
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
}

.total-row {
  background-color: #ebf8ff !important;
  font-weight: bold;
  color: #2b6cb0;
}

.toggle-section {
  margin: 16px 0;
  text-align: center;
}

.btn-toggle {
  padding: 8px 16px;
  background-color: #edf2f7;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle:hover {
  background-color: #e2e8f0;
}

.unmatched-grouping {
  border: 1px solid #fed7d7;
  background-color: #fff5f5;
}

</style>