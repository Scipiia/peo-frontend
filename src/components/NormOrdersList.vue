<template>
  <div class="orders-page">
    <h2>Нормированные заказы</h2>

    <!-- Фильтры -->
    <div class="filters">
      <div class="filter-group">
        <label>Номер заказа</label>
        <input
            v-model="filters.order_num"
            type="text"
            placeholder=""
            @input="applyFilters"
        />
      </div>

      <div class="filter-group">
        <label>Тип изделия</label>
        <select v-model="filters.type" @change="applyFilters">
          <option value="">Все типы</option>
          <option value="window">Окна</option>
          <option value="glyhar">Глухари</option>
          <option value="door">Двери</option>
          <option value="loggia">Лоджии</option>
          <option value="vitrage">Витражи</option>
        </select>
      </div>
    </div>

    <!-- Таблица -->
    <table class="orders-table" v-if="orders.length > 0">
      <thead>
      <tr>
        <th>Заказ</th>
        <th>Изделие</th>
        <th>Кол-во</th>
        <th>Тип</th>
        <th>Время (ч)</th>
        <th>Дата</th>
        <th>Действие</th>
        <th>Статус</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="order in orders" :key="order.id">
        <td>{{ order.order_num }}</td>
        <td>{{ order.name }}</td>
        <td class="text-center">{{ order.count }}</td>
        <td>
          <span :class="`type-badge type-${order.type}`">{{ getTypeLabel(order.type) }}</span>
        </td>
        <td class="text-right">{{ order.total_time.toFixed(3) }}</td>
        <td>{{ new Date(order.created_at).toLocaleDateString() }}</td>
        <td>
          <button @click="goToNormirovka(order)" class="btn-view">
            Просмотр
          </button>
          <button @click="goToWorkers(order)" class="btn-view">
            Назначить сотрудников
          </button>
          <button
              v-if="order.status !== 'cancel'"
              @click="cancelOrder(order)"
              class="btn-view"
          >
            Отменить
          </button>
        </td>
        <td>
          <span :class="`status-badge type-${order.status}`">{{ getTypeStatus(order.status) }}</span>
        </td>
      </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="no-results">
      {{ filters.order_num || filters.type ? 'Нет заказов по фильтру' : 'Нет нормированных заказов' }}
    </div>

    <div v-else class="loading">Загрузка...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from "axios";

const router = useRouter();

// Фильтры
const filters = ref({
  order_num: '',
  type: ''
});

// Список заказов
const orders = ref([]);
const loading = ref(false);

// Отображаемые названия типов
const typeLabels = {
  window: 'Окно',
  glyhar: 'Глухарь',
  door: 'Дверь',
  loggia: 'Лоджия',
  vitrage: 'Витраж',
  other: 'Другое'
};

const typeStatus = {
  assigned: "Сотрудники назначены",
  in_production: "В производстве",
  final: "Готов для ПЭО",
  cancel: "Отменён",
};

const getTypeLabel = (type) => {
  return typeLabels[type] || type;
};

const getTypeStatus = (type) => {
  return typeStatus[type] || type;
};

// Применяем фильтры и запрашиваем данные
const applyFilters = () => {
  fetchOrders();
};

// Загрузка заказов
const fetchOrders = async () => {
  loading.value = true;

  // Формируем URL с параметрами
  const params = new URLSearchParams();
  if (filters.value.order_num) params.append('order_num', filters.value.order_num);
  if (filters.value.type) params.append('type', filters.value.type);

  try {
    const res = await fetch(`/api/orders/order/norm/all?${params}`);
    if (!res.ok) {
      console.error('Ошибка HTTP:', res.status);
      orders.value = [];
      return;
    }

    const data = await res.json();

    // data — массив. Если null → []
    orders.value = Array.isArray(data) ? data : [];

  } catch (err) {
    console.error('Ошибка сети:', err);
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

// Переход к нормировке
const goToNormirovka = (order) => {
  //router.push(`/norm/orders/order-norm/edit/${order.id}`);
  console.log("ORDEEEER",order.order_num);
  router.push({
    name: 'EditNormOrder',
    params: {id: order.id},
    query: {order_num: order.order_num}
  })
};

const goToWorkers = (order) => {
  router.push({ name: 'AssignWorkers', params: { id: order.id } });
};

const cancelOrder = async (order) => {
  try {

    const response = await axios.post('/api/orders/cancel', {
      root_product_id: order.id,
    });

    if (response.status === 200) {
      order.status = 'cancel'
    }
  } catch (error) {
    console.error('Ошибка при отмене заказа:', error)
  }
}

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('order_num')) filters.value.order_num = urlParams.get('order_num');
  if (urlParams.has('type')) filters.value.type = urlParams.get('type');

  fetchOrders();
});
</script>

<style scoped>
.orders-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.filter-group label {
  font-size: 14px;
  color: #555;
  margin-bottom: 6px;
}

.filter-group input,
.filter-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
}

.orders-table th,
.orders-table td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.orders-table th {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  font-size: 14px;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.type-badge.type-window { background: #007bff; }
.type-badge.type-glyhar { background: #28a745; }
.type-badge.type-door   { background: #dc3545; }
.type-badge.type-loggia { background: #fd7e14; }
.type-badge.type-vitrage{ background: #6f42c1; }

.btn-view {
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-view:hover {
  background: #0056b3;
}

.no-results,
.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-style: italic;
}

.status-badge {
  color: white;
  padding: 6px 10px;
  margin-left: 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background-color: #007bff;

  display: inline-block;
  white-space: nowrap;
  line-height: 1.2;
  vertical-align: middle;
  box-sizing: border-box;
}

.status-badge.type-in_production  { background-color: #007bff; }
.status-badge.type-assigned       { background-color: #28a745; }
.status-badge.type-final          { background-color: #fd7e14; }
.status-badge.type-cancel         { background-color: #dc3545; }
</style>