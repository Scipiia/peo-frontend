<template>
  <div class="form-container">
    <h2>Форма нормировки — изделие «{{ cardInfo.name }}»</h2>

    <!-- Информация о заказе -->
    <div class="card-info">
      <p><strong>Номер заказа:</strong> {{ cardInfo.order_num }}</p>
      <p><strong>Позиция:</strong> {{ cardInfo.position }}</p>
      <p><strong>Количество:</strong> {{ cardInfo.count }}</p>
      <p><strong>Цвет:</strong> {{ cardInfo.color }}</p>
      <p><strong>Площадь:</strong> {{ cardInfo.sqr }} м²</p>
      <p><strong>Заказчик:</strong> {{ cardInfo.customer }}</p>
      <!-- Миниатюра -->
      <div v-if="cardInfo.image" class="image-preview-container">
        <img
            :src="`data:image/png;base64,${cardInfo.image}`"
            alt="Изображение заказа"
            class="order-image clickable"
            @click="showImageModal = true"
            title="Нажмите, чтобы увеличить"
        />
      </div>
    </div>

    <!-- Модальное окно для увеличенного изображения -->
    <div
        v-if="showImageModal"
        class="image-modal"
        @click="showImageModal = false"
    >
      <div class="modal-content" @click.stop>
        <img
            :src="`data:image/png;base64,${cardInfo.image}`"
            alt="Увеличенное изображение"
            class="enlarged-image"
        />
        <button class="close-btn" @click="showImageModal = false">&times;</button>
      </div>
    </div>

    <!-- Флаг: это составная часть -->
    <div class="composite-toggle">
      <label>
        <input type="checkbox" v-model="isComposite" />
          Это составная часть (витраж к двери(двери с глухарем) и тп)
      </label>
    </div>

    <!-- Выбор родительского изделия (если составное) -->
    <div class="parent-selection" v-if="isComposite">
      <label><strong>Привязать к:</strong></label>
      <select v-model="selectedParentId" class="form-control" required>
        <option value="" disabled>Выберите основное изделие...</option>
        <option
            v-for="parent in availableParents"
            :key="parent.id"
            :value="parent.id"
        >
          {{ parent.name }}
        </option>
      </select>
      <p v-if="availableParents.length === 0" class="text-muted">
        Нет доступных основных изделий. Сначала добавьте основное (дверь, окно и т.п.).
      </p>
      <div class="parent-selection">
        <!-- Поле "Уточнение для части" -->
        <label class="form-control"><strong>Уточнение для части:</strong></label>
        <select
            v-model="selectedPartDetail"
            class="form-custom-select"
        >
          <option value="">— выберите —</option>
          <option value="с глухарем">с глухарем</option>
        </select>

        <!-- Поле "Наименование" -->
        <label class="form-control"><strong>Наименование:</strong></label>
        <select
            v-model="selectedName"
            class="form-custom-select"
        >
          <option value="">— выберите —</option>
          <option value="витраж к двери">витраж к двери</option>
        </select>
      </div>
    </div>

    <!-- Выбор формы нормировки -->
    <div class="forms-section">
      <h4>Выберите тип изделия</h4>
      <div
          v-for="(templates, category) in groupedTemplates"
          :key="category"
          class="category-group"
      >
        <h5 class="category-title">{{ categoryLabels[category] }}</h5>
        <ul class="templates-list">
          <li
              v-for="tpl in templates"
              :key="tpl.code"
              @click="loadForm(tpl)"
              class="template-item"
              :class="{ selected: selectedTemplate === tpl.code }"
          >
            {{ tpl.name }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Форма операций -->
    <div v-if="fullForm" class="full-form">
      <h3>{{ fullForm.name }}</h3>


      <!-- Тип изделия -->
      <div class="part-type-badge">
        Тип: <strong>{{ fullForm.part_type === 'main' ? 'Основное изделие' : 'Составная часть' }}</strong>
        <span v-if="fullForm.parent_product_id">
          (привязано к наряду ID={{ fullForm.parent_product_id }})
        </span>
      </div>

      <!-- Таблица операций -->
      <table class="norm-table">
        <thead>
        <tr>
          <th>Операция</th>
          <th>Норма (ч)</th>
          <th>Кол-во</th>
          <th>Норма (мин)</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, index) in fullForm.operations" :key="item.name">
          <td>{{ item.label }}</td>
          <td>
            <input
                type="number"
                step="0.01"
                min="0"
                :value="item.dynamicValue"
                class="input-small"
                @input="updateValue(index, $event.target.value)"
            />
          </td>
          <td>
            <input
                type="number"
                step="1"
                min="0"
                :value="item.count"
                class="input-small"
                :disabled="item.group === 'ign'"
                @input="updateCount(index, $event.target.value)"
            />
          </td>
          <td class="text-center">{{ item.minutes }}</td>
        </tr>
        </tbody>
      </table>

      <!-- Дополнительные операции — редактируемая таблица -->
      <div class="custom-operations-input">
        <h4>Дополнительные операции</h4>
        <table class="norm-table">
          <thead>
          <tr>
            <th>Название операции</th>
            <th>Норма(мин)</th>
            <th>Норма(ч)</th>
            <th style="width: 40px"></th> <!-- колонка для кнопки удаления -->
          </tr>
          </thead>
          <tbody>
          <tr v-for="(row, idx) in customInputs" :key="idx">
            <td>
              <input
                  v-model="row.name"
                  type="text"
                  placeholder="Название"
                  class="input-small wide"
              />
            </td>
            <td>
              <input
                  v-model.number="row.minutes"
                  type="number"
                  step="0.001"
                  min="0"
                  class="input-small"
              />
            </td>
            <td class="text-center">
              {{ ((row.minutes || 0) / 60).toFixed(3) }}
            </td>
            <td>
              <button
                  v-if="customInputs.length > 1"
                  type="button"
                  class="btn-remove"
                  @click="removeCustomInputRow(idx)"
                  title="Удалить"
              >
                &minus;
              </button>
            </td>
          </tr>
          </tbody>
        </table>
        <button type="button" class="btn-add-row" @click="addCustomInputRow">
          Добавить операцию
        </button>
      </div>

      <!-- Кнопка расчёта и опции -->
      <div class="checkbox-loggia">
        <!-- ← Чекбокс ТОЛЬКО для лоджий -->
        <label v-if="fullForm?.type === 'Лоджия' || fullForm?.type === 'loggia'" class="checkbox-loggia-text">
          <input
              type="checkbox"
              v-model="includeDopMaterials"
              class="checkbox-loggia-input"
          >
          <span class="">Учесть доп. материалы (соединители)</span>
        </label>
      </div>

      <!-- Итоговое время -->
      <div class="total-summary">
        <strong>Итоговое время:</strong>
        {{ totalHours }} ч ({{ totalMinutes }} мин)
      </div>

      <div v-if="calculationContext" class="calculation-info">
        <small>Импостов в материалах найдено: {{ calculationContext.ImpostCount }}</small>
        <small>Створок меньше 400мм в материалах найдено: {{ calculationContext.StvTCount400 }}</small>
        <small>Створок меньше 615мм в материалах найдено: {{ calculationContext.StvTCount600 }}</small>
        <small>Многозапорных замков найдено: {{ calculationContext.MnogozapZamok }}</small>
        <small>Tрёхсекционных петель найдено: {{ calculationContext.Petli3Section }}</small>
        <small>Трёхчастных петель найдено: {{ calculationContext.StvorkiWith3Petli }}</small>
        <small>Роликовых петель найдено: {{ calculationContext.PetliRolik }}</small>
        <small>Обычных петель найдено: {{ calculationContext.PetliStand }}</small>
        <small>RDRH петель найдено: {{ calculationContext.PetliRDRH }}</small>
        <small>Fural петель найдено: {{ calculationContext.PetliFural }}</small>
        <small>Притвор: {{ calculationContext.PritvorKP40 }}</small>
        <small>Накладок stublina найдено: {{ calculationContext.StublinaCount }}</small>
      </div>

      <!-- Кнопки управления -->
      <div class="form-actions">
        <button
            type="button"
            class="multiply-count-btn"
            @click="multiplyAllCounts()"
        >
          Умножить на кол-во изделий ({{ cardInfo.count }})
        </button>
        <button
            type="button"
            @click="recalculateNorms"
            :disabled="!selectedTemplate || loading"
            class="btn-recalculate"
        >
          Рассчитать нормы по материалам
        </button>
        <button @click="saveNormirovka" :disabled="loading" class="btn-save">
          {{ loading ? 'Сохраняем...' : 'Сохранить нормировку' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import router from "@/router";

const route = useRoute();

// --- Ключ для sessionStorage ---
const storageKey = `orderDetail_${route.params.orderNum}_${route.params.position}`;

// --- Данные заказа ---
const cardInfo = ref({
  order_num: 'Неизвестно',
  name: 'Неизвестно',
  count: 0,
  color: 'Не указан',
  image: '',
  sqr: 0,
  position: '',
  customer: ''
});

// --- Загрузка данных: сначала из sessionStorage, потом из query ---
onMounted(() => {
  // Пытаемся загрузить из sessionStorage
  const saved = sessionStorage.getItem(storageKey);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      cardInfo.value = { ...data };
      return;
    } catch (e) {
      console.error('Ошибка парсинга данных из sessionStorage:', e);
    }
  }

  // 2. Если нет — читаем из query
  const fromQuery = {
    order_num: route.query.orderNum || 'Неизвестно',  // ← orderNum, а не order_num
    name: route.query.name || 'Неизвестно',
    count: parseInt(route.query.count) || 1,
    color: route.query.color || 'Не указан',
    customer: route.query.customer || 'Не указан',
    sqr: parseFloat(route.query.sqr) || 0,
    position: route.query.position || '',
    image: route.query.image || ''
  };

  // Сохраняем в хранилище для будущих перезагрузок
  sessionStorage.setItem(storageKey, JSON.stringify(fromQuery));
  cardInfo.value = fromQuery;

  // Очищаем URL от тяжёлых параметров
  const cleanQuery = { ...route.query };
  delete cleanQuery.image;

  // Меняем URL без перезагрузки
  window.history.replaceState(
      {},
      '',
      `${location.pathname}?${new URLSearchParams(cleanQuery).toString()}`
  );
});

