<template>
  <div class="calculator-modal" v-if="isOpen" @click="close">
    <div class="calculator-content" @click.stop>
      <div class="calculator-header">
        <h3>Калькулятор формул</h3>
        <button class="close-btn" @click="close">×</button>
        <!-- eslint-disable-next-line no-undef -->
      </div>

      <div class="calculator-body">
        <div class="input-group">
          <label>Формула (например: =(685*90+1230*4)/1000)</label>
          <textarea
              v-model="formula"
              placeholder="=(685*90+1230*4+2455*9)/1000"
              rows="3"
              class="formula-input"
              @keydown.enter.ctrl="calculate"
          ></textarea>
        </div>

        <button @click="calculate" class="calc-btn">Рассчитать</button>

        <div v-if="result !== null" class="result-box">
          <div class="result-label">Результат:</div>
          <div class="result-value">{{ result }}</div>

          <div class="action-buttons">
            <button @click="copyResult" class="copy-btn secondary">
              {{ copied ? '✓ Скопировано' : 'Копировать' }}
            </button>
            <button @click="applyResult" class="copy-btn primary">
              ⬇ Вставить в поле и закрыть
            </button>
          </div>
        </div>

        <div v-if="error" class="error-box">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { ref } from 'vue';

defineProps({
  isOpen: { type: Boolean, default: false }
});


const emit = defineEmits(['update:isOpen', 'apply']);
const formula = ref('');
const result = ref(null);
const error = ref('');
const copied = ref(false);

function close() {
  emit('update:isOpen', false);
}

function calculate() {
  error.value = '';
  result.value = null;

  if (!formula.value.trim()) {
    error.value = 'Введите формулу';
    return;
  }

  try {
    let expr = formula.value.trim();
    if (expr.startsWith('=')) expr = expr.substring(1);

    const calcResult = new Function('return ' + expr)();

    if (typeof calcResult === 'number' && !isNaN(calcResult)) {
      result.value = Math.round(calcResult * 1000) / 1000;
    } else {
      error.value = 'Результат не является числом';
    }
  } catch (e) {
    error.value = 'Ошибка в формуле: ' + e.message;
  }
}

function copyResult() {
  if (result.value !== null) {
    navigator.clipboard.writeText(result.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
}

// НОВАЯ ФУНКЦИЯ: Вставить и закрыть
function applyResult() {
  if (result.value !== null) {
    emit('apply', result.value);
    close();
  }
}
</script>

<style scoped>

.calculator-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.calculator-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.calculator-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.calculator-body {
  padding: 20px;
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.formula-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
}

.calc-btn {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 16px;
}

.calc-btn:hover {
  background: #45a049;
}

.result-box {
  background: #f0f8f0;
  border: 1px solid #4CAF50;
  border-radius: 4px;
  padding: 16px;
  text-align: center;
}

.result-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.result-value {
  font-size: 32px;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 12px;
}

.copy-btn {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.copy-btn:hover {
  background: #0b7dda;
}

.error-box {
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
  padding: 12px;
  color: #f44336;
  font-size: 14px;
}

/* ... твои старые стили ... */
.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.copy-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.copy-btn.secondary {
  background: #e0e0e0;
  color: #333;
}
.copy-btn.secondary:hover { background: #d0d0d0; }
.copy-btn.primary {
  background: #2196F3;
  color: white;
}
.copy-btn.primary:hover { background: #0b7dda; }
</style>