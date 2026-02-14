<template>
  <div class="additional-ops">
    <h3 class="additional-ops-label">
      <label>Доп работы</label>
    </h3>
    <table class="operations-table">
      <thead>
      <tr>
        <th width="40%">Операция</th>
        <th width="10%">Норма н/час</th>
        <th width="10%">Норма н/мин</th>
        <th>ФИО исполнителя</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="n in 3" :key="n">
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
      <tr class="total-row">
        <td colspan="3" class="text-right">
          <strong>Итого доп. работ:</strong>
        </td>
        <td></td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.additional-ops {
  margin-top: 6px;
  margin-bottom: 0;
  break-inside: avoid;
  page-break-inside: avoid;
}

.additional-ops-label {
  margin: 0;
  padding: 0;
  font-size: 12px;
  font-weight: bold;
  line-height: 1.2;
}

.operations-table select {
  font-size: 12px;
}
</style>