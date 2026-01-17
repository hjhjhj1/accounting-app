<template>
  <div id="app">
    <nav class="navbar">
      <router-link to="/" class="nav-item">首页</router-link>
      <router-link to="/add" class="nav-item">添加记录</router-link>
      <router-link to="/stats" class="nav-item">统计</router-link>
      <router-link to="/periodic-billing" class="nav-item">周期账单</router-link>
    </nav>
    <main class="container">
      <router-view/>
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.navbar {
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-item {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: #3498db;
  color: white;
}

.nav-item.router-link-active {
  background-color: #3498db;
  color: white;
}

.container {
  padding: 0;
}

@media print {
  .navbar {
    display: none;
  }
}
</style>
    