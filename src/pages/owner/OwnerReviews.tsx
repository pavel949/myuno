import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, MessageSquare, TrendingUp, Clock, Filter, 
  ChevronDown, Reply, Trash2, Building2, User 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerReviews, OwnerReview } from '@/hooks/useOwnerReviews';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { cn } from '@/lib/utils';

type FilterOption = 'all' | 'pending' | 'responded' | '5' | '4' | '3' | '2' | '1';

export default function OwnerReviews() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { reviews, stats, isLoading, respondToReview, deleteResponse, isResponding } = useOwnerReviews();
  
  const [filter, setFilter] = useState<FilterOption>('all');
  const [replyingTo, setReplyingTo] = useState<OwnerReview | null>(null);
  const [replyText, setReplyText] = useState('');

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Star className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'Отзывы' : 'Reviews'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите для просмотра отзывов' : 'Sign in to view reviews'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const filterLabels: Record<FilterOption, { en: string; ru: string }> = {
    all: { en: 'All Reviews', ru: 'Все отзывы' },
    pending: { en: 'Pending Response', ru: 'Без ответа' },
    responded: { en: 'Responded', ru: 'С ответом' },
    '5': { en: '5 Stars', ru: '5 звезд' },
    '4': { en: '4 Stars', ru: '4 звезды' },
    '3': { en: '3 Stars', ru: '3 звезды' },
    '2': { en: '2 Stars', ru: '2 звезды' },
    '1': { en: '1 Star', ru: '1 звезда' },
  };

  const filteredReviews = reviews.filter(review => {
    switch (filter) {
      case 'pending':
        return !review.response;
      case 'responded':
        return !!review.response;
      case '5':
      case '4':
      case '3':
      case '2':
      case '1':
        return review.rating === parseInt(filter);
      default:
        return true;
    }
  });

  const handleReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    
    await respondToReview({
      reviewId: replyingTo.id,
      response: replyText.trim(),
    });
    
    setReplyingTo(null);
    setReplyText('');
  };

  const handleDeleteResponse = async (reviewId: string) => {
    if (!confirm(isRu ? 'Удалить ответ?' : 'Delete response?')) return;
    await deleteResponse(reviewId);
  };

  const openReplyDialog = (review: OwnerReview) => {
    setReplyingTo(review);
    setReplyText(review.response || '');
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4',
            i < rating ? 'fill-warning text-warning' : 'text-muted'
          )}
        />
      ))}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Отзывы гостей' : 'Guest Reviews'}
        subtitle={stats ? (isRu 
          ? `${stats.totalReviews} отзывов • ${stats.averageRating.toFixed(1)} средний рейтинг`
          : `${stats.totalReviews} reviews • ${stats.averageRating.toFixed(1)} average rating`
        ) : undefined}
        showBack
        fallbackPath="/owner"
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-5 w-5 fill-warning text-warning" />
                <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Средний рейтинг' : 'Avg Rating'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Всего отзывов' : 'Total Reviews'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1 text-warning">{stats.pendingResponses}</div>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Без ответа' : 'Pending'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-2xl font-bold">{stats.recentCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'За 30 дней' : 'Last 30 days'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && stats.totalReviews > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">{isRu ? 'Распределение оценок' : 'Rating Distribution'}</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star - 1];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-8 text-sm">{star}★</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-warning rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-sm text-muted-foreground text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="w-4 h-4" />
              {filterLabels[filter][isRu ? 'ru' : 'en']}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(Object.keys(filterLabels) as FilterOption[]).map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setFilter(option)}
                className={filter === option ? 'bg-accent' : ''}
              >
                {filterLabels[option][isRu ? 'ru' : 'en']}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {filter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
            {isRu ? 'Сбросить' : 'Clear'}
          </Button>
        )}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {isRu ? 'Нет отзывов' : 'No Reviews'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter !== 'all'
                ? (isRu ? 'Нет отзывов по выбранному фильтру' : 'No reviews match this filter')
                : (isRu ? 'Отзывы гостей появятся здесь' : 'Guest reviews will appear here')
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                {/* Property Info */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                  {review.property_cover ? (
                    <img 
                      src={review.property_cover} 
                      alt="" 
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {isRu && review.property_title_ru ? review.property_title_ru : review.property_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'dd MMM yyyy', {
                        locale: isRu ? ru : undefined
                      })}
                    </p>
                  </div>
                  {!review.response && (
                    <Badge variant="outline" className="text-warning border-warning">
                      {isRu ? 'Без ответа' : 'Pending'}
                    </Badge>
                  )}
                </div>

                {/* Reviewer Info */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    {review.reviewer_avatar && <AvatarImage src={review.reviewer_avatar} />}
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {review.reviewer_name || (isRu ? 'Гость' : 'Guest')}
                      </span>
                      {review.is_verified_purchase && (
                        <Badge variant="secondary" className="text-xs">
                          {isRu ? 'Проверено' : 'Verified'}
                        </Badge>
                      )}
                    </div>
                    
                    {renderStars(review.rating)}
                    
                    {review.title && (
                      <p className="font-medium mt-2">{review.title}</p>
                    )}
                    
                    {review.content && (
                      <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                    )}

                    {/* Pros/Cons */}
                    {(review.pros || review.cons) && (
                      <div className="mt-2 space-y-1">
                        {review.pros && (
                          <p className="text-sm">
                            <span className="text-success">+</span> {review.pros}
                          </p>
                        )}
                        {review.cons && (
                          <p className="text-sm">
                            <span className="text-destructive">−</span> {review.cons}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Owner Response */}
                    {review.response && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-primary">
                            {isRu ? 'Ваш ответ' : 'Your Response'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteResponse(review.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm">{review.response}</p>
                        {review.response_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(review.response_at), {
                              addSuffix: true,
                              locale: isRu ? ru : undefined,
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Reply Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-1"
                      onClick={() => openReplyDialog(review)}
                    >
                      <Reply className="h-4 w-4" />
                      {review.response 
                        ? (isRu ? 'Редактировать ответ' : 'Edit Response')
                        : (isRu ? 'Ответить' : 'Reply')
                      }
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={!!replyingTo} onOpenChange={(open) => !open && setReplyingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {replyingTo?.response 
                ? (isRu ? 'Редактировать ответ' : 'Edit Response')
                : (isRu ? 'Ответить на отзыв' : 'Reply to Review')
              }
            </DialogTitle>
          </DialogHeader>

          {replyingTo && (
            <div className="space-y-4">
              {/* Original Review Preview */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(replyingTo.rating)}
                  <span className="text-sm font-medium">
                    {replyingTo.reviewer_name || (isRu ? 'Гость' : 'Guest')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {replyingTo.content || replyingTo.title || (isRu ? 'Без текста' : 'No text')}
                </p>
              </div>

              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isRu ? 'Напишите ваш ответ...' : 'Write your response...'}
                rows={4}
              />

              <p className="text-xs text-muted-foreground">
                {isRu 
                  ? 'Ваш ответ будет виден всем посетителям.'
                  : 'Your response will be visible to all visitors.'
                }
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyingTo(null)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleReply} 
              disabled={!replyText.trim() || isResponding}
            >
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
