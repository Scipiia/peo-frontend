<template>
  <div class="print-container">
    <!-- Основной контент -->
    <div class="print-layout" v-if="assembly">
      <!-- Основной наряд -->
      <div class="print-page main-page">
        <div class="header">
          <p>Пооперационный технологический процесс {{ assembly.main.head_name }}</p>
          <p><strong>Номер заказа:</strong> {{ assembly.main.order_num }}, <strong>Позиция:</strong> {{ assembly.main.position }}</p>
          <p><strong>Количество:</strong> {{ assembly.main.count }}</p>

          <table class="operations-table">
            <thead>
            <tr>
              <th width="40%">Операция</th>
              <th width="10%">Итого <br> н/час</th>
              <th width="10%">Итого <br> н/мин</th>
              <th>ФИО исполнителя</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="op in assembly.main.operations" :key="op.operation_name">
              <td>{{ op.operation_label }}</td>
              <td>{{ op.value.toFixed(3) }}</td>
              <td>{{ op.minutes }}</td>
              <td></td>
            </tr>
            <tr class="total-row">
              <td colspan="1" class="text-right"><strong>Итого:</strong></td>
              <td>{{ assembly.main.total_time.toFixed(3) }}</td>
              <td>{{ Math.round(assembly.main.total_time * 60) }}</td>
            </tr>
            </tbody>
          </table>

          <!-- Дополнительные операции -->
          <AddictionOperation />
        </div>
      </div>

      <!-- Составные части — каждая с новой страницы -->
      <div
          v-for="sub in assembly.subs"
          :key="sub.id"
          class="print-page sub-page"
      >
        <div class="header">
        <p>Пооперационный технологический процесс {{ sub.head_name }}</p>
        <p><strong>Номер заказа:</strong> {{ sub.order_num }}, <strong>Позиция:</strong> {{ assembly.main.position }}</p>
        <p><strong>Количество:</strong> {{ sub.count }}</p>

        <table class="operations-table">
          <thead>
          <tr>
            <th width="40%">Операция</th>
            <th width="10%">Итого <br> н/час</th>
            <th width="10%">Итого <br> н/мин</th>
            <th>ФИО исполнителя</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="op in sub.operations" :key="op.operation_name">
            <td>{{ op.operation_label }}</td>
            <td>{{ op.value.toFixed(3) }}</td>
            <td>{{ op.minutes }}</td>
            <td></td>
          </tr>
          <tr class="total-row">
            <td colspan="1" class="text-right"><strong>Итого:</strong></td>
            <td>{{ sub.total_time.toFixed(3) }}</td>
            <td>{{ Math.round(sub.total_time * 60) }}</td>
          </tr>
          </tbody>
        </table>

        <AddictionOperation />
        </div>
      </div>

      <!-- Кнопка печати -->
      <div class="print-controls">
        <button @click="print" class="btn-print">Распечатать</button>
        <button @click="goBackToOrder" class="btn-back">
          Вернуться к заказу
        </button>
        <button
            v-if="assembly.main && assembly.main.status !== 'cancel'"
            @click="confirmCancel"
            class="btn-cancel"
            :disabled="loadingCancel"
        >
          {{ loadingCancel ? 'Отменяем...' : 'Отменить заказ' }}
        </button>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-else-if="loading" class="loading">
      Загрузка сборки...
    </div>

    <!-- Ошибка -->
    <div v-else class="error">
      Не удалось загрузить данные.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AddictionOperation from "@/components/AddictionOperation.vue";
import axios from "axios";

const route = useRoute();
const router = useRouter();
const assembly = ref(null);
const loading = ref(true);

onMounted(async () => {
  const id = route.params.id;
  if (!id) {
    alert("Не указан ID");
    return;
  }

  try {
    // Получаем текущий элемент для определения rootId
    const itemRes = await fetch(`/api/orders/order-norm/${id}`);
    if (!itemRes.ok) throw new Error(`Ошибка загрузки элемента: ${itemRes.status}`);
    const itemData = await itemRes.json();

    const item = Array.isArray(itemData) ? itemData[0] : itemData;

    // Определяем rootId
    let rootId;
    if (item.part_type === 'main') {
      rootId = id;
    } else if (item.parent_product_id) {
      rootId = item.parent_product_id;
    } else {
      rootId = id;
    }

    // Загружаем всю сборку
    const assemblyRes = await fetch(`/api/orders/order-norm/${rootId}`);
    if (!assemblyRes.ok) throw new Error(`Не удалось загрузить сборку: ${assemblyRes.status}`);
    const data = await assemblyRes.json();

    // Преобразуем в массив
    let dataArray;
    if (Array.isArray(data)) {
      dataArray = data;
    } else if (data && typeof data === 'object') {
      dataArray = [data];
    } else {
      throw new Error('Некорректные данные');
    }

    // Находим main и subs
    const main = dataArray.find(item => item.part_type === 'main');
    const subs = dataArray.filter(item => item.part_type === 'sub');

    // Если main нет — используем первый элемент
    const finalMain = main || (dataArray.length > 0 ? dataArray[0] : null);

    if (!finalMain) {
      throw new Error('Нет данных для отображения');
    }

    assembly.value = {
      main: finalMain,
      subs: subs
    };
  } catch (err) {
    console.error('Ошибка загрузки:', err);
  } finally {
    loading.value = false;
  }
});

function goBackToOrder() {
  // Получаем order_num из query параметров
  const orderNum = route.query.order_num || assembly.value?.main?.order_num;

  if (orderNum) {
    router.push({
      name: 'OrdersDetails',
      params: { orderNum: orderNum }
    });
  } else {
    // Резервный вариант
    router.go(-2);
  }
}

