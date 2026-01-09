import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  CreditCard,
  Wallet,
  CheckCircle2,
  User,
  Phone,
  Home,
  MessageSquare,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import { triggerRipple } from "@/hooks/useRipple";
import { toast } from "sonner";

const ServiceBooking = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const { items, getItemsByProvider, addItem, removeItem, clearByProvider } = useCart();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const provider = {
    id: id,
    name: language === "ru" ? "Алексей Мастеров" : "Alex Masters",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
  };

  const services = [
    { id: "s1", name: language === "ru" ? "Установка смесителя" : "Faucet installation", price: 1500, duration: "1 час" },
    { id: "s2", name: language === "ru" ? "Замена труб" : "Pipe replacement", price: 3000, duration: "2-4 часа" },
    { id: "s3", name: language === "ru" ? "Прочистка канализации" : "Drain cleaning", price: 2000, duration: "1-2 часа" },
    { id: "s4", name: language === "ru" ? "Установка унитаза" : "Toilet installation", price: 2500, duration: "2 часа" },
  ];

  // Load services from cart on mount
  useEffect(() => {
    if (id) {
      const cartServices = getItemsByProvider(id);
      if (cartServices.length > 0) {
        setSelectedServices(cartServices.map(item => item.id));
      }
    }
  }, [id, getItemsByProvider]);

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const paymentMethods = [
    { id: "cash", icon: Wallet, name: language === "ru" ? "Наличными" : "Cash" },
    { id: "card", icon: CreditCard, name: language === "ru" ? "Картой" : "Card" },
  ];

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedServicesData = services.filter(s => selectedServices.includes(s.id));
  const servicesTotal = selectedServicesData.reduce((sum, s) => sum + s.price, 0);
  const serviceFee = 100;
  const totalPrice = servicesTotal + serviceFee;

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || selectedServices.length === 0) {
      toast.error(language === "ru" ? "Выберите услуги, дату и время" : "Select services, date and time");
      return;
    }
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error(language === "ru" ? "Заполните контактные данные" : "Fill in contact details");
      return;
    }

    // Clear services from cart after booking
    if (id) {
      clearByProvider(id);
    }

    toast.success(language === "ru" ? "Заявка отправлена!" : "Booking submitted!");
    navigate("/bookings");
  };

  return (
    <AppLayout title={language === "ru" ? "Бронирование" : "Booking"} showBottomNav={false}>
      <div className="p-4 space-y-6 pb-40">
        {/* Provider Info */}
        <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
          <img
            src={provider.image}
            alt={provider.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">{provider.name}</h3>
            <p className="text-sm text-muted-foreground">
              {language === "ru" ? "Сантехник" : "Plumber"}
            </p>
          </div>
        </div>

        {/* Select Services */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              {language === "ru" ? "Выберите услуги" : "Select Services"}
            </h2>
            {selectedServices.length > 0 && (
              <Badge variant="secondary">
                {selectedServices.length} {language === "ru" ? "выбрано" : "selected"}
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {services.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <div
                  key={service.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    toggleService(service.id);
                  }}
                  className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {isSelected && (
                        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{service.name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{service.duration}</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-primary">₽{service.price}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Select Date */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {language === "ru" ? "Выберите дату" : "Select Date"}
          </h2>
          <div className="bg-card rounded-xl border border-border p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md"
            />
          </div>
        </div>

        {/* Select Time */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {language === "ru" ? "Выберите время" : "Select Time"}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={(e) => {
                  triggerRipple(e);
                  setSelectedTime(time);
                }}
                className={`relative overflow-hidden p-3 rounded-xl border text-center font-medium transition-all active:scale-95 ${
                  selectedTime === time
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Details */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {language === "ru" ? "Контактные данные" : "Contact Details"}
          </h2>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={language === "ru" ? "Ваше имя" : "Your name"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10 h-12"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={language === "ru" ? "Телефон" : "Phone"}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10 h-12"
              />
            </div>
            <div className="relative">
              <Home className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={language === "ru" ? "Адрес" : "Address"}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="pl-10 h-12"
              />
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Textarea
                placeholder={language === "ru" ? "Комментарий к заказу" : "Order notes"}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="pl-10 min-h-24"
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {language === "ru" ? "Способ оплаты" : "Payment Method"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    setPaymentMethod(method.id);
                  }}
                  className={`relative overflow-hidden flex items-center justify-center gap-2 p-4 rounded-xl border transition-all active:scale-95 ${
                    paymentMethod === method.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{method.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-4">
        {/* Price Summary */}
        <div className="space-y-2 text-sm">
          {selectedServicesData.map(service => (
            <div key={service.id} className="flex justify-between">
              <span className="text-muted-foreground">{service.name}</span>
              <span>₽{service.price}</span>
            </div>
          ))}
          {selectedServices.length === 0 && (
            <div className="text-center text-muted-foreground py-2">
              {language === "ru" ? "Выберите хотя бы одну услугу" : "Select at least one service"}
            </div>
          )}
          {selectedServices.length > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === "ru" ? "Сервисный сбор" : "Service fee"}
                </span>
                <span>₽{serviceFee}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>{language === "ru" ? "Итого" : "Total"}</span>
                <span className="text-primary">₽{totalPrice}</span>
              </div>
            </>
          )}
        </div>

        <Button
          onClick={handleBooking}
          disabled={selectedServices.length === 0}
          className="w-full h-14 text-lg font-semibold gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          {language === "ru" ? "Подтвердить бронирование" : "Confirm Booking"}
        </Button>
      </div>
    </AppLayout>
  );
};

export default ServiceBooking;
