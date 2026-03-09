import { createRouter, createWebHistory } from "vue-router";
import OrdersList from "@/components/OrdersList.vue";
import FormSendPeo from "@/components/FormSendPeo.vue";
import OrdersDetails from "@/components/OrdersDetails.vue";
import PrintNormOrder from "@/components/PrintNormOrder.vue";
import NormOrdersList from "@/components/NormOrdersList.vue";
import EditNormOrder from "@/components/EditNormOrder.vue";
import AssignWorkers from "@/components/AssignWorkers.vue";
import FinalNormOrdersList from "@/components/FinalNormOrdersList.vue";
//admin
import AdminPanel from "@/components/admin/AdminPanel.vue";
import AdminTemplates from '@/components/admin/AdminTemplates.vue'
import AdminEditDataPeo from '@/components/admin/AdminEditDataPeo.vue'
import AdminTemplateEdit from "@/components/admin/AdminTemplateEdit.vue";
import AdminTemplateCreate from "@/components/admin/AdminTemplateCreate.vue";


const routes = [
    {path: "/orders", name: "OrdersList", component: OrdersList},
    {path: "/orders/order-norm/:orderNum", name: "OrdersDetails" , component:  OrdersDetails, props: true},
    {path: "/orders/order-norm/form/:orderNum/:position", name: "FormSendPeo", component: FormSendPeo},
    {path: "/norm/order-norm/print/:id/:orderNum", name: "FormPrintNorm", component: PrintNormOrder},
    {path: "/norm/orders", name: "NormOrdersList", component: NormOrdersList},
    {path: "/norm/orders/order-norm/edit/:id", name: "EditNormOrder", component: EditNormOrder},
    {path: "/norm/workers/:id", name: "AssignWorkers", component: AssignWorkers},
    {path: "/final/orders", name: "FinalNormOrdersList", component: FinalNormOrdersList},

    //админка
    // Маршрут админки с вложенными дочерними маршрутами
    {
        path: '/admin',
        component: AdminPanel,
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

export default router;