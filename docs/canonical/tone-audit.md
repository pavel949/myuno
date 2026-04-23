# myUNO · Tone of Voice Audit

Дата: 2026-04-23
Источник истины: `docs/canonical/03-tone-of-voice.md`
Сканирование: 2400 файлов, 64884 user-facing строк

> Автоматический аудит. Извлекает строковые литералы и JSX-текст из `src/**` и `supabase/functions/**`. Классификация — по правилам §5.4, §5.6, §7.4, §12, §15.

---

## 1. Summary

- ✅ OK:        64550 строк (99.5%)
- ⚠️ Edge:      22 строк (0.0%)
- ❌ Violation: 312 строк (0.5%)

**Топ нарушений по частоте:**

1. Капс-лок — 122 случаев
2. Восклицательные знаки — 67 случаев
3. Urgency-лексика — 49 случаев
4. Запрещённые слова (EN) — 34 случаев
5. Запрещённые слова (RU) — 19 случаев
6. Извинения-пустышки — 12 случаев
7. Панибратство — 9 случаев

---

## 2. Критические нарушения (❌)

### Капс-лок

Всего: **122**. Показано: 40.

| Файл | Строка | Текст | Деталь | Раздел |
|---|---|---|---|---|
| `src/components/admin/ai-insights/AIROIReport.tsx` | 26 | KEEP MONITORING | KEEP, MONITORING | §5.6 |
| `src/components/admin/ai-insights/AIROIReport.tsx` | 34 | NEEDS ADJUSTMENT | NEEDS, ADJUSTMENT | §5.6 |
| `src/components/admin/ai-insights/AIROIReport.tsx` | 42 | READY TO SCALE | READY, SCALE | §5.6 |
| `src/components/vendor/PayoutMethodsSection.tsx` | 239 | SOMCHAI JAIDEE | SOMCHAI, JAIDEE | §5.6 |
| `src/hooks/useVendorLocations.ts` | 309 | [INFO REQUEST] ${reason} | INFO, REQUEST | §5.6 |
| `src/lib/constants.ts` | 18 | CURRENCY.SYMBOLS is deprecated. Use getCurrencySymbol() from src/lib/config/currencies.ts | CURRENCY, SYMBOLS | §5.6 |
| `src/pages/Auth.tsx` | 544 | SIGN IN OR SIGN UP | SIGN, SIGN | §5.6 |
| `src/pages/admin/AdminNewbuilds.tsx` | 382 | Рек. (BUY/WATCH/AVOID) | WATCH, AVOID | §5.6 |
| `src/pages/info/DisputeResolutionPage.tsx` | 74 | Для споров свыше $1,000 или при несогласии с решением Омбудсмена — обязательный арбитраж THAC/HKIAC. Решение арбитра око | THAC, HKIAC | §5.6 |
| `src/pages/info/DisputeResolutionPage.tsx` | 75 | For disputes over $1,000 or if you disagree with Ombudsman — mandatory THAC/HKIAC arbitration. Arbitrator's decision is  | THAC, HKIAC | §5.6 |
| `src/pages/info/DisputeResolutionPage.tsx` | 376 | Применимое право: Сингапур \| Арбитраж: SIAC (Singapore International Arbitration Centre) или THAC | SIAC, THAC | §5.6 |
| `src/pages/info/DisputeResolutionPage.tsx` | 377 | Governing Law: Singapore \| Arbitration: SIAC (Singapore International Arbitration Centre) or THAC | SIAC, THAC | §5.6 |
| `src/pages/info/IPPolicyPage.tsx` | 314 | Вся информация на Платформе www.myuno.app защищена законодательством Республики Сингапур, международными соглашениями (Б | TRIPS, WIPO | §5.6 |
| `src/pages/info/IPPolicyPage.tsx` | 315 | All information on www.myuno.app is protected by Republic of Singapore law, international agreements (Berne Convention,  | TRIPS, WIPO | §5.6 |
| `src/pages/info/IPPolicyPage.tsx` | 425 | STRICTLY PROHIBITED | STRICTLY, PROHIBITED | §5.6 |
| `src/pages/info/IPPolicyPage.tsx` | 600 | Эта политика регулируется законодательством Республики Сингапур. Споры подлежат разрешению в судах Сингапура или через а | SIAC, THAC | §5.6 |
| `src/pages/info/IPPolicyPage.tsx` | 601 | This policy is governed by the laws of the Republic of Singapore. Disputes are subject to resolution in Singapore courts | SIAC, THAC | §5.6 |
| `src/pages/info/TermsPage.tsx` | 60 | PARTIAL ESCROW | PARTIAL, ESCROW | §5.6 |
| `src/pages/info/TermsPage.tsx` | 69 | LEAD GENERATION | LEAD, GENERATION | §5.6 |
| `src/pages/info/TermsPage.tsx` | 80 | 6. PLATFORM TRANSACTION REQUIREMENT | PLATFORM, TRANSACTION, REQUIREMENT | §5.6 |
| `src/pages/info/TermsPage.tsx` | 358 | STRICTLY PROHIBITED: | STRICTLY, PROHIBITED | §5.6 |
| `src/pages/info/TermsPage.tsx` | 372 | CONSEQUENCES OF VIOLATION: | CONSEQUENCES, VIOLATION | §5.6 |
| `src/pages/info/TermsPage.tsx` | 501 | Все споры, не разрешённые через медиацию, подлежат обязательному арбитражу в Thailand Arbitration Center (THAC) или Hong | THAC, HKIAC | §5.6 |
| `src/pages/info/TermsPage.tsx` | 502 | All disputes not resolved through mediation are subject to mandatory arbitration at Thailand Arbitration Center (THAC) o | THAC, HKIAC | §5.6 |
| `src/pages/info/TermsPage.tsx` | 507 | CLASS ACTION WAIVER: | CLASS, ACTION, WAIVER | §5.6 |
| `src/pages/legal/VisaQuizPage.tsx` | 256 | VISAS & DOCUMENTS | VISAS, DOCUMENTS | §5.6 |
| `src/pages/owner/OwnerPerformance.tsx` | 299 | OVERALL RATING | OVERALL, RATING | §5.6 |
| `src/pages/property/OffplanIndex.tsx` | 140 | Каталог новостроек Пхукета: BUY/WATCH/AVOID рейтинг ClearView V3, due diligence, ROI, фильтры по району и застройщику. Н | WATCH, AVOID | §5.6 |
| `src/pages/property/OffplanIndex.tsx` | 141 | Phuket off-plan property catalog with ClearView V3 BUY/WATCH/AVOID ratings, due diligence, ROI, filters by district and  | WATCH, AVOID | §5.6 |
| `src/pages/relocate/RelocateLandingPage.tsx` | 148 | RELOCATION · 9 STEPS | RELOCATION, STEPS | §5.6 |
| `supabase/functions/_shared/cors.ts` | 21 | POST, GET, OPTIONS | POST, OPTIONS | §5.6 |
| `supabase/functions/_shared/rate-limit.ts` | 83 | [RATE-LIMIT] Error checking rate limit: | RATE, LIMIT | §5.6 |
| `supabase/functions/_shared/rate-limit.ts` | 102 | [RATE-LIMIT] Exception: | RATE, LIMIT | §5.6 |
| `supabase/functions/_shared/rate-limit.ts` | 156 | [RATE-LIMIT] Blocked: ${identifier} on ${endpoint} | RATE, LIMIT | §5.6 |
| `supabase/functions/ai-agent/index.ts` | 114 | CURRENT CONTEXT: ${JSON.stringify(context, null, 2)} | CURRENT, CONTEXT | §5.6 |
| `supabase/functions/ai-concierge/index.ts` | 95 | DOCUMENTS EXPIRING SOON: ${docSummary} | DOCUMENTS, EXPIRING, SOON | §5.6 |
| `supabase/functions/ai-concierge/index.ts` | 129 | USER PERSONA: ${persona} | USER, PERSONA | §5.6 |
| `supabase/functions/ai-concierge/index.ts` | 130 | LIFE SITUATION: ${life_situation} | LIFE, SITUATION | §5.6 |
| `supabase/functions/ai-concierge/index.ts` | 153 | USER CONTEXT: ${contextParts.join(" ")}  Generate 2-3 proactive suggestions. | USER, CONTEXT | §5.6 |
| `supabase/functions/ai-guest-autoreply/index.ts` | 136 | CHAT HISTORY: | CHAT, HISTORY | §5.6 |

### Восклицательные знаки

Всего: **67**. Показано: 40.

| Файл | Строка | Текст | Деталь | Раздел |
|---|---|---|---|---|
| `src/components/admin/ai-agents/UtilityAgentCard.tsx` | 96 | transition-all ${!agent.is_active ? 'opacity-60' : ''} ${isUpdating ? 'pointer-events-none' : ''} | «!» в инфо-контексте | §5.6 |
| `src/components/admin/marketing/MCCLeadsTab.tsx` | 354 | Здравствуйте, ${lead.name}! Это UNO Properties. Мы получили вашу заявку и хотели бы обсудить детали. Когда вам удобно по | «!» в инфо-контексте | §5.6 |
| `src/components/admin/operations/OperationsManualPaymentsTab.tsx` | 140 | myUNO · Заявка #${ref}. Здравствуйте, ${row.guest_name}! Высылаю реквизиты для оплаты в рублях. | «!» в инфо-контексте | §5.6 |
| `src/components/category/CategorySuggestionDialog.tsx` | 130 | Не нашли подходящую категорию? Предложите свою, и мы добавим её! | «!» в инфо-контексте | §5.6 |
| `src/components/developer-portal/MicrositeTab.tsx` | 52 | ${typeof window !== 'undefined' ? window.location.origin : ''}${APP_ROUTES.PROJECT_MICROSITE(slug)} | «!» в инфо-контексте | §5.6 |
| `src/components/home/QuickActionsGrid.tsx` | 157 | !w-7 !h-7 drop-shadow-sm | 2 «!» | §5.6 |
| `src/components/owner/OwnerAIAssistant.tsx` | 128 | Здравствуйте! 👋 Я ваш персональный ассистент UNO. Могу помочь с управлением объектами, ответить на вопросы о системе, р | «!» в инфо-контексте | §5.6 |
| `src/components/owner/OwnerAIAssistant.tsx` | 129 | Hello! 👋 I'm your personal UNO assistant. I can help with property management, answer questions about the system, Phuke | «!» в инфо-контексте | §5.6 |
| `src/components/profile/UserRolesPermissions.tsx` | 37 | company_id, role, management_companies!inner(name_en, name_ru) | «!» в инфо-контексте | §5.6 |
| `src/components/property/SimilarProperties.tsx` | 94 | ${formatPrice(total!)} ${isRu ? 'за ' + nights + (nights === 1 ? ' ночь' : nights < 5 ? ' ночи' : ' ночей') : 'for ' + n | «!» в инфо-контексте | §5.6 |
| `src/components/uno/ReferralCard.tsx` | 210 | После первого бронирования от ${settings?.min_booking_amount \|\| 500} ₽ — оба получаете бонусы! | «!» в инфо-контексте | §5.6 |
| `src/components/uno/ReferralCard.tsx` | 211 | After first booking from ${settings?.min_booking_amount \|\| 500} ₽ — you both get bonuses! | «!» в инфо-контексте | §5.6 |
| `src/hooks/useActiveCompany.ts` | 67 | company_id, role, management_companies!inner(name_en, name_ru, logo) | «!» в инфо-контексте | §5.6 |
| `src/hooks/useAdminNotifications.ts` | 30 | Ваша запись в салон красоты "Glamour" завтра в 14:00. Не забудьте! | «!» в инфо-контексте | §5.6 |
| `src/hooks/useConsultationRequests.ts` | 238 | Заявка на управление отправлена! Наш менеджер свяжется с вами. | «!» в инфо-контексте | §5.6 |
| `src/hooks/useConsultationRequests.ts` | 287 | Заявка отправлена! Команда myUNO свяжется с вами для обсуждения партнёрства. | «!» в инфо-контексте | §5.6 |
| `src/hooks/useConsultationRequests.ts` | 304 | Заявка на управление каналами отправлена! Мы свяжемся с вами. | «!» в инфо-контексте | §5.6 |
| `src/hooks/useInvestmentInterest.ts` | 141 | Investment interest submitted! Our team will contact you soon. | «!» в инфо-контексте | §5.6 |
| `src/pages/SOS.tsx` | 148 | Rip current → Do NOT fight it! Swim PARALLEL to shore until free, then to beach | «!» в инфо-контексте | §5.6 |
| `src/pages/SOS.tsx` | 148 | Отбойное течение → НЕ боритесь! Плывите ПАРАЛЛЕЛЬНО берегу, затем к пляжу | «!» в инфо-контексте | §5.6 |
| `src/pages/SOS.tsx` | 162 | No helmet = hospital may refuse treatment + insurance void. Always wear! | «!» в инфо-контексте | §5.6 |
| `src/pages/SOS.tsx` | 162 | Без шлема = больница может отказать + страховка недействительна. Всегда носите! | «!» в инфо-контексте | §5.6 |
| `src/pages/SOS.tsx` | 186 | Dog/cat bite → Wash 15min with soap → Rabies shots WITHIN 24H. Not optional! | «!» в инфо-контексте | §5.6 |
| `src/pages/SOS.tsx` | 186 | Укус собаки/кошки → Мыть 15мин с мылом → Прививки от бешенства ЧЕРЕЗ 24Ч. Обязательно! | «!» в инфо-контексте | §5.6 |
| `src/pages/SOS.tsx` | 189 | Centipede (very painful!) → Ice + painkiller + antihistamine → hospital if severe | «!» в инфо-контексте | §5.6 |
| `src/pages/SOS.tsx` | 189 | Сороконожка (очень больно!) → Лёд + обезболивающее + антигистамин → больница при сильной | «!» в инфо-контексте | §5.6 |
| `src/pages/admin/AdminAIAgents.tsx` | 128 | transition-all hover:shadow-md ${!agent.is_active ? 'opacity-60' : ''} | «!» в инфо-контексте | §5.6 |
| `src/pages/admin/AdminPMCompanies.tsx` | 248 | cursor-pointer hover:border-primary/30 transition-colors ${!company.is_active ? 'opacity-60' : ''} | «!» в инфо-контексте | §5.6 |
| `src/pages/booking/AdvanceRequested.tsx` | 67 | Здравствуйте! У меня вопрос по запросу на предоплату. Номер заказа: ${state.orderNumber} | «!» в инфо-контексте | §5.6 |
| `src/pages/booking/AdvanceRequested.tsx` | 68 | Hello! I have a question about my advance payment request. Order number: ${state.orderNumber} | «!» в инфо-контексте | §5.6 |
| `src/pages/experiences/ExperienceBooking.tsx` | 168 | Недостаточно мест на выбранную дату.${availability.spots_remaining !== undefined ? | «!» в инфо-контексте | §5.6 |
| `src/pages/experiences/ExperienceBooking.tsx` | 169 | Not enough spots for the selected date.${availability.spots_remaining !== undefined ? | «!» в инфо-контексте | §5.6 |
| `src/pages/info/FAQPage.tsx` | 153 | Да! Мы предлагаем полный цикл: размещение объекта, синхронизация с Airbnb/Booking, управление бронированиями, проверенны | «!» в инфо-контексте | §5.6 |
| `src/pages/info/FAQPage.tsx` | 155 | ได้! เรานำเสนอวงจรเต็ม: ลงรายการทรัพย์สิน, ซิงค์กับ Airbnb/Booking, จัดการการจอง, แขกที่ได้รับการตรวจสอบผ่าน G-Trust, ต้ | «!» в инфо-контексте | §5.6 |
| `src/pages/info/FAQPage.tsx` | 156 | Yes! We offer a full cycle: listing your property, sync with Airbnb/Booking, booking management, verified guests via G-T | «!» в инфо-контексте | §5.6 |
| `src/pages/mc/MCHelpPage.tsx` | 52 | Yes! Go to Staff & Access → Invite. Enter their email and select a role (Admin, Manager, Staff, Cleaner, Maintenance). T | «!» в инфо-контексте | §5.6 |
| `src/pages/mc/MCHelpPage.tsx` | 52 | Да! Перейдите в Сотрудники → Пригласить. Введите email и выберите роль (Администратор, Менеджер, Сотрудник, Уборщик, Тех | «!» в инфо-контексте | §5.6 |
| `src/pages/owner/CrmDuplicatesPage.tsx` | 68 | Объединено! Оставлен: ${keepContact.first_name} ${keepContact.last_name} | «!» в инфо-контексте | §5.6 |
| `src/pages/owner/CrmDuplicatesPage.tsx` | 68 | Merged! Kept: ${keepContact.first_name} ${keepContact.last_name} | «!» в инфо-контексте | §5.6 |
| `src/pages/owner/MCSubscriptionPage.tsx` | 423 | Здравствуйте! Хочу оформить подписку PMS для управляющей компании "${companyName}". Подскажите варианты оплаты. | «!» в инфо-контексте | §5.6 |

### Urgency-лексика

Всего: **49**. Показано: 40.

| Файл | Строка | Текст | Деталь | Раздел |
|---|---|---|---|---|
| `src/components/home/ProactiveConcierge.tsx` | 48 | Срочно | срочно | §5.4 / §12.4 |
| `src/components/legal/VisaTracker.tsx` | 130 | Срочно! | срочно | §5.4 / §12.4 |
| `src/components/market/FlashDealsSection.tsx` | 132 | Успей купить | успей | §5.4 / §12.4 |
| `src/components/newbuilds/tabs/NbInventoryTab.tsx` | 32 | Осталось мало | осталось мало | §5.4 / §12.4 |
| `src/components/owner/OperationalTaskCard.tsx` | 55 | Срочно | срочно | §5.4 / §12.4 |
| `src/components/owner/TaskDetailSheet.tsx` | 23 | Срочно | срочно | §5.4 / §12.4 |
| `src/components/owner/channel-manager/channelRegistry.ts` | 438 | Примечание: ЦИАН имеет ограниченную поддержку iCal для краткосрочной аренды | срочно | §5.4 / §12.4 |
| `src/components/owner/dashboard/RisksBlock.tsx` | 104 | срочно | срочно | §5.4 / §12.4 |
| `src/components/owner/documents/AILegalAssistant.tsx` | 41 | Составь договор краткосрочной аренды на английском и русском языках для объекта на Пхукете. Включи все необходимые пункт | срочно | §5.4 / §12.4 |
| `src/components/owner/management/ManagementTermsForm.tsx` | 661 | Действует до (или бессрочно) | срочно | §5.4 / §12.4 |
| `src/components/owner/property-manage/StaysSubscriptionCard.tsx` | 90 | Каналы OTA, календарь и инструменты для краткосрочной аренды. | срочно | §5.4 / §12.4 |
| `src/components/owner/property-wizard/steps/PricingStep.tsx` | 105 | Долгосрочно | срочно | §5.4 / §12.4 |
| `src/components/owner/sales/dealTypePresentation.ts` | 34 | Для краткосрочной аренды важны даты, район и спальни. | срочно | §5.4 / §12.4 |
| `src/components/owner/sales/dealTypePresentation.ts` | 43 | Для долгосрочной аренды важнее всего спальни, район и срок. | срочно | §5.4 / §12.4 |
| `src/components/owner/transparency/OwnerTermsTab.tsx` | 113 | Бессрочно | срочно | §5.4 / §12.4 |
| `src/components/property/UnitFields.tsx` | 343 | Подходит для долгосрочного проживания | срочно | §5.4 / §12.4 |
| `src/components/services/ServiceFunctionCard.tsx` | 67 | Срочно | срочно | §5.4 / §12.4 |
| `src/components/shared/YourDayFeed.tsx` | 219 | ✨ Отличный день — ничего срочного! | срочно | §5.4 / §12.4 |
| `src/components/staff/StaffTaskCalendar.tsx` | 41 | Срочно | срочно | §5.4 / §12.4 |
| `src/components/staff/StaffTaskCalendar.tsx` | 185 | Срочное | срочно | §5.4 / §12.4 |
| `src/components/tickets/CreateTicketForm.tsx` | 41 | Срочно | срочно | §5.4 / §12.4 |
| `src/components/tickets/TicketPriorityBadge.tsx` | 12 | Срочно | срочно | §5.4 / §12.4 |
| `src/content/semantic/canonicalNames.ts` | 129 | Не OTA-агрегатор краткосрочной аренды. | срочно | §5.4 / §12.4 |
| `src/content/semantic/searchClusters.ts` | 94 | снять виллу Пхукет долгосрочно | срочно | §5.4 / §12.4 |
| `src/content/semantic/taxonomy.ts` | 83 | Срочно помогите | срочно | §5.4 / §12.4 |
| `src/hooks/usePropertyNotes.ts` | 23 | Срочно | срочно | §5.4 / §12.4 |
| `src/hooks/useStartOnboarding.ts` | 120 | Краткосрочное жильё | срочно | §5.4 / §12.4 |
| `src/lib/config/dueDiligenceChecklist.ts` | 238 | Рассмотрите Thailand Elite визу, пенсионную визу или другие варианты долгосрочного проживания. | срочно | §5.4 / §12.4 |
| `src/lib/filterRegistry.ts` | 1120 | Срочно | срочно | §5.4 / §12.4 |
| `src/lib/filterRegistry.ts` | 1194 | Срочно | срочно | §5.4 / §12.4 |
| `src/lib/home/roleValueMap.ts` | 16 | Аренда транспорта и краткосрочное жильё | срочно | §5.4 / §12.4 |
| `src/lib/leadVerticalConfig.ts` | 670 | Срочно | срочно | §5.4 / §12.4 |
| `src/lib/monetization/realEstateEngine.ts` | 259 | Сопровождение покупки, продажи или долгосрочной аренды до подписания. | срочно | §5.4 / §12.4 |
| `src/lib/vertical/contextConfig.ts` | 44 | Средняя 2BR долгосрочно: ฿35 000–55 000/мес. Высокий спрос: Раваи и Чернгталай. | срочно | §5.4 / §12.4 |
| `src/pages/SOS.tsx` | 176 | Просрочка визы → В иммиграцию СРОЧНО. Штраф: 500 бат/день, макс 20,000. 90+ дней = бан | срочно | §5.4 / §12.4 |
| `src/pages/StartOnboarding.tsx` | 41 | Долгосрочно жить на Пхукете | срочно | §5.4 / §12.4 |
| `src/pages/admin/AdminContracts.tsx` | 328 | Бессрочно | срочно | §5.4 / §12.4 |
| `src/pages/admin/AdminTicketDetail.tsx` | 263 | Срочно | срочно | §5.4 / §12.4 |
| `src/pages/landing/FlowerDeliveryLanding.tsx` | 203 | Нет ответа, когда срочно | срочно | §5.4 / §12.4 |
| `src/pages/me/MeFeed.tsx` | 121 | Срочно | срочно | §5.4 / §12.4 |

### Запрещённые слова (EN)

Всего: **34**. Показано: 34.

| Файл | Строка | Текст | Деталь | Раздел |
|---|---|---|---|---|
| `src/components/admin/marketing/MCCLandingControlTab.tsx` | 190 | Next Best Actions: | best | §5.4 |
| `src/components/home/PersonaSmartFeed.tsx` | 99 | Best vibes today | best | §5.4 |
| `src/components/home/PersonaSmartFeed.tsx` | 148 | Best salons | best | §5.4 |
| `src/components/owner/contacts/CrmAiAssistantPanel.tsx` | 18 | Next Best Action | best | §5.4 |
| `src/components/property/PropertyBookingCard.tsx` | 190 | Best price guarantee | best | §5.4 |
| `src/components/transport/VehicleCard.tsx` | 62 | Best Value | best | §5.4 |
| `src/components/vertical/VerticalInsightPanel.tsx` | 53 | Best Hospitals in Phuket | best | §5.4 |
| `src/content/semantic/searchClusters.ts` | 128 | best exchange rate Phuket | best | §5.4 |
| `src/content/semantic/searchClusters.ts` | 150 | best area to live Phuket | best | §5.4 |
| `src/hooks/usePropertyMarketing.ts` | 237 | Write a detailed description highlighting unique features. | unique | §5.4 |
| `src/lib/config/phuketAreas.ts` | 33 | Premium beachfront area home to Laguna Phuket complex. One of the longest beaches on the island with upscale resorts, in | world-class | §5.4 |
| `src/lib/config/phuketAreas.ts` | 101 | Best sunsets | best | §5.4 |
| `src/lib/config/phuketAreas.ts` | 141 | Best yield/price ratio | best | §5.4 |
| `src/lib/vertical/contextConfig.ts` | 29 | Best Season for Tours | best | §5.4 |
| `src/lib/vertical/contextConfig.ts` | 92 | Best Time for Outdoor Training | best | §5.4 |
| `src/pages/admin/AdminAddHub.tsx` | 80 | Best for: a referral, walk-in, a single villa or service. | best | §5.4 |
| `src/pages/admin/AdminAddHub.tsx` | 91 | Best for: WhatsApp/Telegram dumps, agent broadcasts. | best | §5.4 |
| `src/pages/admin/AdminAddHub.tsx` | 102 | Best for: partner exports, migrations, 50+ rows. | best | §5.4 |
| `src/pages/admin/AdminAddHub.tsx` | 113 | Best for: triage of inbound partner signups. | best | §5.4 |
| `src/pages/admin/AdminNewbuilds.tsx` | 448 | Label (e.g. Best ROI) | best | §5.4 |
| `src/pages/arrive/ArriveClusterPage.tsx` | 35 | Best rates & exchangers map | best | §5.4 |
| `src/pages/arrive/ExchangeBotPage.tsx` | 72 | Live THB/RUB/USD/EUR exchange rates. Best Phuket currency exchangers with ratings. | best | §5.4 |
| `src/pages/experiences/ExperiencesIndex.tsx` | 177 | Best tours, excursions, and activities in Phuket. | best | §5.4 |
| `src/pages/guest/WelcomeFlow.tsx` | 57 | Best tables nearby | best | §5.4 |
| `src/pages/legal/VisaImmigrationPage.tsx` | 546 | Best For | best | §5.4 |
| `src/pages/market/MarketCategoryPage.tsx` | 28 | Best prices on popular products | best | §5.4 |
| `src/pages/transport/TransportIndex.tsx` | 42 | Best rated | best | §5.4 |
| `src/pages/yachts/YachtsIndex.tsx` | 143 | Rent yachts, catamarans, and speedboats in Phuket. Best prices and instant booking. | best | §5.4 |
| `supabase/functions/ai-owner-nurture/index.ts` | 86 | Best angle for the pitch in Russian | best | §5.4 |
| `supabase/functions/concierge-route/index.ts` | 105 | Return 3-5 best myUNO routes for this user | best | §5.4 |
| `supabase/functions/crm-ai-assistant/index.ts` | 49 | Based on this contact's profile and recent activity, suggest the top 3 next best actions for the agent. Be specific and  | best | §5.4 |
| `supabase/functions/supplier-discovery/index.ts` | 32 | best restaurant Phuket fine dining | best | §5.4 |
| `supabase/functions/supplier-discovery/index.ts` | 202 | [Discovery v2] ${uniqueResults.length} unique results | unique | §5.4 |
| `supabase/functions/vendor-acquisition/index.ts` | 324 | <best time to send, e.g. '10:00-12:00 local time'> | best | §5.4 |

### Запрещённые слова (RU)

Всего: **19**. Показано: 19.

| Файл | Строка | Текст | Деталь | Раздел |
|---|---|---|---|---|
| `src/components/home/LifecycleSmartTip.tsx` | 59 | Лучшие рабочие пространства с быстрым Wi-Fi | лучшие | §5.4 |
| `src/components/home/PersonaSmartFeed.tsx` | 80 | Лучшие рейтинги | лучшие | §5.4 |
| `src/components/home/PersonaSmartFeed.tsx` | 104 | Лучшее сегодня | лучшее | §5.4 |
| `src/components/home/PersonaSmartFeed.tsx` | 153 | Лучшие салоны | лучшие | §5.4 |
| `src/components/services/VerticalShowcaseSection.tsx` | 63 | Лучшие салоны и SPA | лучшие | §5.4 |
| `src/components/transport/VehicleCard.tsx` | 62 | Лучшее | лучшее | §5.4 |
| `src/components/uno/ReviewCard.tsx` | 52 | Лучший отзыв | лучший | §5.4 |
| `src/components/vertical/VerticalInsightPanel.tsx` | 53 | Лучшие больницы Пхукета | лучшие | §5.4 |
| `src/lib/config/phuketAreas.ts` | 102 | Лучшие закаты | лучшие | §5.4 |
| `src/lib/config/phuketAreas.ts` | 142 | Лучшее соотношение доходность/цена | лучшее | §5.4 |
| `src/lib/vertical/contextConfig.ts` | 30 | Лучшее время для экскурсий | лучшее | §5.4 |
| `src/lib/vertical/contextConfig.ts` | 93 | Лучшее время для тренировок на улице | лучшее | §5.4 |
| `src/pages/arrive/ArriveClusterPage.tsx` | 35 | Лучшие курсы и карта обменников | лучшие | §5.4 |
| `src/pages/arrive/ExchangeBotPage.tsx` | 72 | Актуальные курсы валют THB/RUB/USD/EUR. Лучшие обменники на Пхукете с рейтингами. | лучшие | §5.4 |
| `src/pages/experiences/ExperiencesIndex.tsx` | 176 | Лучшие туры, экскурсии и активности на Пхукете. | лучшие | §5.4 |
| `src/pages/guest/WelcomeFlow.tsx` | 58 | Лучшие места рядом | лучшие | §5.4 |
| `src/pages/info/IPPolicyPage.tsx` | 429 | Любой автоматизированный сбор данных с Платформы запрещён без письменного разрешения. Мы используем передовые технологии | передовые технологии | §5.4 |
| `src/pages/market/MarketCategoryPage.tsx` | 29 | Лучшие цены на популярные товары | лучшие | §5.4 |
| `src/pages/yachts/YachtsIndex.tsx` | 142 | Аренда яхт, катамаранов и спидботов на Пхукете. Лучшие цены и мгновенное бронирование. | лучшие | §5.4 |

### Извинения-пустышки

Всего: **12**. Показано: 12.

| Файл | Строка | Текст | Деталь | Раздел |
|---|---|---|---|---|
| `src/components/ErrorBoundary.tsx` | 28 | Something went wrong | something went wrong | §7.4 |
| `src/components/ErrorBoundary.tsx` | 28 | Произошла ошибка | произошла ошибка | §7.4 |
| `src/components/ErrorBoundary.tsx` | 130 | An error occurred | an error occurred | §7.4 |
| `src/components/ErrorBoundary.tsx` | 162 | Произошла ошибка. Попробуйте снова. | произошла ошибка | §7.4 |
| `src/components/ErrorBoundary.tsx` | 163 | An error occurred. Please try again. | an error occurred | §7.4 |
| `src/hooks/useClaude.ts` | 53 | Something went wrong | something went wrong | §7.4 |
| `src/i18n/en.ts` | 230 | An error occurred | an error occurred | §7.4 |
| `src/i18n/ru.ts` | 230 | Произошла ошибка | произошла ошибка | §7.4 |
| `src/pages/auth/ForgotPassword.tsx` | 57 | Произошла ошибка | произошла ошибка | §7.4 |
| `src/pages/auth/ForgotPassword.tsx` | 58 | An error occurred | an error occurred | §7.4 |
| `src/pages/auth/ResetPassword.tsx` | 113 | Произошла ошибка | произошла ошибка | §7.4 |
| `src/pages/auth/ResetPassword.tsx` | 114 | An error occurred | an error occurred | §7.4 |

### Панибратство

Всего: **9**. Показано: 9.

| Файл | Строка | Текст | Деталь | Раздел |
|---|---|---|---|---|
| `src/components/owner/ComplexFormDialog.tsx` | 172 | Palm Garden Residence | pal | §4.2 |
| `src/components/transport/LocationPickerMap.tsx` | 37 | Palm Jumeirah | pal | §4.2 |
| `src/hooks/useDynamicFilterOptions.ts` | 384 | Color Palette | pal | §4.2 |
| `src/lib/config/dueDiligenceChecklist.ts` | 59 | Verify valid construction permits issued by the local municipality. | pal | §4.2 |
| `src/lib/config/phuketAreas.ts` | 99 | Twin Palms resort | pal | §4.2 |
| `src/lib/config/phuketAreas.ts` | 100 | Курорт Twin Palms | pal | §4.2 |
| `src/pages/landing/FlowerDeliveryLanding.tsx` | 140 | Every design is studio-photographed. Size affects flower count — style and color palette always match. | pal | §4.2 |
| `src/pages/landing/FlowerDeliveryLanding.tsx` | 173 | Some flowers may be substituted seasonally while preserving style, color palette, and value. | pal | §4.2 |
| `src/pages/landing/FlowerDeliveryLanding.tsx` | 245 | Size, style, and palette — all visible in photos. | pal | §4.2 |

---

## 3. Edge cases (⚠️)

Всего: **22**. Показано: 22.

| Файл | Строка | Текст | Замечание | Раздел |
|---|---|---|---|---|
| `src/components/admin/ProviderSelector.tsx` | 335 | Быстро создать | расплывчатое «быстро» — добавьте цифру/срок | §5.5 |
| `src/components/life-flow/InsurancePromptBlock.tsx` | 59 | Вы уже на месте — но страховку ещё можно оформить. Через myUNO — быстро, и мы поможем разобраться на месте. | расплывчатое «быстро» — добавьте цифру/срок | §5.5 |
| `src/components/market/ProfessionalProductCard.tsx` | 47 | Легко | расплывчатое «легко» — добавьте цифру/срок | §5.5 |
| `src/components/owner/guide/GuideEcosystem.tsx` | 84 | myUNO — это не просто приложение, а единое место для жизни и отдыха за рубежом. Платформа объединяет три компонента: циф | расплывчатое «просто» — добавьте цифру/срок | §5.5 |
| `src/components/property/PaymentStageSelector.tsx` | 140 | Просто | расплывчатое «просто» — добавьте цифру/срок | §5.5 |
| `src/components/trip-planner/TripChecklist.tsx` | 148 | Мы позаботимся обо всём. Просто отмечайте готовое. | расплывчатое «просто» — добавьте цифру/срок | §5.5 |
| `src/components/trust/ContextualHeader.tsx` | 39 | Рекомендуем для вашего приезда — проверено и надёжно | расплывчатое «надёжно» — добавьте цифру/срок | §5.5 |
| `src/components/trust/ContextualHeader.tsx` | 65 | Проверено активными жителями — надёжно для отдыха | расплывчатое «надёжно» — добавьте цифру/срок | §5.5 |
| `src/components/trust/ContextualHeader.tsx` | 105 | Удобно для удалёнщиков и предпринимателей | расплывчатое «удобно» — добавьте цифру/срок | §5.5 |
| `src/lib/config/phuketAreas.ts` | 174 | Быстро развивающийся район в глубине от Банг Тао. Здесь расположены Porto de Phuket, Blue Tree, международные школы. Отл | расплывчатое «быстро» — добавьте цифру/срок | §5.5 |
| `src/lib/taxonomies/experiencesTaxonomy.ts` | 76 | Легко | расплывчатое «легко» — добавьте цифру/срок | §5.5 |
| `src/pages/HowItWorks.tsx` | 91 | Начать легко | расплывчатое «легко» — добавьте цифру/срок | §5.5 |
| `src/pages/arrive/ArriveClusterPage.tsx` | 97 | Бронируйте заранее — места разбирают быстро | расплывчатое «быстро» — добавьте цифру/срок | §5.5 |
| `src/pages/delivery/DeliveryIndex.tsx` | 74 | Безопасно и быстро | расплывчатое «быстро» — добавьте цифру/срок | §5.5 |
| `src/pages/info/AboutPage.tsx` | 399 | myUNO — это не просто приложение. Всё для жизни за рубежом — в одном месте. | расплывчатое «просто» — добавьте цифру/срок | §5.5 |
| `src/pages/info/FAQPage.tsx` | 29 | myUNO — это не просто приложение, это инфраструктура для комфортной жизни за рубежом. Платформа объединяет цифровые серв | расплывчатое «просто» — добавьте цифру/срок | §5.5 |
| `src/pages/info/HowItWorksPage.tsx` | 61 | Оплатите удобно | расплывчатое «удобно» — добавьте цифру/срок | §5.5 |
| `src/pages/info/HowItWorksPage.tsx` | 214 | Всё просто! | расплывчатое «просто» — добавьте цифру/срок | §5.5 |
| `src/pages/legal/VisaQuizPage.tsx` | 242 | Просто | расплывчатое «просто» — добавьте цифру/срок | §5.5 |
| `src/pages/restaurants/TableReservation.tsx` | 320 | Оплата не требуется. Просто приходите в назначенное время. | расплывчатое «просто» — добавьте цифру/срок | §5.5 |
| `src/pages/services/ServiceProviderDetail.tsx` | 124 | Профессионал с многолетним опытом работы. Выполняю все виды работ в своей сфере. Работаю быстро и качественно. Гарантия  | расплывчатое «быстро» — добавьте цифру/срок | §5.5 |
| `src/pages/services/ServiceProviderDetail.tsx` | 143 | Быстро приехал и решил проблему. Очень доволен работой. | расплывчатое «быстро» — добавьте цифру/срок | §5.5 |

---

## 4. Приоритизация для исправления

### P0 — trust-критично (платежи, onboarding, SOS, legal, auth, KYC)

- src/components/legal/VisaTracker.tsx (1)
- src/pages/Auth.tsx (1)
- src/pages/SOS.tsx (9)
- src/pages/auth/ForgotPassword.tsx (2)
- src/pages/auth/ResetPassword.tsx (2)
- src/pages/legal/VisaImmigrationPage.tsx (1)
- src/pages/legal/VisaQuizPage.tsx (1)
- supabase/functions/ai-legal-assistant/index.ts (1)
- supabase/functions/auth-phone-prelink/index.ts (1)
- supabase/functions/create-property-deposit-checkout/index.ts (1)
- supabase/functions/stripe-webhook/index.ts (3)

### P1 — основные user-flows (search, property, booking, CRM, catalog, wallet)

- src/components/owner/property-manage/StaysSubscriptionCard.tsx (1)
- src/components/owner/property-wizard/steps/PricingStep.tsx (1)
- src/components/property/PropertyBookingCard.tsx (1)
- src/components/property/SimilarProperties.tsx (1)
- src/components/property/UnitFields.tsx (1)
- src/pages/booking/AdvanceRequested.tsx (2)
- src/pages/property/ManualPaymentPending.tsx (2)
- src/pages/property/OffplanIndex.tsx (2)
- src/pages/property/PropertyMySection.tsx (2)
- src/pages/property/WhyMyUno.tsx (1)
- supabase/functions/_shared/property-email-templates.ts (2)
- supabase/functions/ai-smart-search/index.ts (1)
- supabase/functions/crm-ai-assistant/index.ts (1)
- supabase/functions/execute-crm-workflow/index.ts (17)
- supabase/functions/property-moderation-email/index.ts (2)

### P2 — остальное

Файлов: 133. Топ-30:

- src/components/ErrorBoundary.tsx (5)
- src/components/admin/ai-agents/UtilityAgentCard.tsx (1)
- src/components/admin/ai-insights/AIROIReport.tsx (3)
- src/components/admin/marketing/MCCLandingControlTab.tsx (1)
- src/components/admin/marketing/MCCLeadsTab.tsx (1)
- src/components/admin/operations/OperationsManualPaymentsTab.tsx (1)
- src/components/category/CategorySuggestionDialog.tsx (1)
- src/components/developer-portal/MicrositeTab.tsx (1)
- src/components/home/LifecycleSmartTip.tsx (1)
- src/components/home/PersonaSmartFeed.tsx (5)
- src/components/home/ProactiveConcierge.tsx (1)
- src/components/home/QuickActionsGrid.tsx (1)
- src/components/market/FlashDealsSection.tsx (1)
- src/components/newbuilds/tabs/NbInventoryTab.tsx (1)
- src/components/owner/ComplexFormDialog.tsx (1)
- src/components/owner/OperationalTaskCard.tsx (1)
- src/components/owner/OwnerAIAssistant.tsx (2)
- src/components/owner/TaskDetailSheet.tsx (1)
- src/components/owner/channel-manager/channelRegistry.ts (1)
- src/components/owner/contacts/CrmAiAssistantPanel.tsx (1)
- src/components/owner/dashboard/RisksBlock.tsx (1)
- src/components/owner/documents/AILegalAssistant.tsx (1)
- src/components/owner/management/ManagementTermsForm.tsx (1)
- src/components/owner/sales/dealTypePresentation.ts (2)
- src/components/owner/transparency/OwnerTermsTab.tsx (1)
- src/components/profile/UserRolesPermissions.tsx (1)
- src/components/services/ServiceFunctionCard.tsx (1)
- src/components/services/VerticalShowcaseSection.tsx (1)
- src/components/shared/YourDayFeed.tsx (1)
- src/components/staff/StaffTaskCalendar.tsx (2)

---

## 5. Файлы / зоны вне автоматического аудита

Эти источники требуют ручной проверки, потому что строки не извлекаются простым regex-сканером:

- `src/i18n/uiStrings.ts` и `src/i18n/index.ts` — централизованные переводы (нужен sweep по объекту)
- `supabase/functions/**` — email/whatsapp шаблоны с интерполяцией
- `/emails/**`, `/templates/email/**` — отсутствуют как папки в repo (если появятся — добавить в SCOPE)
- `/packages/ai/messages/**`, `/bot/templates/**` — отсутствуют как папки в repo
- AI system-prompts в `docs/canonical/08-ai-prompts-library.md` — отдельная сверка
- Push/SMS-шаблоны (если хранятся в БД `system_settings`) — нужен SQL-аудит
- Динамические сообщения, собранные из переменных (`${a} + ${b}`)

---

_Отчёт сгенерирован автоматически. Не переписывает тексты — только классифицирует._
