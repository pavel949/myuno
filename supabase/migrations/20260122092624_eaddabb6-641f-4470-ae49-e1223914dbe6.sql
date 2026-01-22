-- =============================================
-- OPERATIONAL PROPERTY MANAGEMENT SYSTEM
-- Extension of core booking/property logic
-- =============================================

-- 1. Property Inventory Items (опись имущества как базовое состояние объекта)
CREATE TABLE IF NOT EXISTS public.property_inventory_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'general', -- furniture, electronics, kitchen, bathroom, bedroom, decor, appliances
    name TEXT NOT NULL,
    name_ru TEXT,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    condition TEXT DEFAULT 'good', -- new, good, fair, worn, damaged
    estimated_value NUMERIC(10,2),
    currency TEXT DEFAULT 'THB',
    photos TEXT[] DEFAULT '{}',
    serial_number TEXT,
    purchase_date DATE,
    warranty_until DATE,
    location_in_property TEXT, -- room/area
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_inventory_items ENABLE ROW LEVEL SECURITY;

-- Owner can manage their property inventory
CREATE POLICY "Owners can manage their property inventory"
ON public.property_inventory_items
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.owner_properties 
        WHERE id = property_inventory_items.property_id 
        AND owner_id = auth.uid()
    )
);

-- 2. Property Meters Configuration (настройки счётчиков объекта)
CREATE TABLE IF NOT EXISTS public.property_meters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
    meter_type TEXT NOT NULL, -- electricity, water, gas
    meter_name TEXT NOT NULL, -- e.g., "Main Electric", "Pool Pump"
    meter_name_ru TEXT,
    unit TEXT NOT NULL DEFAULT 'kWh', -- kWh, m3, units
    rate_per_unit NUMERIC(10,4),
    currency TEXT DEFAULT 'THB',
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_meters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their property meters"
ON public.property_meters
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.owner_properties 
        WHERE id = property_meters.property_id 
        AND owner_id = auth.uid()
    )
);

-- 3. Booking Operational Data (расширение бронирования операционными данными)
CREATE TABLE IF NOT EXISTS public.booking_operations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL UNIQUE REFERENCES public.property_bookings(id) ON DELETE CASCADE,
    
    -- Check-in data
    actual_check_in_at TIMESTAMPTZ,
    checked_in_by UUID,
    check_in_notes TEXT,
    check_in_photos TEXT[] DEFAULT '{}',
    
    -- Deposit info (связано с бронированием)
    deposit_amount NUMERIC(10,2),
    deposit_currency TEXT DEFAULT 'THB',
    deposit_method TEXT, -- cash, card, bank_transfer, crypto
    deposit_received_at TIMESTAMPTZ,
    deposit_received_by UUID,
    deposit_receipt_url TEXT,
    
    -- Check-out data  
    actual_check_out_at TIMESTAMPTZ,
    checked_out_by UUID,
    check_out_notes TEXT,
    check_out_photos TEXT[] DEFAULT '{}',
    
    -- Deposit return (часть завершения бронирования)
    deposit_return_status TEXT DEFAULT 'pending', -- pending, returned_full, returned_partial, withheld
    deposit_returned_amount NUMERIC(10,2),
    deposit_returned_at TIMESTAMPTZ,
    deposit_returned_by UUID,
    deposit_deduction_amount NUMERIC(10,2) DEFAULT 0,
    deposit_deduction_reason TEXT,
    deposit_deduction_photos TEXT[] DEFAULT '{}',
    
    -- Operational status
    cleaning_required BOOLEAN DEFAULT TRUE,
    cleaning_completed_at TIMESTAMPTZ,
    cleaning_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.booking_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage booking operations"
ON public.booking_operations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.property_bookings pb
        WHERE pb.id = booking_operations.booking_id 
        AND pb.owner_id = auth.uid()
    )
);

-- 4. Meter Readings (показания счётчиков при check-in/check-out)
CREATE TABLE IF NOT EXISTS public.booking_meter_readings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.property_bookings(id) ON DELETE CASCADE,
    meter_id UUID NOT NULL REFERENCES public.property_meters(id) ON DELETE CASCADE,
    reading_type TEXT NOT NULL, -- check_in, check_out
    reading_value NUMERIC(12,2) NOT NULL,
    reading_date TIMESTAMPTZ DEFAULT now(),
    photo_url TEXT,
    recorded_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.booking_meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage meter readings"
ON public.booking_meter_readings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.property_bookings pb
        WHERE pb.id = booking_meter_readings.booking_id 
        AND pb.owner_id = auth.uid()
    )
);