// --- Управление формой ---
const allTemplates = ref([]);
const fullForm = ref(null);
const loading = ref(false);
const showPrintButton = ref(false);

// --- Составные изделия ---
const isComposite = ref(false);
const selectedParentId = ref(null);
const availableParents = ref([]);
const lastRootId = ref(null); // ← хранит ID последнего основного изделия
const selectedTemplate = ref(null);
const showImageModal = ref(false);

//выпадающие списки с уточнениями
const selectedPartDetail = ref('');
const selectedName = ref('');

// --- Категории шаблонов ---
const categoryLabels = {
  window: 'Окна',
  glyhar: 'Глухари',
  door: 'Двери',
  loggia: 'Лоджии',
  vitrage: 'Витражи',
};

// --- Список основных изделий в этом заказе ---
watch(isComposite, async (newValue) => {
  if (newValue && cardInfo.value.order_num) {
    try {
      const res = await fetch(`/api/orders/order-norm/by-order?order_num=${cardInfo.value.order_num}`);
      if (res.ok) {
        const allItems = await res.json();
        // Оставляем только основные изделия (которые могут быть родителями)
        availableParents.value = allItems.filter(item => item.part_type === 'main');
      } else {
        availableParents.value = [];
      }
    } catch (err) {
      console.error('Ошибка загрузки родителей:', err);
      availableParents.value = [];
    }
  } else {
    selectedParentId.value = null;
  }
});

