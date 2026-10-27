/** Labels project domain state; an unknown state must never look pending/confirmed. */
export function propertyBookingStatus(status: string | null | undefined) {
  const labels: Record<string, { label: string; labelRu: string; labelTh: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    confirmed: { label: 'Confirmed', labelRu: 'Подтверждено', labelTh: "ยืนยันแล้ว", variant: 'default' },
    pending: { label: 'Pending', labelRu: 'Ожидает', labelTh: "รอดำเนินการ", variant: 'secondary' },
    pending_payment: { label: 'Awaiting payment', labelRu: 'Ожидает оплаты', labelTh: "รอชำระเงิน", variant: 'secondary' },
    cancelled: { label: 'Cancelled', labelRu: 'Отменено', labelTh: "ยกเลิกแล้ว", variant: 'destructive' },
    rejected: { label: 'Rejected', labelRu: 'Отклонено', labelTh: "ปฏิเสธแล้ว", variant: 'destructive' },
    refunded: { label: 'Refunded', labelRu: 'Возвращено', labelTh: "คืนเงินแล้ว", variant: 'outline' },
    expired: { label: 'Expired', labelRu: 'Истекло', labelTh: "หมดอายุ", variant: 'outline' },
    no_show: { label: 'No-show', labelRu: 'Не заехал', labelTh: "ไม่มาเข้าพัก", variant: 'destructive' },
    completed: { label: 'Completed', labelRu: 'Завершено', labelTh: "เสร็จสิ้น", variant: 'outline' },
    checked_in: { label: 'Checked in', labelRu: 'Заселён', labelTh: "เช็คอินแล้ว", variant: 'default' },
    checked_out: { label: 'Checked out', labelRu: 'Выехал', labelTh: "เช็คเอาท์แล้ว", variant: 'outline' },
    in_progress: { label: 'In progress', labelRu: 'В процессе', labelTh: "กำลังดำเนินการ", variant: 'default' },
  };
  return labels[status ?? ''] ?? { label: status ? `Unknown status: ${status}` : 'Status unavailable', labelRu: status ? `Неизвестный статус: ${status}` : 'Статус неизвестен', labelTh: status ? `สถานะไม่ทราบ: ${status}` : 'ไม่มีข้อมูลสถานะ', variant: 'outline' as const };
}
