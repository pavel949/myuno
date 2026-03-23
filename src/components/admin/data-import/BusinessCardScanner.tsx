import React, { useState, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { Camera, Upload, Loader2, Check, AlertCircle, Sparkles, Building2, Phone, Mail, Globe, MapPin, User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import browserImageCompression from 'browser-image-compression';

interface ExtractedData {
  company_name?: string;
  company_name_thai?: string;
  contact_person?: string;
  position?: string;
  phone?: string[];
  email?: string;
  website?: string;
  address?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    line?: string;
    whatsapp?: string;
  };
  vertical?: string;
  vertical_info?: {
    id: string;
    nameEn: string;
    nameRu: string;
  };
  suggested_services?: string[];
  description?: string;
  raw_text?: string;
  confidence?: number;
}

interface BusinessCardScannerProps {
  onProviderCreated?: (providerId: string) => void;
}

const VERTICALS = [
  { id: 'restaurants', nameEn: 'Restaurants & Cafes', nameRu: 'Рестораны и кафе' },
  { id: 'salons', nameEn: 'Beauty Salons', nameRu: 'Салоны красоты' },
  { id: 'tours', nameEn: 'Tours & Excursions', nameRu: 'Туры и экскурсии' },
  { id: 'yachts', nameEn: 'Boat Charters', nameRu: 'Аренда яхт и катеров' },
  { id: 'property', nameEn: 'Real Estate', nameRu: 'Недвижимость' },
  { id: 'legal', nameEn: 'Legal Services', nameRu: 'Юридические услуги' },
  { id: 'clinics', nameEn: 'Medical Clinics', nameRu: 'Клиники' },
  { id: 'cleaning', nameEn: 'Cleaning Services', nameRu: 'Клининг' },
  { id: 'transport', nameEn: 'Transport & Rentals', nameRu: 'Транспорт' },
  { id: 'fitness', nameEn: 'Fitness & Gyms', nameRu: 'Фитнес' },
  { id: 'construction', nameEn: 'Construction', nameRu: 'Строительство' },
  { id: 'retail', nameEn: 'Retail & Shops', nameRu: 'Магазины' },
  { id: 'education', nameEn: 'Education', nameRu: 'Образование' },
  { id: 'pets', nameEn: 'Pet Services', nameRu: 'Услуги для питомцев' },
  { id: 'events', nameEn: 'Events', nameRu: 'Мероприятия' },
  { id: 'it', nameEn: 'IT & Digital', nameRu: 'IT и Диджитал' },
  { id: 'finance', nameEn: 'Finance', nameRu: 'Финансы' },
  { id: 'other', nameEn: 'Other Services', nameRu: 'Другое' },
];

export function BusinessCardScanner({ onProviderCreated }: BusinessCardScannerProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRu = language === 'ru';
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image
      const compressed = await browserImageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        processImage(base64);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      logger.error('Error processing file:', err);
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Не удалось обработать изображение' : 'Failed to process image',
        variant: 'destructive',
      });
    }
  }, [isRu, toast]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      logger.error('Camera access error:', err);
      toast({
        title: isRu ? 'Ошибка камеры' : 'Camera Error',
        description: isRu ? 'Не удалось получить доступ к камере' : 'Failed to access camera',
        variant: 'destructive',
      });
    }
  }, [isRu, toast]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    
    setImagePreview(base64);
    stopCamera();
    processImage(base64);
  }, [stopCamera]);

  // Process image with AI
  const processImage = useCallback(async (base64Image: string) => {
    setIsProcessing(true);
    setExtractedData(null);
    setEditedData(null);

    try {
      const { data, error } = await supabase.functions.invoke('scan-business-card', {
        body: { imageBase64: base64Image }
      });

      if (error) throw error;

      setExtractedData(data);
      setEditedData(data);

      toast({
        title: isRu ? 'Карточка распознана' : 'Card Scanned',
        description: isRu 
          ? `Уверенность: ${data.confidence}%` 
          : `Confidence: ${data.confidence}%`,
      });
    } catch (err) {
      logger.error('Scan error:', err);
      toast({
        title: isRu ? 'Ошибка сканирования' : 'Scan Error',
        description: isRu ? 'Не удалось распознать карточку' : 'Failed to scan card',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isRu, toast]);

  // Create provider from extracted data
  const createProvider = useCallback(async () => {
    if (!editedData?.company_name) {
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Название компании обязательно' : 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Prepare provider data
      const providerData = {
        name: editedData.company_name,
        name_en: editedData.company_name,
        name_ru: editedData.company_name_thai || editedData.company_name,
        contact_name: editedData.contact_person || null,
        phone: editedData.phone?.[0] || null,
        email: editedData.email || null,
        website: editedData.website || null,
        address: editedData.address || null,
        description_en: editedData.description || null,
        description_ru: editedData.description || null,
        is_verified: true,
        is_active: true,
        business_category: editedData.vertical || 'other',
        created_by_uno_team: true,
      };

      const { data, error } = await supabase
        .from('providers')
        .insert([providerData])
        .select('id')
        .single();

      if (error) throw error;

      toast({
        title: isRu ? 'Провайдер создан' : 'Provider Created',
        description: editedData.company_name,
      });

      onProviderCreated?.(data.id);

      // Reset form
      setImagePreview(null);
      setExtractedData(null);
      setEditedData(null);

    } catch (err) {
      logger.error('Create provider error:', err);
      toast({
        title: isRu ? 'Ошибка создания' : 'Creation Error',
        description: isRu ? 'Не удалось создать провайдера' : 'Failed to create provider',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }, [editedData, isRu, toast, onProviderCreated]);

  // Reset scanner
  const resetScanner = useCallback(() => {
    setImagePreview(null);
    setExtractedData(null);
    setEditedData(null);
    stopCamera();
  }, [stopCamera]);

  return (
    <div className="space-y-6">
      {/* Camera/Upload Section */}
      {!imagePreview && !isCameraActive && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={startCamera}
            className="flex-1 h-24 flex-col gap-2"
          >
            <Camera className="h-8 w-8" />
            <span>{isRu ? 'Включить камеру' : 'Open Camera'}</span>
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 h-24 flex-col gap-2"
          >
            <Upload className="h-8 w-8" />
            <span>{isRu ? 'Загрузить фото' : 'Upload Photo'}</span>
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Camera View */}
      {isCameraActive && (
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white/50 border-dashed rounded-lg w-[80%] h-[60%]" />
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button variant="secondary" onClick={stopCamera}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={capturePhoto} size="lg" className="px-8">
              <Camera className="h-5 w-5 mr-2" />
              {isRu ? 'Сфотографировать' : 'Capture'}
            </Button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Business card"
            className="w-full max-h-64 object-contain rounded-xl border bg-muted"
          />
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {isRu ? 'AI анализирует карточку...' : 'AI analyzing card...'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Data Form */}
      {editedData && !isProcessing && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-warning" />
                {isRu ? 'Распознанные данные' : 'Extracted Data'}
              </CardTitle>
              <Badge variant={extractedData?.confidence && extractedData.confidence > 80 ? 'default' : 'secondary'}>
                {extractedData?.confidence}% {isRu ? 'уверенность' : 'confidence'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Name */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {isRu ? 'Название компании' : 'Company Name'}
              </Label>
              <Input
                value={editedData.company_name || ''}
                onChange={(e) => setEditedData({ ...editedData, company_name: e.target.value })}
                placeholder={isRu ? 'Введите название' : 'Enter company name'}
              />
            </div>

            {/* Vertical Selection */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {isRu ? 'Категория бизнеса' : 'Business Category'}
              </Label>
              <Select
                value={editedData.vertical || 'other'}
                onValueChange={(v) => setEditedData({ ...editedData, vertical: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERTICALS.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {isRu ? v.nameRu : v.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {isRu ? 'Контактное лицо' : 'Contact Person'}
                </Label>
                <Input
                  value={editedData.contact_person || ''}
                  onChange={(e) => setEditedData({ ...editedData, contact_person: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {isRu ? 'Телефон' : 'Phone'}
                </Label>
                <Input
                  value={editedData.phone?.[0] || ''}
                  onChange={(e) => setEditedData({ ...editedData, phone: [e.target.value] })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={editedData.email || ''}
                  onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {isRu ? 'Сайт' : 'Website'}
                </Label>
                <Input
                  value={editedData.website || ''}
                  onChange={(e) => setEditedData({ ...editedData, website: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {isRu ? 'Адрес' : 'Address'}
              </Label>
              <Input
                value={editedData.address || ''}
                onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
              />
            </div>

            {/* Suggested Services */}
            {editedData.suggested_services && editedData.suggested_services.length > 0 && (
              <div className="grid gap-2">
                <Label>{isRu ? 'Предполагаемые услуги' : 'Suggested Services'}</Label>
                <div className="flex flex-wrap gap-2">
                  {editedData.suggested_services.map((service, i) => (
                    <Badge key={i} variant="secondary">{service}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="grid gap-2">
              <Label>{isRu ? 'Описание' : 'Description'}</Label>
              <Textarea
                value={editedData.description || ''}
                onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetScanner} className="flex-1">
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button 
                onClick={createProvider} 
                disabled={isCreating || !editedData.company_name}
                className="flex-1"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {isRu ? 'Создать провайдера' : 'Create Provider'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