const groupedTemplates = computed(() => {
  const groups = {};
  const categories = Object.keys(categoryLabels);
  categories.forEach(cat => {
    groups[cat] = [];
  });

  allTemplates.value?.Template?.forEach(tpl => {
    const cat = tpl.category?.toLowerCase().trim();
    if (categories.includes(cat)) {
      groups[cat].push(tpl);
    }
  });

  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {numeric: true, sensitivity: 'base'}));
  });

  // Удаляем пустые группы
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) delete groups[key];
  });

  return groups;
});

// --- Загрузка шаблонов ---
onMounted(async () => {
  try {
    const res = await fetch('/api/all_templates');
    if (!res.ok) throw new Error('Не удалось загрузить шаблоны');
    allTemplates.value = await res.json();
  } catch (err) {
    console.error('Ошибка загрузки шаблонов:', err);
    alert('Не удалось загрузить шаблоны. Проверьте подключение.');
  }
});

// --- Подсчёт  времени ---
const totalHours = computed(() => {
  // Штатные операции
  const baseTotal = fullForm.value?.operations?.reduce((sum, op) => {
    return typeof op.dynamicValue === 'number' ? sum + op.dynamicValue : sum;
  }, 0) || 0;

  // Доп. операции: value — это норма на единицу, count — количество
  const customTotal = customInputs.value.reduce((sum, row) => {
    if (!row.name?.trim()) return sum; // пропускаем пустые
    const val = row.minutes / 60|| 0;
    //const cnt = parseInt(row.count) || 1;
    return sum + val;
  }, 0);

  return (baseTotal + customTotal).toFixed(3);
});