-- 5. Inventory Condition Reports (отклонения от базовой описи)
CREATE TABLE IF NOT EXISTS public.booking_inventory_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.property_bookings(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.property_inventory_items(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- check_in, check_out, during_stay
    previous_condition TEXT,
    current_condition TEXT NOT NULL, -- good, damaged, missing, needs_repair
    damage_description TEXT,
    photos TEXT[] DEFAULT '{}',
    estimated_damage_cost NUMERIC(10,2),
    currency TEXT DEFAULT 'THB',
    linked_to_deposit BOOLEAN DEFAULT FALSE,
    reported_by UUID,
    reported_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.booking_inventory_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage inventory reports"
ON public.booking_inventory_reports
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.property_bookings pb
        WHERE pb.id = booking_inventory_reports.booking_id 
        AND pb.owner_id = auth.uid()
    )
);

-- 6. Operational Tasks (задачи на сегодня - связаны с бронированиями и объектами)
CREATE TABLE IF NOT EXISTS public.property_operational_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.property_bookings(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL, -- check_in, check_out, cleaning, maintenance, inspection, meter_reading
    title TEXT NOT NULL,
    title_ru TEXT,
    description TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    assigned_to UUID,
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_operational_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage operational tasks"
ON public.property_operational_tasks
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.owner_properties 
        WHERE id = property_operational_tasks.property_id 
        AND owner_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_property ON public.property_inventory_items(property_id);
CREATE INDEX IF NOT EXISTS idx_meters_property ON public.property_meters(property_id);
CREATE INDEX IF NOT EXISTS idx_booking_operations_booking ON public.booking_operations(booking_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_booking ON public.booking_meter_readings(booking_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_booking ON public.booking_inventory_reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_operational_tasks_property_date ON public.property_operational_tasks(property_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_operational_tasks_status ON public.property_operational_tasks(status, scheduled_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_property_inventory_items_updated_at ON public.property_inventory_items;
CREATE TRIGGER update_property_inventory_items_updated_at
    BEFORE UPDATE ON public.property_inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_meters_updated_at ON public.property_meters;
CREATE TRIGGER update_property_meters_updated_at
    BEFORE UPDATE ON public.property_meters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_operations_updated_at ON public.booking_operations;
CREATE TRIGGER update_booking_operations_updated_at
    BEFORE UPDATE ON public.booking_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_operational_tasks_updated_at ON public.property_operational_tasks;
CREATE TRIGGER update_property_operational_tasks_updated_at
    BEFORE UPDATE ON public.property_operational_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate operational tasks from bookings
CREATE OR REPLACE FUNCTION generate_booking_operational_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Create check-in task
    INSERT INTO public.property_operational_tasks (
        property_id, booking_id, task_type, title, title_ru, 
        scheduled_date, priority, status
    ) VALUES (
        NEW.property_id, NEW.id, 'check_in',
        'Guest Check-in: ' || COALESCE(NEW.guest_name, 'Guest'),
        'Заезд гостя: ' || COALESCE(NEW.guest_name, 'Гость'),
        NEW.check_in::date, 'high', 'pending'
    );
    
    -- Create check-out task
    INSERT INTO public.property_operational_tasks (
        property_id, booking_id, task_type, title, title_ru,
        scheduled_date, priority, status
    ) VALUES (
        NEW.property_id, NEW.id, 'check_out',
        'Guest Check-out: ' || COALESCE(NEW.guest_name, 'Guest'),
        'Выезд гостя: ' || COALESCE(NEW.guest_name, 'Гость'),
        NEW.check_out::date, 'high', 'pending'
    );
    
    -- Create cleaning task (day of check-out)
    INSERT INTO public.property_operational_tasks (
        property_id, booking_id, task_type, title, title_ru,
        scheduled_date, priority, status
    ) VALUES (
        NEW.property_id, NEW.id, 'cleaning',
        'Cleaning after ' || COALESCE(NEW.guest_name, 'Guest'),
        'Уборка после ' || COALESCE(NEW.guest_name, 'Гость'),
        NEW.check_out::date, 'normal', 'pending'
    );
    
    -- Create booking operations record
    INSERT INTO public.booking_operations (booking_id)
    VALUES (NEW.id)
    ON CONFLICT (booking_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to property_bookings
DROP TRIGGER IF EXISTS auto_generate_booking_tasks ON public.property_bookings;
CREATE TRIGGER auto_generate_booking_tasks
    AFTER INSERT ON public.property_bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_operational_tasks();