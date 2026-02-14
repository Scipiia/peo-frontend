 const { defineConfig } = require('@vue/cli-service')
// module.exports = defineConfig({
//   transpileDependencies: true,
//   publicPath: '/'
// })

 module.exports = defineConfig({
   transpileDependencies: true,
   publicPath: '/',
   devServer: {
     port: 8081, // или 5173 для Vite
     proxy: {
       '/api': {
         target: 'http://localhost:8080', // порт вашего бэкенда
         changeOrigin: true,
         pathRewrite: {
           '^/api': '/api'
         }
       }
     }
   }
 })