const totalMinutes = computed(() => {
  return Math.round(parseFloat(totalHours.value) * 60);
});


// --- Пересчёт нормы при изменении количества ---
// Обновление поля Value вручную
function updateValue(index, newValueStr) {
  const newValue = parseFloat(newValueStr);
  if (isNaN(newValue)) return;

  const item = fullForm.value.operations[index];
  item.dynamicValue = newValue;

  // Обновляем rate: сколько стоит одна единица
  if (item.count > 0) {
    item.rate = newValue / item.count;
  } else {
    // Если count = 0, можно оставить предыдущий rate или установить в newValue
    item.rate = newValue; // или 0 — зависит от вашей логики
  }

  item.minutes = Number(item.dynamicValue * 60).toFixed(1);
}

function updateCount(index, newCountStr) {
  const newCount = parseFloat(newCountStr);
  if (isNaN(newCount)) return;

  const item = fullForm.value.operations[index];

  // Устанавливаем count для этой операции
  item.count = newCount;

  // Определяем группу
  const group = item.group;

  // Если у операции нет группы — только она одна обновляется
  if (!group) {
    item.dynamicValue = newCount * item.rate;
    item.minutes = parseFloat((item.dynamicValue * 60).toFixed(1));
    return;
  }

  // Находим все операции в этой группе
  const operationsInGroup = fullForm.value.operations.filter(op => op.group === group);

  // Обновляем ВСЕ операции в группе
  operationsInGroup.forEach(op => {
    op.count = newCount; // одинаковое количество
    op.dynamicValue = newCount * op.rate;
    op.minutes = parseFloat((op.dynamicValue * 60).toFixed(1));
  });
}

function multiplyAllCounts() {
  const multiplier = parseInt(cardInfo.value?.count) || 1;

  if (!fullForm.value?.operations) return;

  fullForm.value.operations.forEach(op => {

    if (op.group && ['ign'].includes(op.group)) {
      // Можно явно установить 1, если нужно
      op.count = 1;
      return;
    }

    // Сохраняем текущий count до умножения
    const oldCount = op.count;

    // Умножаем count
    op.count = oldCount * multiplier;

    // Пересчитываем dynamicValue и minutes
    op.dynamicValue = op.count * op.rate;
    op.minutes = parseFloat((op.dynamicValue * 60).toFixed(1));
  });

  //console.log(`Все количества умножены на ${multiplier}`);
}

// --- Загрузка формы по шаблону ---
async function loadForm(tpl) {
  loading.value = true;
  try {
    const res = await fetch(`/api/template?code=${tpl.code}`);
    if (!res.ok) throw new Error('Не удалось загрузить форму');
    fullForm.value = await res.json();

    //console.log(fullForm.value);

    // Устанавливаем тип и категорию
    fullForm.value.type = tpl.category;
    fullForm.value.code = tpl.code;

    // Определяем part_type и parent_product_id
    if (isComposite.value && selectedParentId.value) {
      fullForm.value.part_type = 'sub';
      fullForm.value.parent_product_id = selectedParentId.value;
    } else {
      fullForm.value.part_type = 'main';
      fullForm.value.parent_product_id = null;
    }

    fullForm.value.operations = fullForm.value.operations.map(op => ({
      ...op,
      count: op.count ?? 0,
      baseValue: op.value ?? 0,
      rate: op.value ?? 0,
      dynamicValue: (op.count ?? 0) * (op.value ?? 0) // начальное значение
    }));

    const operationsByGroup = {};
    fullForm.value.operations.forEach(op => {
      if (op.group) {
        operationsByGroup[op.group] = operationsByGroup[op.group] || [];
        operationsByGroup[op.group].push(op);
      }
    });

    fullForm.value.operationsByGroup = operationsByGroup;

    selectedTemplate.value = tpl.code;

  } catch (err) {
    console.error('Ошибка загрузки формы:', err);
    alert('Не удалось загрузить форму. Попробуйте снова.');
  } finally {
    loading.value = false;
  }
}

