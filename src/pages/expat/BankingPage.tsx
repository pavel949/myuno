import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBanks, Bank } from '@/hooks/useBanks';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Landmark, Search, Star, Globe, Smartphone, CreditCard, 
  Building, ExternalLink, Phone, CheckCircle2, Filter
} from 'lucide-react';

const bankTypes = [
  { value: 'all', label: 'All Banks', labelRu: 'Все банки' },
  { value: 'commercial', label: 'Commercial', labelRu: 'Коммерческие' },
  { value: 'international', label: 'International', labelRu: 'Международные' },
  { value: 'government', label: 'Government', labelRu: 'Государственные' },
];

const BankingPage = () => {
  const { language } = useLanguage();
  const { banks, isLoading, getName, getDescription } = useBanks();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  const isRussian = language === 'ru';

  const filteredBanks = banks.filter(bank => {
    const matchesSearch = getName(bank).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || bank.bank_type === selectedType;
    return matchesSearch && matchesType;
  });

  const featuredBanks = filteredBanks.filter(b => b.is_featured);
  const otherBanks = filteredBanks.filter(b => !b.is_featured);

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Банки и финансы' : 'Banks & Finance'}
          showBack
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRussian ? 'Поиск банков...' : 'Search banks...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-4">
          <TabsList className="w-full grid grid-cols-4">
            {bankTypes.map(type => (
              <TabsTrigger key={type.value} value={type.value} className="text-xs">
                {isRussian ? type.labelRu : type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Info Card */}
        <Card className="mb-4 bg-gradient-to-r from-success/10 to-success/10 border-success/40/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Landmark className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-sm mb-1">
                  {isRussian ? 'Открытие счёта для иностранцев' : 'Opening Account for Foreigners'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRussian 
                    ? 'Большинство тайских банков принимают иностранцев. Обычно требуется паспорт, виза и подтверждение адреса.'
                    : 'Most Thai banks accept foreigners. Typically requires passport, visa, and proof of address.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : filteredBanks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {isRussian ? 'Банки не найдены' : 'No banks found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Featured Banks */}
            {featuredBanks.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {isRussian ? 'Рекомендуемые' : 'Featured'}
                </h3>
                {featuredBanks.map(bank => (
                  <BankCard 
                    key={bank.id} 
                    bank={bank} 
                    isRussian={isRussian} 
                    getName={getName}
                    getDescription={getDescription}
                    onClick={() => setSelectedBank(bank)}
                  />
                ))}
              </>
            )}

            {/* Other Banks */}
            {otherBanks.length > 0 && (
              <>
                {featuredBanks.length > 0 && (
                  <h3 className="text-sm font-medium text-muted-foreground mt-4">
                    {isRussian ? 'Все банки' : 'All Banks'}
                  </h3>
                )}
                {otherBanks.map(bank => (
                  <BankCard 
                    key={bank.id} 
                    bank={bank} 
                    isRussian={isRussian}
                    getName={getName}
                    getDescription={getDescription}
                    onClick={() => setSelectedBank(bank)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Bank Details Dialog */}
        <Dialog open={!!selectedBank} onOpenChange={() => setSelectedBank(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedBank && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-success" />
                    {getName(selectedBank)}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {getDescription(selectedBank) && (
                    <p className="text-sm text-muted-foreground">
                      {getDescription(selectedBank)}
                    </p>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {selectedBank.accepts_foreigners && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {isRussian ? 'Для иностранцев' : 'Accepts Foreigners'}
                      </Badge>
                    )}
                    {selectedBank.online_banking && (
                      <Badge variant="secondary" className="gap-1">
                        <Globe className="h-3 w-3" />
                        {isRussian ? 'Онлайн-банкинг' : 'Online Banking'}
                      </Badge>
                    )}
                    {selectedBank.mobile_app && (
                      <Badge variant="secondary" className="gap-1">
                        <Smartphone className="h-3 w-3" />
                        {isRussian ? 'Мобильное приложение' : 'Mobile App'}
                      </Badge>
                    )}
                  </div>

                  {/* Services */}
                  {selectedBank.services.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {isRussian ? 'Услуги' : 'Services'}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedBank.services.map(service => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {selectedBank.languages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {isRussian ? 'Языки обслуживания' : 'Service Languages'}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedBank.languages.map(lang => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedBank.phone && (
                      <Button variant="outline" className="gap-2" asChild>
                        <a href={`tel:${selectedBank.phone}`}>
                          <Phone className="h-4 w-4" />
                          {selectedBank.phone}
                        </a>
                      </Button>
                    )}
                    {selectedBank.website && (
                      <Button variant="outline" className="gap-2" asChild>
                        <a href={selectedBank.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          {isRussian ? 'Сайт' : 'Website'}
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* SWIFT */}
                  {selectedBank.swift_code && (
                    <div className="p-3 bg-muted rounded-none">
                      <p className="text-xs text-muted-foreground">SWIFT Code</p>
                      <p className="font-mono font-medium">{selectedBank.swift_code}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
};

interface BankCardProps {
  bank: Bank;
  isRussian: boolean;
  getName: (bank: Bank) => string;
  getDescription: (bank: Bank) => string | null;
  onClick: () => void;
}

const BankCard = ({ bank, isRussian, getName, getDescription, onClick }: BankCardProps) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardContent className="p-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-none bg-gradient-to-br from-success to-success flex items-center justify-center flex-shrink-0">
          <Landmark className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium line-clamp-1">{getName(bank)}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {getDescription(bank) || bank.swift_code}
              </p>
            </div>
            {bank.is_featured && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {isRussian ? 'Топ' : 'Top'}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-2 text-xs">
            {bank.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" />
                {bank.rating.toFixed(1)}
              </span>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              {bank.online_banking && <Globe className="h-3 w-3" />}
              {bank.mobile_app && <Smartphone className="h-3 w-3" />}
              {bank.accepts_foreigners && <CheckCircle2 className="h-3 w-3 text-success" />}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default BankingPage;
