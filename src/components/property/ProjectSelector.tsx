import React, { useState, useMemo, useRef, useEffect, memo, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyProjects, PropertyProject } from '@/hooks/usePropertyProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Calendar, Loader2, Search, X, Clock, ExternalLink, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProjectInfoCard } from './ProjectInfoCard';

interface ProjectSelectorProps {
  value?: string;
  onChange: (projectId: string | undefined, project?: PropertyProject) => void;
  selectedProject?: PropertyProject | null;
}

function ProjectSelectorInner({ value, onChange, selectedProject }: ProjectSelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: projects, isLoading } = usePropertyProjects();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!projects || !searchQuery.trim()) return projects || [];
    
    const query = searchQuery.toLowerCase().trim();
    return projects.filter(project => 
      project.name_en.toLowerCase().includes(query) ||
      project.name_ru.toLowerCase().includes(query) ||
      project.district?.toLowerCase().includes(query) ||
      project.address?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Check if exact match exists
  const exactMatchExists = useMemo(() => {
    if (!searchQuery.trim() || !projects) return false;
    const query = searchQuery.toLowerCase().trim();
    return projects.some(p => 
      p.name_en.toLowerCase() === query || 
      p.name_ru.toLowerCase() === query
    );
  }, [projects, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectProject = useCallback((project: PropertyProject) => {
    onChange(project.id, project);
    setSearchQuery('');
    setIsOpen(false);
  }, [onChange]);

  const handleClearProject = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined, undefined);
    setSearchQuery('');
  }, [onChange]);

  const handleSubmitRequest = useCallback(async () => {
    if (!requestName.trim() || !user?.id) return;
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('project_requests')
        .insert({
          requested_by: user.id,
          project_name: requestName.trim(),
          notes: requestNotes.trim() || null,
        });
      if (error) throw error;
      toast.success(
        isRu 
          ? 'Заявка отправлена команде myUNO. Мы добавим проект в систему.' 
          : 'Request sent to myUNO team. We will add the project.'
      );
      setRequestName('');
      setRequestNotes('');
      setShowRequestForm(false);
    } catch (err) {
      logger.error('Failed to submit project request:', err);
      toast.error(isRu ? 'Ошибка отправки заявки' : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  }, [requestName, requestNotes, user?.id, isRu]);

  const handleInitiateRequest = useCallback(() => {
    setRequestName(searchQuery.trim());
    setShowRequestForm(true);
    setIsOpen(false);
  }, [searchQuery]);

  const handleProjectCardClick = useCallback(() => {
    if (selectedProject) {
      setShowProjectDetails(true);
    }
  }, [selectedProject]);

  return (
    <div className="space-y-3">
      <Label>{isRu ? 'Проект / ЖК' : 'Project / Complex'}</Label>
      
      {/* Selected project display - clickable */}
      {selectedProject ? (
        <Card 
          className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleProjectCardClick}
        >
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
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-medium text-sm truncate">
                        {isRu ? selectedProject.name_ru : selectedProject.name_en}
                      </h4>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                    {selectedProject.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {selectedProject.address}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleClearProject}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
                  {selectedProject.district && (
                    <Badge variant="outline" className="text-xs">
                      {selectedProject.district}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Search input with dropdown */
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={isRu ? 'Введите название проекта...' : 'Type project name...'}
              className="pl-10"
            />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  {isRu ? 'Загрузка...' : 'Loading...'}
                </div>
              ) : (
                <>
                  {/* No project option */}
                  <button
                    type="button"
                    onClick={() => {
                      onChange(undefined, undefined);
                      setSearchQuery('');
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-accent text-sm text-muted-foreground border-b"
                  >
                    {isRu ? '— Без проекта (отдельный объект)' : '— No project (standalone property)'}
                  </button>

                  {/* Filtered projects */}
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleSelectProject(project)}
                        className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-3"
                      >
                        {project.cover_image ? (
                          <img
                            src={project.cover_image}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {isRu ? project.name_ru : project.name_en}
                          </p>
                          {project.district && (
                            <p className="text-xs text-muted-foreground truncate">
                              {project.district}
                              {project.address && ` • ${project.address}`}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  ) : searchQuery.trim() && (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      {isRu ? 'Проекты не найдены' : 'No projects found'}
                    </div>
                  )}

                  {/* Submit request to myUNO */}
                  {searchQuery.trim() && !exactMatchExists && (
                    <button
                      type="button"
                      onClick={handleInitiateRequest}
                      className="w-full px-3 py-3 text-left hover:bg-accent flex items-center gap-2 border-t text-primary font-medium"
                    >
                      <Send className="h-4 w-4" />
                      <span>
                        {isRu 
                          ? `Отправить заявку: "${searchQuery.trim()}"` 
                          : `Submit request: "${searchQuery.trim()}"`
                        }
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      {!selectedProject && !isOpen && !showRequestForm && (
        <p className="text-xs text-muted-foreground">
          {isRu 
            ? 'Начните вводить название. Если проекта нет в списке — отправьте заявку команде myUNO.' 
            : 'Start typing. If not listed — submit a request to the myUNO team.'
          }
        </p>
      )}

      {/* Request form */}
      {showRequestForm && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <Label className="text-sm font-medium">
                    {isRu ? 'Название проекта / ЖК' : 'Project / Complex name'}
                  </Label>
                  <Input
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder={isRu ? 'Например: Laguna Beach Resort' : 'e.g., Laguna Beach Resort'}
                    autoFocus
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">
                    {isRu ? 'Комментарий (необязательно)' : 'Notes (optional)'}
                  </Label>
                  <Input
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder={isRu ? 'Район, адрес или ссылка на сайт проекта' : 'District, address or project website link'}
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRu 
                    ? 'Команда myUNO добавит проект со всеми деталями: адрес, фото, удобства. Вы получите уведомление.' 
                    : 'The myUNO team will add the project with all details: address, photos, amenities. You\'ll be notified.'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRequestForm(false);
                  setRequestName('');
                  setRequestNotes('');
                }}
              >
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitRequest}
                disabled={!requestName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isRu ? 'Отправка...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {isRu ? 'Отправить в myUNO' : 'Send to myUNO'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project details modal */}
      <Dialog open={showProjectDetails} onOpenChange={setShowProjectDetails}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedProject && (isRu ? selectedProject.name_ru : selectedProject.name_en)}
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <ProjectInfoCard 
              project={selectedProject as any} 
              className="border-0 shadow-none"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const ProjectSelector = memo(ProjectSelectorInner);
