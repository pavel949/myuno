/**
 * SuperAppCatalogAccordion
 * Taxonomy-driven catalog accordion for the Super-App drawer
 * Uses useSuperAppCatalog to display all verticals from the canonical taxonomy system
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSuperAppCatalog, CatalogSection, CatalogItem } from '@/hooks/useSuperAppCatalog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Vertical gradient colors for visual distinction
const VERTICAL_GRADIENTS: Record<string, string> = {
  yachts: 'from-blue-500/20 to-cyan-500/10',
  tours: 'from-amber-500/20 to-orange-500/10',
  restaurants: 'from-rose-500/20 to-pink-500/10',
  property: 'from-emerald-500/20 to-green-500/10',
  transport: 'from-indigo-500/20 to-violet-500/10',
  home_services: 'from-amber-500/20 to-yellow-500/10',
  salons: 'from-pink-500/20 to-purple-500/10',
  medical: 'from-teal-500/20 to-emerald-500/10',
  pets: 'from-orange-500/20 to-amber-500/10',
  events: 'from-purple-500/20 to-indigo-500/10',
};

interface SuperAppCatalogAccordionProps {
  searchQuery: string;
  onNavigate: () => void;
}

export function SuperAppCatalogAccordion({ searchQuery, onNavigate }: SuperAppCatalogAccordionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { catalog, filterCatalog, isLoading } = useSuperAppCatalog();

  const filteredCatalog = searchQuery ? filterCatalog(searchQuery) : catalog;

  const handleItemClick = (path: string) => {
    onNavigate();
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredCatalog.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-muted-foreground text-sm">
        {language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {filteredCatalog.map((section) => (
        <CatalogSectionItem
          key={section.id}
          section={section}
          onItemClick={handleItemClick}
        />
      ))}
    </Accordion>
  );
}

// Section component (vertical level)
function CatalogSectionItem({ 
  section, 
  onItemClick,
}: { 
  section: CatalogSection;
  onItemClick: (path: string) => void;
}) {
  const gradient = VERTICAL_GRADIENTS[section.vertical] || 'from-primary/20 to-primary/10';
  const hasChildren = section.children.length > 0;
  const childCount = section.hasHierarchy 
    ? section.children.reduce((acc, c) => acc + (c.children?.length || 1), 0)
    : section.children.length;

  // If no children, render as simple button
  if (!hasChildren) {
    return (
      <button
        onClick={() => onItemClick(section.path)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3",
          "hover:bg-muted/50 active:bg-muted transition-colors",
          "text-left border-0"
        )}
      >
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg",
          `bg-gradient-to-br ${gradient}`
        )}>
          {section.icon}
        </div>
        <span className="flex-1 font-medium text-sm">
          {section.nameRu}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    );
  }

  return (
    <AccordionItem value={section.id} className="border-0">
      <AccordionTrigger 
        className={cn(
          "px-4 py-3 hover:bg-muted/50 hover:no-underline",
          "[&>svg]:text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg",
            `bg-gradient-to-br ${gradient}`
          )}>
            {section.icon}
          </div>
          <span className="font-medium text-sm">
            {section.nameRu}
          </span>
          <Badge variant="secondary" className="text-xs">
            {childCount}
          </Badge>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="pb-0">
        <div className="pl-4 border-l-2 border-primary/20 ml-8 space-y-0.5 py-1">
          {section.hasHierarchy ? (
            // Render hierarchical structure (domain → categories)
            <CatalogHierarchyItems 
              items={section.children} 
              onItemClick={onItemClick}
            />
          ) : (
            // Render flat list
            section.children.map((item) => (
              <CatalogItemButton
                key={item.id}
                item={item}
                onClick={() => onItemClick(item.path)}
              />
            ))
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// Hierarchical items (e.g., home_services domains with nested categories)
function CatalogHierarchyItems({ 
  items, 
  onItemClick,
}: { 
  items: CatalogItem[];
  onItemClick: (path: string) => void;
}) {
  return (
    <Accordion type="multiple" className="w-full">
      {items.map((parent) => {
        const hasChildren = (parent.children?.length || 0) > 0;

        if (!hasChildren) {
          return (
            <CatalogItemButton
              key={parent.id}
              item={parent}
              onClick={() => onItemClick(parent.path)}
            />
          );
        }

        return (
          <AccordionItem key={parent.id} value={parent.id} className="border-0">
            <AccordionTrigger 
              className={cn(
                "px-3 py-2.5 hover:bg-muted/50 hover:no-underline rounded-lg",
                "[&>svg]:text-muted-foreground [&>svg]:w-3.5 [&>svg]:h-3.5"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <span className="text-sm">{parent.icon}</span>
                </div>
                <span className="flex-1 text-sm text-muted-foreground">
                  {parent.label}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {parent.children?.length || 0}
                </Badge>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="pb-0">
              <div className="pl-4 border-l border-muted ml-6 space-y-0.5 py-1">
                {parent.children?.map((child) => (
                  <CatalogItemButton
                    key={child.id}
                    item={child}
                    onClick={() => onItemClick(child.path)}
                    isNested
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// Single item button
function CatalogItemButton({ 
  item, 
  onClick,
  isNested = false,
}: { 
  item: CatalogItem;
  onClick: () => void;
  isNested?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5",
        "hover:bg-muted/50 active:bg-muted rounded-lg transition-colors",
        "text-left text-sm"
      )}
    >
      {!isNested && item.icon && (
        <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
          <span className="text-sm">{item.icon}</span>
        </div>
      )}
      <span className={cn(
        "flex-1",
        isNested ? "text-muted-foreground text-xs" : "text-muted-foreground"
      )}>
        {item.label}
      </span>
      {item.isNew && (
        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-500/90">
          NEW
        </Badge>
      )}
      {item.isHot && (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
          HOT
        </Badge>
      )}
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
