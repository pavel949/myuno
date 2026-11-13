import { AdminTabbedWorkspace } from '@/components/admin/AdminTabbedWorkspace';
import AdminTransfers from './AdminTransfers';
import AdminTransferOperators from './AdminTransferOperators';
import AdminTransferSLA from './AdminTransferSLA';
import AdminVehicles from './AdminVehicles';

export default function AdminTransfersWorkspace() {
  return (
    <AdminTabbedWorkspace
      titleEn="Transfers"
      titleRu="Трансферы"
      subtitleEn="Orders, operators, response times and vehicles"
      subtitleRu="Заказы, операторы, сроки ответа и транспорт"
      tabs={[
        { value: 'orders', labelEn: 'Orders', labelRu: 'Заказы', content: <AdminTransfers /> },
        { value: 'operators', labelEn: 'Operators', labelRu: 'Операторы', content: <AdminTransferOperators /> },
        { value: 'sla', labelEn: 'Response times', labelRu: 'Сроки ответа', content: <AdminTransferSLA /> },
        { value: 'vehicles', labelEn: 'Vehicles', labelRu: 'Транспорт', content: <AdminVehicles /> },
      ]}
    />
  );
}
