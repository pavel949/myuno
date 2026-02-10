import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpCircle, ArrowDownCircle, Calendar, MoreVertical, Trash2, Edit, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { PropertyFinancialFull } from '@/hooks/usePropertyFinancials';

interface TransactionCardProps {
  item: PropertyFinancialFull;
  isRu: boolean;
  getCategoryLabel: (cat: string | undefined, type: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onViewReceipt?: () => void;
}

export function TransactionCard({ item, isRu, getCategoryLabel, onEdit, onDelete, onViewReceipt }: TransactionCardProps) {
  const isIncome = item.transaction_type === 'income';
  const hasReceipt = !!item.receipt_url;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${isIncome ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {isIncome ? (
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm flex items-center gap-1.5">
                  {getCategoryLabel(item.category, item.transaction_type)}
                  {hasReceipt && (
                    <button
                      onClick={onViewReceipt}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title={isRu ? 'Посмотреть чек' : 'View receipt'}
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                  )}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {isRu && item.description_ru ? item.description_ru : item.description}
                  </p>
                )}
              </div>
              <p className={`font-bold whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                {isIncome ? '+' : '-'}฿{item.amount.toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(item.transaction_date), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
              </Badge>
              
              {item.property && (
                <Badge variant="secondary" className="text-xs">
                  {isRu && item.property.title_ru ? item.property.title_ru : item.property.title}
                </Badge>
              )}
              
              {item.status === 'pending' && (
                <Badge variant="destructive" className="text-xs">
                  {isRu ? 'Ожидает' : 'Pending'}
                </Badge>
              )}
              
              {item.tax_deductible && (
                <Badge variant="outline" className="text-xs text-green-600">
                  {isRu ? 'Вычет' : 'Deductible'}
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasReceipt && (
                <DropdownMenuItem onClick={onViewReceipt}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  {isRu ? 'Посмотреть чек' : 'View Receipt'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {isRu ? 'Редактировать' : 'Edit'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {isRu ? 'Удалить' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
