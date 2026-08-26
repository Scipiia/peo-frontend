import { createRouter, createWebHistory } from "vue-router";
import OrdersList from "@/components/OrdersList.vue";
import FormSendPeo from "@/components/FormSendPeo.vue";
import OrdersDetails from "@/components/OrdersDetails.vue";
import PrintNormOrder from "@/components/PrintNormOrder.vue";
import NormOrdersList from "@/components/NormOrdersList.vue";
import EditNormOrder from "@/components/EditNormOrder.vue";
import AssignWorkers from "@/components/AssignWorkers.vue";
import FinalNormOrdersList from "@/components/FinalNormOrdersList.vue";
import NashchelnikCalculator from "@/components/NashchelnikCalculator.vue";
import AssignWorkersVitrage from "@/components/AssignWorkersVitrage.vue";
import LoginView from "@/components/LoginView.vue";
//admin
import AdminPanel from "@/components/admin/AdminPanel.vue";
import AdminTemplates from '@/components/admin/AdminTemplates.vue'
import AdminEditDataPeo from '@/components/admin/AdminEditDataPeo.vue'
import AdminTemplateEdit from "@/components/admin/AdminTemplateEdit.vue";
import AdminTemplateCreate from "@/components/admin/AdminTemplateCreate.vue";

import { isLoggedIn } from "@/auth";


const routes = [
    { path: "/login", name: "Login", component: LoginView, meta: { public: true } },

    { path: "/", redirect: "/orders" },

    {path: "/orders", name: "OrdersList", component: OrdersList},
    {path: "/orders/order-norm/:orderNum", name: "OrdersDetails" , component:  OrdersDetails, props: true},
    {path: "/orders/order-norm/form/:orderNum/:position", name: "FormSendPeo", component: FormSendPeo},
    {path: "/norm/order-norm/print/:id/:orderNum", name: "FormPrintNorm", component: PrintNormOrder},
    {path: "/norm/orders", name: "NormOrdersList", component: NormOrdersList},
    {path: "/norm/orders/order-norm/edit/:id", name: "EditNormOrder", component: EditNormOrder},
    {path: "/norm/workers/:id", name: "AssignWorkers", component: AssignWorkers},
    {path: "/final/orders", name: "FinalNormOrdersList", component: FinalNormOrdersList},
    {path: "/norm/calc-nasheln", name: "NashchelnikCalculator", component: NashchelnikCalculator},
    {path: "/norm/workers/vitrage/:id", name: "AssignWorkersVitrage", component: AssignWorkersVitrage},

    //админка
    // Маршрут админки с вложенными дочерними маршрутами
    {
        path: '/admin',
        component: AdminPanel,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: 'admin/templates' },
            { path: 'templates', component: AdminTemplates },
            { path: 'peo', component: AdminEditDataPeo },
        ]
    },
    {path: "/admin/templates/edit/:id", name: "AdminTemplateEdit", component: AdminTemplateEdit},
    {path: "/admin/templates/new", name: "AdminTemplateCreate", component: AdminTemplateCreate}
];

const router = createRouter({
    history: createWebHistory(),
    routes
})

// === НОВОЕ: защита маршрутов ===
// router.beforeEach((to, from, next) => {
//     // Если маршрут публичный (например, /login) — пропускаем
//     if (to.meta.public) {
//         return next()
//     }

//     // Если пользователь не залогинен — редирект на /login
//     if (!isLoggedIn()) {
//         return next('/login')
//     }

//     next()
// })

router.beforeEach((to, from, next) => {
    // to.matched.some(...) важно: так meta родителя /admin
    // применяется и к вложенным /admin/templates, /admin/peo
    const needsAuth = to.matched.some(record => record.meta.requiresAuth)

    // Если страница требует входа, а пользователь не залогинен — на /login,
    // запоминая, куда он хотел попасть
    if (needsAuth && !isLoggedIn()) {
        return next({ path: '/login', query: { redirect: to.fullPath } })
    }

    // Если залогиненный зашёл на /login — отправляем дальше по назначению
    if (to.path === '/login' && isLoggedIn()) {
        return next(to.query.redirect || '/admin')
    }

    next()   // все остальные страницы (включая /orders) — открыты всем
})

export default router;