const loadingCancel = ref(false);

// Подтверждение и отмена
const confirmCancel = () => {
    cancelOrder(assembly.value.main);
};

// Функция отмены заказа
const cancelOrder = async (order) => {
  if (!order) return;

  loadingCancel.value = true;
  try {
    const response = await axios.post('/api/orders/cancel', {
      root_product_id: order.id,
    });

    if (response.status === 200) {
      // Успешно отменён
      order.status = 'cancel';
      alert('Заказ успешно отменён.');
    } else {
      throw new Error('API вернул неожиданный статус');
    }
  } catch (error) {
    console.error('Ошибка при отмене заказа:', error);
    let message = 'Не удалось отменить заказ.';
    if (error.response?.data?.message) {
      message += '\n' + error.response.data.message;
    }
    alert(message);
  } finally {
    loadingCancel.value = false;
  }
};

function print() {
  const printLayout = document.querySelector('.print-layout');
  if (!printLayout) {
    alert('Нет данных для печати');
    return;
  }

  // Клонируем контент, чтобы не повредить оригинал
  const contentClone = printLayout.cloneNode(true);

  // Находим и удаляем кнопку печати из клона
  const controls = contentClone.querySelector('.print-controls');
  if (controls) {
    controls.remove();
  }

  // Получаем чистый HTML без кнопки
  const contentHtml = contentClone.innerHTML;

  const printHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Технологический процесс</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
            line-height: 1.4;
            padding: 15px;
            margin: 0;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            width: 210mm;
            margin: 0 auto;
          }
          .print-page {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 12px;
          }
          .header p {
            margin: 2px 0;
            line-height: 1.2;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .total-row {
            background-color: #f9f9f9;
            font-weight: bold;
          }
          .additional-ops {
            margin-top: 6px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @media print {
            @page {
              margin: 1cm;
              size: A4 portrait;
            }
            body {
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body onload="window.focus(); window.print();">
        <div class="print-container">
          ${contentHtml}
        </div>
      </body>
    </html>
  `;

  // Открываем окно с about:blank (более надёжно, чем пустая строка)
  const printWindow = window.open('about:blank', '_blank', 'width=1000,height=800,scrollbars=yes');

  // КРИТИЧЕСКАЯ ПРОВЕРКА: окно заблокировано?
  if (!printWindow) {
    alert('❌ Окно печати заблокировано. Разрешите всплывающие окна в настройках браузера и повторите попытку.');
    return;
  }

  try {
    // Записываем контент с защитой от ошибок
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();

    // Дополнительная гарантия: если onload не сработал
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus();
      }
    }, 250);
  } catch (e) {
    console.error('Ошибка подготовки документа к печати:', e);
    alert('⚠️ Не удалось подготовить документ к печати. Попробуйте обновить страницу или использовать комбинацию Ctrl+P.');
    if (!printWindow.closed) printWindow.close();
  }
}
</script>

<style>
.print-container {
  font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
  max-width: 900px;
  margin: 10px auto;
  padding: 10px;
  background: #fff;
}

.header {
  margin-bottom: 4px;
}

.header p {
  margin: 2px 0;
  line-height: 1.2;
}

.operations-table {
  width: 100%;
  border-collapse: collapse;
  margin: 4px 0;
  font-size: 11px;
}

.operations-table th,
.operations-table td {
  border: 1px solid #000;
  padding: 3px 5px;
  text-align: left;
}

.operations-table th {
  background-color: #f2f2f2;
  font-weight: 600;
  white-space: nowrap;
  font-size: 11px;
}

.total-row {
  background-color: #f9f9f9;
  font-weight: bold;
}

.text-right {
  text-align: right;
}

.print-controls {
  text-align: center;
  margin: 20px 0 10px;
}

.btn-print {
  padding: 8px 16px;
  font-size: 14px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-print:hover {
  background: #0056b3;
}

.loading,
.error {
  text-align: center;
  font-size: 14px;
  padding: 20px;
}
</style>

<!-- Стили для печати -->
<style scoped>
@media print {
  .print-controls {
    display: none;
  }

  .print-container {
    margin: 0;
    padding: 6px;
    font-size: 10px;
    visibility: visible;
    height: auto !important;
  }

  .header {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .header p {
    margin: 1px 0;
    line-height: 1.1;
  }

  .operations-table {
    margin: 3px 0;
    break-inside: avoid;
    page-break-inside: avoid;
    font-size: 10px;
  }

  .operations-table th,
  .operations-table td {
    padding: 2px 4px;
    font-size: 9px;
  }

  /* Защита от разрыва внутри доп. операций */
  .additional-ops {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-top: 6px;
  }

  .additional-ops-label {
    font-size: 11px;
    margin: 0;
    padding: 0;
  }

  /* Убедимся, что основной блок не переносится */
  .main-page {
    break-before: auto;
    orphans: 3;
    widows: 3;
  }

  /* Подчинённые части начинаются с новой страницы */
  .sub-page {
    break-before: auto;
    orphans: 3;
    widows: 3;
  }

  .print-page {
    margin: 0;
    padding-bottom: 8px; /* вместо margin-bottom */
  }
}

.btn-cancel {
  padding: 8px 16px;
  font-size: 14px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.btn-cancel:hover {
  background: #c82333;
}

.btn-cancel:disabled {
  background: #a71d2a;
  cursor: not-allowed;
}

.btn-back {
  padding: 8px 16px;
  font-size: 14px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.btn-back:hover {
  background: #0056b3;
}
</style>