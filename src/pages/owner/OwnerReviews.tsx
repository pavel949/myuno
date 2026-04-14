import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, MessageSquare, TrendingUp, Clock, Filter,
  ChevronDown, Reply, Trash2, Building2, User, Sparkles, Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageContainer } from '@/components/uno/PageContainer';

interface OwnerReview {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  images: string[];
  pros: string | null;
  cons: string | null;
  visit_date: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  response: string | null;
  response_at: string | null;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  property_title?: string;
  property_title_ru?: string;
  property_cover?: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingResponses: number;
  distribution: number[];
  recentCount: number;
}

function useOwnerReviews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['owner-reviews', user?.id];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return { reviews: [], stats: null };

      // First get owner's property IDs from unified table
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, cover_image')
        .eq('owner_id', user.id);

      if (propError) throw propError;
      if (!properties?.length) return { reviews: [], stats: null };

      const propertyIds = properties.map(p => p.id);
      const propertyMap = new Map(properties.map(p => [p.id, p]));

      // Get reviews for these properties
      const { data: reviews, error: revError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('item_type', 'property')
        .in('item_id', propertyIds)
        .order('created_at', { ascending: false });

      if (revError) throw revError;

      // Map reviews with property info
      const mappedReviews: OwnerReview[] = (reviews || []).map(r => {
        const property = propertyMap.get(r.item_id);
        return {
          ...r,
          images: r.images || [],
          property_title: property?.title_en,
          property_title_ru: property?.title_ru,
          property_cover: property?.cover_image,
          reviewer_name: (r.profiles as any)?.full_name,
          reviewer_avatar: (r.profiles as any)?.avatar_url,
        };
      });

      // Calculate stats
      const totalReviews = mappedReviews.length;
      const averageRating = totalReviews > 0
        ? mappedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
      const pendingResponses = mappedReviews.filter(r => !r.response).length;
      const distribution = [0, 0, 0, 0, 0];
      mappedReviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[r.rating - 1]++;
        }
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCount = mappedReviews.filter(
        r => new Date(r.created_at) > thirtyDaysAgo
      ).length;

      const stats: ReviewStats = {
        totalReviews,
        averageRating,
        pendingResponses,
        distribution,
        recentCount,
      };

      return { reviews: mappedReviews, stats };
    },
    enabled: !!user,
  });

  const respondToReview = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Verify ownership: check that this review belongs to owner's property
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      const propertyIds = properties?.map(p => p.id) || [];

      // Check if review is for owner's property
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('item_id')
        .eq('id', reviewId)
        .eq('item_type', 'property')
        .single();

      if (reviewError || !review) throw new Error('Review not found');
      if (!propertyIds.includes(review.item_id)) {
        throw new Error('Unauthorized: You can only respond to reviews on your properties');
      }

      const { data, error } = await supabase
        .from('reviews')
        .update({
          response,
          response_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Response saved');
    },
    onError: () => {
      toast.error('Failed to save response');
    },
  });

  const deleteResponse = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Verify ownership before deleting response
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      const propertyIds = properties?.map(p => p.id) || [];

      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('item_id')
        .eq('id', reviewId)
        .eq('item_type', 'property')
        .single();

      if (reviewError || !review) throw new Error('Review not found');
      if (!propertyIds.includes(review.item_id)) {
        throw new Error('Unauthorized');
      }

      const { error } = await supabase
        .from('reviews')
        .update({
          response: null,
          response_at: null,
        })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Response deleted');
    },
    onError: () => {
      toast.error('Failed to delete response');
    },
  });

  return {
    reviews: data?.reviews || [],
    stats: data?.stats || null,
    isLoading,
    error,
    respondToReview: respondToReview.mutateAsync,
    deleteResponse: deleteResponse.mutateAsync,
    isResponding: respondToReview.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const generateAIResponse = () => {
    if (!replyingTo) return;
    setIsGeneratingAI(true);
    // Template-based suggestion (no external API needed)
    const rating = replyingTo.rating;
    const guestName = replyingTo.reviewer_name?.split(' ')[0] || (isRu ? 'Гость' : 'Guest');
    let suggestion: string;
    if (rating >= 4) {
      suggestion = isRu
        ? `${guestName}, спасибо за ваш отзыв и высокую оценку! Мы очень рады, что вам понравилось. Будем рады видеть вас снова!`
        : `Thank you for your wonderful review, ${guestName}! We're thrilled you had a great experience. We'd love to welcome you back!`;
    } else if (rating >= 3) {
      suggestion = isRu
        ? `${guestName}, благодарим за отзыв. Мы ценим вашу обратную связь и уже работаем над улучшениями. Надеемся, в следующий раз ваш опыт будет ещё лучше!`
        : `Thank you for your feedback, ${guestName}. We appreciate your input and are already working on improvements. We hope your next stay will be even better!`;
    } else {
      suggestion = isRu
        ? `${guestName}, благодарим за отзыв. Нам очень жаль, что ваш опыт не оправдал ожиданий. Мы серьёзно относимся к каждому замечанию и примем меры для улучшения. Пожалуйста, свяжитесь с нами — мы хотели бы всё исправить.`
        : `Thank you for sharing your experience, ${guestName}. We're sorry it didn't meet your expectations. We take every concern seriously and are taking steps to improve. Please reach out to us directly — we'd like to make things right.`;
    }
    // Simulate brief delay for UX
    setTimeout(() => {
      setReplyText(suggestion);
      setIsGeneratingAI(false);
    }, 600);
  };

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

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateAIResponse}
                  disabled={isGeneratingAI}
                  className="gap-1.5"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isRu ? 'AI-подсказка' : 'AI Suggest'}
                </Button>
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
