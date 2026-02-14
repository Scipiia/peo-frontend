<template>
  <div id="app">
    <!-- Навигационная панель (не отображается при печати) -->
    <nav class="navbar no-print">
      <div class="nav-container">
        <div class="nav-logo">
          <img src="../public/logo_pasport_new.jpg" alt="Логотип NormApp" class="logo-img" />
          <span></span>
        </div>
        <ul class="nav-menu">
          <li class="nav-item">
            <router-link to="/orders" class="nav-link">Заказы из ДЕМ</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/norm/orders/" class="nav-link">Нормированные наряды</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/final/orders/" class="nav-link">Отчёты для ПЭО</router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Основное содержимое -->
    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f7fa;
  color: #333;
  line-height: 1.6;
}

#app {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 16px;
  text-align: center;
}

.navbar {
  background-color: #2c3e50;
  padding: 0;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  font-weight: bold;
  font-size: 1.2rem;
}

.logo-img {
  height: 40px;
  width: auto;
  border-radius: 6px;
}

.nav-menu {
  list-style: none;
  display: flex;
  gap: 24px;
  margin: 0;
  padding: 12px 0;
}

.nav-item {
  transition: transform 0.1s ease;
}

.nav-item:hover {
  transform: translateY(-1px);
}

/* Ссылки */
.nav-link {
  color: #ffffffcc;
  text-decoration: none;
  font-size: 0.96rem;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.15);
}

/* Активная ссылка (выделение текущей страницы) */
.nav-link.router-link-exact-active {
  color: #ffffff;
  background-color: #42b983;
  font-weight: 600;
}

/* Основное содержимое */
.main-content {
  text-align: left;
  min-height: calc(100vh - 100px);
}

/* Режим печати — скрываем навигацию */
@media print {
  .no-print {
    display: none !important;
  }

  body, #app {
    background: white;
    margin: 0;
    padding: 1cm;
    font-size: 12pt;
  }

  .main-content {
    margin-top: 0;
  }

  @page {
    margin: 1cm;
  }
}

/* Адаптивность (мобильные устройства) */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px;
  }

  .nav-menu {
    flex-wrap: wrap;
    justify-content: center;
    padding: 8px 0;
  }

  .nav-link {
    font-size: 0.9rem;
    padding: 5px 9px;
  }

  .nav-logo {
    margin-bottom: 8px;
  }
}
</style>