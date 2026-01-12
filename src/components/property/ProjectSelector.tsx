import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyProjects, useCreatePropertyProject, PropertyProject } from '@/hooks/usePropertyProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, MapPin, Calendar, Loader2 } from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { Checkbox } from '@/components/ui/checkbox';
import { ProjectLocationPicker } from './ProjectLocationPicker';

interface ProjectSelectorProps {
  value?: string;
  onChange: (projectId: string | undefined, project?: PropertyProject) => void;
  selectedProject?: PropertyProject | null;
}

const projectAmenities = [
  { id: 'pool', labelEn: 'Pool', labelRu: 'Бассейн' },
  { id: 'gym', labelEn: 'Gym', labelRu: 'Спортзал' },
  { id: 'security', labelEn: '24h Security', labelRu: 'Охрана 24ч' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка' },
  { id: 'garden', labelEn: 'Garden', labelRu: 'Сад' },
  { id: 'playground', labelEn: 'Playground', labelRu: 'Детская площадка' },
  { id: 'restaurant', labelEn: 'Restaurant', labelRu: 'Ресторан' },
  { id: 'spa', labelEn: 'Spa', labelRu: 'Спа' },
  { id: 'tennis', labelEn: 'Tennis Court', labelRu: 'Теннисный корт' },
  { id: 'beach_access', labelEn: 'Beach Access', labelRu: 'Доступ к пляжу' },
  { id: 'concierge', labelEn: 'Concierge', labelRu: 'Консьерж' },
  { id: 'shuttle', labelEn: 'Shuttle Service', labelRu: 'Трансфер' },
];

const districts = [
  'Patong', 'Kata', 'Karon', 'Rawai', 'Nai Harn',
  'Kamala', 'Surin', 'Bang Tao', 'Laguna', 'Cherngtalay',
  'Phuket Town', 'Chalong', 'Kathu', 'Mai Khao', 'Nai Yang'
];

export function ProjectSelector({ value, onChange, selectedProject }: ProjectSelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: projects, isLoading } = usePropertyProjects();
  const createProject = useCreatePropertyProject();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    address: '',
    district: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    developer_name: '',
    year_built: '',
    total_units: '',
    cover_image: '',
    images: [] as string[],
    video_url: '',
    amenities: [] as string[],
    infrastructure: [] as string[],
  });

  const handleProjectChange = (projectId: string) => {
    if (projectId === 'none') {
      onChange(undefined, undefined);
    } else if (projectId === 'create') {
      setShowCreateDialog(true);
    } else {
      const project = projects?.find(p => p.id === projectId);
      onChange(projectId, project);
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleCreateProject = async () => {
    if (!formData.name_en) return;

    const newProject = await createProject.mutateAsync({
      name_en: formData.name_en,
      name_ru: formData.name_ru || formData.name_en,
      description_en: formData.description_en || undefined,
      description_ru: formData.description_ru || undefined,
      address: formData.address || undefined,
      district: formData.district || undefined,
      lat: formData.lat,
      lng: formData.lng,
      developer_name: formData.developer_name || undefined,
      year_built: formData.year_built ? parseInt(formData.year_built) : undefined,
      total_units: formData.total_units ? parseInt(formData.total_units) : undefined,
      cover_image: formData.cover_image || undefined,
      images: formData.images.length > 0 ? formData.images : undefined,
      video_url: formData.video_url || undefined,
      amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
      infrastructure: formData.infrastructure.length > 0 ? formData.infrastructure : undefined,
    });

    onChange(newProject.id, newProject);
    setShowCreateDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      address: '',
      district: '',
      lat: undefined,
      lng: undefined,
      developer_name: '',
      year_built: '',
      total_units: '',
      cover_image: '',
      images: [],
      video_url: '',
      amenities: [],
      infrastructure: [],
    });
  };

  return (
    <>
      <div className="space-y-3">
        <Label>{isRu ? 'Проект / ЖК' : 'Project / Complex'}</Label>
        <Select value={value || 'none'} onValueChange={handleProjectChange}>
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Выберите проект' : 'Select project'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {isRu ? '— Без проекта (отдельный объект)' : '— No project (standalone)'}
            </SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{isRu ? project.name_ru : project.name_en}</span>
                  {project.district && (
                    <span className="text-xs text-muted-foreground">• {project.district}</span>
                  )}
                </div>
              </SelectItem>
            ))}
            <SelectItem value="create" className="text-primary">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {isRu ? 'Создать новый проект' : 'Create new project'}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Selected project preview */}
        {selectedProject && (
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="flex gap-3">
                {selectedProject.cover_image ? (
                  <img
                    src={selectedProject.cover_image}
                    alt={selectedProject.name_en}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {isRu ? selectedProject.name_ru : selectedProject.name_en}
                  </h4>
                  {selectedProject.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {selectedProject.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedProject.developer_name && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedProject.developer_name}
                      </Badge>
                    )}
                    {selectedProject.year_built && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {selectedProject.year_built}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Новый проект / ЖК' : 'New Project / Complex'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{isRu ? 'Название (EN)' : 'Name (EN)'} *</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="Laguna Beach Resort"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
                <Input
                  value={formData.name_ru}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                  placeholder="Лагуна Бич Резорт"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{isRu ? 'Застройщик' : 'Developer'}</Label>
                <Input
                  value={formData.developer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, developer_name: e.target.value }))}
                  placeholder="Sansiri"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>{isRu ? 'Год постройки' : 'Year Built'}</Label>
                  <Input
                    type="number"
                    value={formData.year_built}
                    onChange={(e) => setFormData(prev => ({ ...prev, year_built: e.target.value }))}
                    placeholder="2022"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Всего юнитов' : 'Total Units'}</Label>
                  <Input
                    type="number"
                    value={formData.total_units}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_units: e.target.value }))}
                    placeholder="120"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <ProjectLocationPicker
              value={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng, address: formData.address } : undefined}
              onChange={(location) => setFormData(prev => ({
                ...prev,
                lat: location.lat,
                lng: location.lng,
                address: location.address
              }))}
            />

            <div className="space-y-2">
              <Label>{isRu ? 'Адрес (уточнение)' : 'Address (details)'}</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Beach Road"
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Район' : 'District'}</Label>
              <Select
                value={formData.district}
                onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRu ? 'Выберите район' : 'Select district'} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>{isRu ? 'Обложка проекта' : 'Project Cover'}</Label>
              <ImageUpload
                folder="property-projects"
                onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                placeholder={isRu ? 'Загрузить обложку' : 'Upload cover'}
              />
              {formData.cover_image && (
                <img
                  src={formData.cover_image}
                  alt="Cover"
                  className="w-32 h-20 object-cover rounded-lg"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Фото территории' : 'Territory Photos'}</Label>
              <MultiImageUpload
                value={formData.images}
                folder="property-projects"
                onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                maxImages={10}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Видео (YouTube/Vimeo)' : 'Video (YouTube/Vimeo)'}</Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <Label>{isRu ? 'Удобства территории' : 'Project Amenities'}</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {projectAmenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`amenity-${amenity.id}`}
                      checked={formData.amenities.includes(amenity.id)}
                      onCheckedChange={() => handleAmenityToggle(amenity.id)}
                    />
                    <label
                      htmlFor={`amenity-${amenity.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {isRu ? amenity.labelRu : amenity.labelEn}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                  placeholder="Modern resort complex..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
                <Textarea
                  value={formData.description_ru}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                  placeholder="Современный курортный комплекс..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!formData.name_en || createProject.isPending}
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRu ? 'Создание...' : 'Creating...'}
                </>
              ) : (
                isRu ? 'Создать проект' : 'Create Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
