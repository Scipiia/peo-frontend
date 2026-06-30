<template>
  <div class="assign-vitrage-workers">
    <div class="header">
      <h2>Назначение сотрудников на витраж</h2>
      <div class="order-info">
        <p><strong>Заказ:</strong> №{{ order.order_num }}</p>
        <p><strong>Общее время:</strong> {{ order.total_time.toFixed(2) }} н/ч</p>
      </div>
    </div>

    <div class="workers-section">
      <h3>Сотрудники</h3>

      <table class="workers-table">
        <thead>
        <tr>
          <th>ФИО</th>
          <th>Процент (%)</th>
          <th>Норма-часы</th>
          <th>Минуты</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="worker in allWorkers" :key="worker.id">
          <td>{{ worker.name }}</td>
          <td>
            <input
                type="number"
                min="0"
                max="100"
                step="1"
                v-model.number="worker.percent"
                @blur="clampPercent(worker)"
                class="percent-input"
            />
          </td>
          <td class="calculated">{{ getWorkerHours(worker).toFixed(2) }}</td>
          <td class="calculated">{{ getWorkerMinutes(worker).toFixed(0) }}</td>
        </tr>
        </tbody>
      </table>

      <div class="summary" :class="summaryClass">
        <span>Распределено: {{ totalPercent.toFixed(2) }}% из 100%</span>
        <span v-if="Math.abs(totalPercent - 100) > 0.01" class="warning">
          ({{ totalPercent > 100 ? 'перерасход' : 'не хватает' }}:
          {{ Math.abs(100 - totalPercent).toFixed(2) }}%)
        </span>
      </div>
    </div>

    <div class="actions">
      <button @click="save" :disabled="isSaving || Math.abs(totalPercent - 100) > 0.01">
        {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
      </button>
      <button @click="goBack" :disabled="isSaving">Отмена</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const order = computed(() => ({
  id: parseInt(route.params.id),
  order_num: route.query.order_num,
  total_time: parseFloat(route.query.time) || 0
}));

const allWorkers = ref([]);
const isSaving = ref(false);

const totalPercent = computed(() => {
  return allWorkers.value.reduce((sum, w) => sum + (w.percent || 0), 0);
});

const getWorkerHours = (worker) => {
  return (order.value.total_time * (worker.percent || 0)) / 100;
};

const getWorkerMinutes = (worker) => {
  return getWorkerHours(worker) * 60;
};

const clampPercent = (worker) => {
  if (worker.percent < 0) worker.percent = 0;
  if (worker.percent > 100) worker.percent = 100;
};

const summaryClass = computed(() => {
  const diff = Math.abs(totalPercent.value - 100);
  if (diff <= 0.01) return 'ok';
  if (totalPercent.value > 100) return 'over';
  return 'under';
});

onMounted(async () => {
  if (!order.value.id || !order.value.total_time) {
    alert('Ошибка: не удалось загрузить данные заказа');
    router.back();
    return;
  }

  const type = route.query.source;

  try {
    // Параллельно тянем сотрудников и существующие назначения витража
    const [wRes, aRes] = await Promise.all([
      fetch(`/api/workers/all?type=${type}`),
      fetch(`/api/orders/${order.value.id}/vitr-assign`)
    ]);


    if (!wRes.ok) {
      throw new Error(`Ошибка загрузки сотрудников: ${wRes.status}`);
    }

    if (!aRes.ok) {
      const text = await aRes.text();
      console.error('Второй запрос вернул:', text.substring(0, 200));
      throw new Error(`Ошибка загрузки назначений: ${aRes.status}`);
    }


    const workersList = await wRes.json();

    let existingMap = {};
    if (aRes.ok) {
      const existing = await aRes.json();
      existing.forEach(a => {
        const percent = parseFloat(a.notes);
        if (!isNaN(percent)) {
          existingMap[a.id] = percent;
        }
      });
    }

    //console.log('Итоговая мапа:', existingMap);

    // Объединяем: если для сотрудника есть сохранённый процент — ставим его, иначе 0
    allWorkers.value = workersList.map(w => ({
      ...w,
      percent: existingMap[w.id] !== undefined ? existingMap[w.id] : 0
    }));

    //console.log('Финальный allWorkers:', allWorkers.value);

  } catch (e) {
    console.error('Ошибка загрузки:', e);
    alert('Не удалось загрузить данные: ' + e.message);
  }
});

const save = async () => {
  if (Math.abs(totalPercent.value - 100) > 0.01) {
    alert('Сумма процентов должна быть ровно 100%');
    return;
  }

  // const payload = {
  //   assignments: [],
  //   update_status: "assigned",
  //   root_product_id: assembly.value.main.id,
  //   ready_date: dateAccounting.value,
  // };

  isSaving.value = true;

  const payload = {
    root_product_id: order.value.id,  // Корневой ID заказа
    update_status: "assigned",
    assignments: allWorkers.value
        .filter(w => w.percent > 0)
        .map(w => ({
          product_id: order.value.id,           // ← В КАЖДОМ назначении!
          operation_name: 'Витраж',             // ← В КАЖДОМ назначении!
          employee_id: w.id,
          actual_minutes: getWorkerMinutes(w),  // ← actual_minutes, не minutes
          actual_value: getWorkerHours(w),      // ← actual_value (норма-часы)
          notes: String(w.percent),              // ← процент в notes как строка
        }))
  };

  try {
    const res = await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    //console.log('Отправлено:', payload);

    if (res.ok) {
      //alert('Назначения сохранены');
      router.push('/norm/orders');
    } else {
      const errText = await res.text();
      alert('Ошибка сохранения: ' + errText);
    }
  } catch (e) {
    console.error(e);
    alert('Ошибка сохранения: ' + e.message);
  } finally {
    isSaving.value = false;
  }
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.assign-vitrage-workers {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.header h2 {
  margin: 0 0 15px 0;
}

.order-info p {
  margin: 5px 0;
  font-size: 16px;
}

.workers-section {
  margin-bottom: 30px;
}

.workers-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.workers-table th,
.workers-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.workers-table th {
  background: #f9f9f9;
  font-weight: 600;
}

.percent-input {
  width: 80px;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.calculated {
  font-weight: 600;
  color: #2c3e50;
}

.summary {
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  font-weight: 600;
  font-size: 16px;
}

.summary.ok {
  background: #d4edda;
  color: #155724;
}

.summary.over {
  background: #f8d7da;
  color: #721c24;
}

.summary.under {
  background: #fff3cd;
  color: #856404;
}

.warning {
  font-weight: normal;
  margin-left: 10px;
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.actions button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.actions button:first-child {
  background: #007bff;
  color: white;
}

.actions button:first-child:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.actions button:last-child {
  background: #6c757d;
  color: white;
}
</style>