<template>
  <div class="orders-page">
    <h1>Заказы</h1>

    <!-- Фильтры -->
    <div class="filters">
      <div>
        <label>Год:</label>
        <input v-model.number="year" type="number" min="2020" max="2030" />
      </div>

      <div>
        <label>Месяц:</label>
        <select v-model="month">
          <option v-for="(name, index) in months" :key="index + 1" :value="index + 1">
            {{ name }}
          </option>
        </select>
      </div>

      <div>
        <label>Поиск:</label>
        <input v-model="search" placeholder="Поиск по номеру..." />
      </div>
    </div>

    <!-- Таблица -->
    <div v-if="orders && orders.length > 0" class="table-container">
      <table>
        <thead>
        <tr>
          <th>Заказ</th>
          <th>Заказчик</th>
          <th>Примечание</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="order in orders"
            :key="order.id"
            @click="viewOrderDetails(order)"
            style="cursor: pointer;"
        >
          <td>{{ order.order_num }}</td>
          <td>{{ order.customer }}</td>
          <td>{{ order.ms_note }}</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>
    <div v-else class="no-orders">Заказы не найдены</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from "axios";
import { useRouter } from 'vue-router';

const router = useRouter();
const orders = ref([]);
const errorMessage = ref('');

// Фильтры
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);
const search = ref(''); // для поиска по order_num

// Список месяцев
const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Автоматическая загрузка при открытии
onMounted(() => {
  fetchOrders();
});

// Функция получения заказов
async function fetchOrders() {
  try {
    orders.value = [];
    errorMessage.value = '';

    const params = {};

    // Если есть поиск — игнорируем месяц и год
    if (search.value) {
      params.search = search.value;
      // Можно добавить флаг, чтобы бэкенд знал, что ищем глобально
      // params.globalSearch = true;
    } else {
      // Иначе фильтруем по дате
      params.year = year.value;
      params.month = month.value;
    }

    //TODO Добавить поиск по номеру заказа
    const response = await axios.get('/api/orders', {params});

    //console.log("RESP", response);
    if (response.data.error) {
      errorMessage.value = response.data.error;
    } else {
      orders.value = response.data.orders;
    }
  } catch (error) {
    errorMessage.value = 'Не удалось загрузить заказы.';
    console.error(error);
  }
}

// При изменении любого фильтра — обновляем
watch([year, month, search], () => {
  fetchOrders();
});

// Переход к деталям
function viewOrderDetails(order) {
  router.push(
      { name: 'OrdersDetails',
        params: { orderNum: order.order_num }
      });
}
</script>

<style scoped>
.orders-page {
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 20px;
  font-weight: 500;
}

/* Стили для фильтров */
.filters {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.filters label {
  font-size: 14px;
  color: #555;
  min-width: 50px;
}

.filters input,
.filters select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.filters input:focus,
.filters select:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.filters input[type="number"] {
  width: 100px;
}

.filters input[type="text"] {
  width: 180px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Таблица */
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  table-layout: fixed;
  width: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  font-size: 14px;
}

th {
  background-color: #4299e1;
  color: white;
  text-align: left;
  padding: 12px 16px;
  font-weight: 500;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  color: #333;
}

tr:hover {
  background-color: #f1f7ff;
  cursor: pointer;
}

/* Сообщения */
.error {
  color: #e53e3e;
  font-size: 16px;
  text-align: center;
  padding: 20px;
  background-color: #fee;
  border-radius: 8px;
  margin-bottom: 20px;
}

.no-orders {
  text-align: center;
  color: #777;
  font-size: 16px;
  padding: 40px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ccc;
}
</style>