<template>
  <div id="app">
    <nav class="navbar">
      <router-link to="/" class="nav-item">首页</router-link>
      <router-link to="/add" class="nav-item">添加记录</router-link>
      <router-link to="/stats" class="nav-item">统计</router-link>
      <router-link to="/recurring" class="nav-item">周期账单</router-link>
    </nav>
    <main class="container">
      <router-view/>
    </main>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  background: #f5f6fa;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.navbar {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-item {
  color: #3498db;
  text-decoration: none;
  font-weight: bold;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: #ebf5fb;
}

.nav-item.router-link-active {
  background-color: #3498db;
  color: white;
}
</style>
    