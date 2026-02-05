import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  titleRu: string;
  shortcuts: {
    keys: string[];
    description: string;
    descriptionRu: string;
    action?: () => void;
  }[];
}

interface AdminKeyboardShortcutsProps {
  onNewItem?: () => void;
}

export function AdminKeyboardShortcuts({ onNewItem }: AdminKeyboardShortcutsProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation',
      titleRu: 'Навигация',
      shortcuts: [
        { keys: ['⌘', 'K'], description: 'Open Command Palette', descriptionRu: 'Открыть командную палитру' },
        { keys: ['Ctrl', 'B'], description: 'Toggle Sidebar', descriptionRu: 'Свернуть/развернуть сайдбар' },
        { keys: ['G', 'D'], description: 'Go to Dashboard', descriptionRu: 'Перейти на Dashboard' },
        { keys: ['G', 'C'], description: 'Go to Catalog', descriptionRu: 'Перейти в Каталог' },
        { keys: ['G', 'O'], description: 'Go to Operations', descriptionRu: 'Перейти в Операции' },
      ],
    },
    {
      title: 'Actions',
      titleRu: 'Действия',
      shortcuts: [
        { keys: ['Ctrl', 'N'], description: 'New Item', descriptionRu: 'Новый элемент' },
        { keys: ['Ctrl', 'S'], description: 'Save (in forms)', descriptionRu: 'Сохранить (в формах)' },
        { keys: ['Escape'], description: 'Close dialog/modal', descriptionRu: 'Закрыть диалог/модал' },
      ],
    },
    {
      title: 'Help',
      titleRu: 'Помощь',
      shortcuts: [
        { keys: ['?'], description: 'Show this help', descriptionRu: 'Показать эту справку' },
      ],
    },
  ];

  useEffect(() => {
    let gPressed = false;
    let gTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // ? for help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // Ctrl+N for new item
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onNewItem?.();
        return;
      }

      // G + key navigation
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        gPressed = true;
        gTimeout = setTimeout(() => {
          gPressed = false;
        }, 1000);
        return;
      }

      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimeout);
        
        switch (e.key) {
          case 'd':
            e.preventDefault();
            navigate('/admin');
            break;
          case 'c':
            e.preventDefault();
            navigate('/admin/catalog');
            break;
          case 'o':
            e.preventDefault();
            navigate('/admin/operations');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [navigate, onNewItem]);

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {isRussian ? 'Горячие клавиши' : 'Keyboard Shortcuts'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {isRussian ? group.titleRu : group.title}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">
                      {isRussian ? shortcut.descriptionRu : shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <Badge variant="outline" className="font-mono text-xs px-2">
                            {key}
                          </Badge>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {isRussian ? 'Нажмите ? в любое время для справки' : 'Press ? anytime for help'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