// --- Сохранение нормировки ---
function saveNormirovka() {
  // Подготавливаем операции
  const templateOps = fullForm.value.operations
      .filter(op => typeof op.dynamicValue === 'number' && op.dynamicValue > 0)
      .map(op => ({
        operation_name: op.name,
        operation_label: op.label,
        count: parseFloat(op.count),
        value: parseFloat(op.dynamicValue.toFixed(3)),
        minutes: parseFloat(op.minutes),
      }));

  // Доп. операции (уже в нужном формате)
  const customOps = customOperationsToSend.value.map(op => ({
    operation_name: op.operation_name,
    operation_label: op.operation_label,
    count: op.count,
    value: parseFloat(op.value.toFixed(3)),
    minutes: op.minutes,
  }));

  const operationsToSend = [...templateOps, ...customOps];

  const total = operationsToSend.reduce((sum, op) => sum + op.value, 0);

  // Формируем payload
  const payload = {
    order_num: cardInfo.value.order_num,
    name: cardInfo.value.name,
    template_code: fullForm.value.code,
    count: cardInfo.value.count,
    type: fullForm.value.type,
    part_type: fullForm.value.part_type,
    parent_product_id: fullForm.value.parent_product_id,
    parent_assembly: selectedPartDetail.value,
    total_time: parseFloat(total.toFixed(3)),
    position: parseInt(cardInfo.value.position),
    customer: cardInfo.value.customer,
    operations: operationsToSend,
    status: "in_production",
    systema: fullForm.value.systema,
    type_izd: selectedName.value || fullForm.value.type_izd,
    profile: fullForm.value.profile,
    sqr: parseFloat(cardInfo.value.sqr),
  };

  //console.log(payload);

  // Отправляем
  fetch('/api/orders/order-norm/template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
      .then(res => res.json())
      .then(data => {
        if (!data.order_id) {
          //alert("Ошибка: не получен ID наряда");
          console.warn("Ошибка: не получен ID наряда", data.order_id)
          return;
        }
        //console.log("ид которое вернулось после сохранения", data.order_id, data.order_num);

        // rootId — это ID основного (main) наряда, к которому всё привязано
        let rootId;

        if (fullForm.value.part_type === 'main') {
          // Если сохраняем ОСНОВНОЕ изделие — оно и есть root
          rootId = data.order_id;
          // Запоминаем его, чтобы последующие части могли к нему привязаться
          lastRootId.value = rootId;
        } else {
          // Если сохраняем СОСТАВНУЮ часть — rootId = последний main
          rootId = lastRootId.value;
          // Если вдруг не установлен — fallback на order_id (на всякий случай)
          if (!rootId) {
            console.warn("lastRootId не установлен, используем текущий ID");
            rootId = data.order_id;
          }
        }

        // Спрашиваем, будем ли добавлять ещё части
        const createMore = confirm(
            `Нормировка "${fullForm.value.name}" сохранена!\n\nХотите добавить ещё одну часть?`
        );

        if (createMore) {
          // Остаться в форме — можно добавить ещё часть
          fullForm.value = null;
        } else {
          // Передаём rootId
          const rootId = fullForm.value.part_type === 'main'
              ? data.order_id
              : lastRootId.value || data.order_id;

          // Переход на Vue-страницу печати
          router.push({
            name: 'FormPrintNorm', // ← используем имя маршрута
            params: {
              id: rootId,
              orderNum: cardInfo.value.order_num // ← передаём номер заказа
            }
          });

          showPrintButton.value = true;
          setTimeout(() => {
            sessionStorage.removeItem(storageKey);
          }, 50000);
        }
      })
      .catch(err => {
        console.error('Ошибка сохранения:', err);
        alert('Не удалось сохранить нормировку');
      });
}

//TODO новая логика для расчета норм по материалам
const calculationContext = ref(null);
const includeDopMaterials = ref(false);

// Сбрасываем флаг при смене типа изделия, чтобы не «утек» на другие типы
watch(() => fullForm.value?.type, (newType) => {
  if (newType !== 'Лоджия' && newType !== 'loggia') {
    includeDopMaterials.value = false;
  }
}, { immediate: true });

// Сброс флага при смене позиции (опционально, но рекомендуется)
watch(() => cardInfo.value?.position, () => {
  includeDopMaterials.value = false;
});

async function recalculateNorms() {
  if (!fullForm.value || !cardInfo.value.order_num || !cardInfo.value.position) {
    alert('Недостаточно данных для расчёта');
    return;
  }

  //console.log(cardInfo.value);

  loading.value = true;
  try {
    const categoryName = fullForm.value.type; // например, "Окна"
    //const typeIzd = typeIzdMap[categoryName] || categoryName.toLowerCase();

    const response = await fetch('/api/materials/calculation', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_num: cardInfo.value.order_num,
        position: parseInt(cardInfo.value.position),
        type: categoryName,
        template: fullForm.value.code,
        count: parseInt(cardInfo.value.count),
        permis_dop_material: includeDopMaterials.value
      })
    });

    console.log("RESP", response);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка расчёта: ${response.status} — ${errorText}`);
    }

    const recalculatedOps = await response.json();

    calculationContext.value = recalculatedOps.context;

    //console.log(calculationContext.value);


    // Заменяем операции, но сохраняем структуру (rate, group и т.д.)
    const newOperations = fullForm.value.operations.map(existingOp => {
      // Ищем операцию с таким же именем в результате расчёта
      const recalculated = recalculatedOps.operation.find(op => op.name === existingOp.name);

      if (recalculated) {
        // Сохраняем group и rate, но обновляем значения
        return {
          ...existingOp,
          count: recalculated.count ?? existingOp.count,
          dynamicValue: recalculated.value ?? existingOp.dynamicValue,
          minutes: recalculated.minutes ?? existingOp.minutes,
          // rate пересчитаем ниже
        };
      }
      // Если операции нет в ответе — оставляем как есть (маловероятно)
      return existingOp;
    });

    // Пересчитываем rate для всех операций после обновления
    newOperations.forEach(op => {
      if (op.count > 0) {
        op.rate = op.dynamicValue / op.count;
      } else {
        op.rate = op.dynamicValue; // или 0 — зависит от логики
      }
    });

    // Обновляем форму
    fullForm.value.operations = newOperations;

    // Также можно обновить total_time
    const total = newOperations.reduce((sum, op) => sum + op.dynamicValue, 0);
    fullForm.value.total_time = parseFloat(total.toFixed(3));

  } catch (err) {
    console.error('Ошибка автоматического расчёта:', err);
    alert(`Не удалось рассчитать нормы: ${err.message}`);
  } finally {
    loading.value = false;
  }
}
//TODO end

// TODO костыль с доп операциями снизу(очень нужное!!!)
// Массив строк для ввода доп. операций
const customInputs = ref([
  { name: '', minutes: 0, count: 1} // первая строка по умолчанию
]);

function addCustomInputRow() {
  customInputs.value.push({ name: '', minutes: 0, count: 1});
}

function removeCustomInputRow(index) {
  if (customInputs.value.length <= 1) {
    // Оставляем хотя бы одну строку
    customInputs.value[index] = { name: '', minutes: 0, count: 1};
  } else {
    customInputs.value.splice(index, 1);
  }
}

const customOperationsToSend = computed(() => {
  return customInputs.value
      .filter(row => row.name.trim())
      .map(row => {
        const minutes = parseFloat(row.minutes) || 0;
        const valueInHours = minutes / 60; // ← преобразуем минуты в часы

        return {
          operation_name: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          operation_label: row.name.trim(),
          count: 1, // или 0 — но лучше 1, если не используется
          value: parseFloat(valueInHours.toFixed(3)),     // ← часы
          minutes: parseFloat(minutes.toFixed(3))         // ← минуты
        };
      });
});

// TODO конец костыля

</script>

<style scoped>
.form-container {
  font-family: Arial, sans-serif;
  /*max-width: 1900px;*/
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 24px;
}

.card-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 24px;
  font-size: 14px;
}

.card-info p {
  margin: 8px 0;
}

.order-image {
  max-width: 150px;
  max-height: 150px;
  object-fit: cover;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.order-image:hover {
  transform: scale(1.05);
}

/* Модальное окно */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.enlarged-image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 36px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  opacity: 0.8;
}

/* === Составные изделия === */
.composite-toggle, .parent-selection {
  margin-bottom: 16px;
  padding: 12px;
  background: #e7f3ff;
  border: 1px dashed #007bff;
  border-radius: 8px;
}

.form-control {
  margin: 0;
  line-height: 1.5;
}

.form-custom-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  box-sizing: border-box;
  cursor: pointer;
}

/* Для совместимости с другими полями */
.parent-selection small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #666;
}

.parent-selection select {
  width: 100%;
  padding: 8px;
  margin-top: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.text-muted {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* === Категории шаблонов === */
.forms-section h4 {
  color: #495057;
  margin-bottom: 16px;
}

.category-group {
  margin-bottom: 20px;
}

.category-title {
  margin: 0 0 10px 0;
  padding-bottom: 6px;
  border-bottom: 2px solid #007bff;
  color: #007bff;
  font-size: 16px;
  display: inline-block;
}

.templates-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-item {
  padding: 12px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.template-item:hover {
  background: #007bff;
  color: white;
}

.template-item.selected {
  background-color: #007bff;
  color: white;
  font-weight: 600;
  border-color: #0069d9;
}

/* === Форма операций === */
.full-form {
  margin-top: 20px;
  padding: 20px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.full-form h3 {
  color: #2c3e50;
  margin-top: 0;
}

.part-type-badge {
  background: #e0f7fa;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
  color: #006064;
}

.norm-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 14px;
}

.norm-table th, .norm-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.norm-table th {
  background: #f2f2f2;
}

.input-small {
  width: 80px;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
}

.text-center {
  text-align: center;
}

/* === Кнопки === */
.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.btn-cancel, .btn-save, .btn-print, .multiply-count-btn, .btn-recalculate {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}


.btn-save, .multiply-count-btn, .btn-recalculate{
  background: #28a745;
  color: white;
}


.calculation-info {
  background: #e3f2fd;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 16px;
}

.calculation-info small {
  display: block;
  margin: 4px 0; /* опционально: добавить отступы */
}

/* === Секция дополнительных операций === */
.custom-operations-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #495057;
  font-size: 16px;
}

/* === Доп. операции — редактируемая форма === */
.custom-operations-input {
  margin-top: 24px;
  padding: 16px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.custom-operations-input h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #495057;
  font-size: 16px;
}

.custom-operations-input .input-small.wide {
  width: 140px;
  padding: 6px 8px;
}

.custom-operations-input .btn-remove {
  width: 28px;
  height: 28px;
  padding: 0;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.custom-operations-input .btn-remove:hover {
  background: #c82333;
}

.custom-operations-input .btn-add-row {
  margin-top: 12px;
  padding: 6px 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.custom-operations-input .btn-add-row:hover {
  background: #218838;
}

.total-summary {
  margin: 16px 0;
  padding: 10px 16px;
  background-color: #e9f7ef;
  border-left: 4px solid #28a745;
  border-radius: 4px;
  font-weight: 600;
  color: #155724;
  font-size: 16px;
}

.checkbox-loggia {
  margin: 16px 0;
  padding: 10px 16px;
  background-color: #e9f7ef;
  border-left: 4px solid #28a745;
  border-radius: 4px;
  font-weight: 600;
  color: #155724;
  font-size: 16px;
}

.checkbox-loggia-input {
  margin-right: 10px;
}

</style>