

# Home Services: Web-Verified Provider Enrichment

## Current State

The database has 18 home service providers, mostly with verified websites, but many are missing:
- Phone numbers (Smart Fix, We Fix, all laundries, SPM, Kaandee)
- Detailed service descriptions (most have 1-line descriptions)
- Service area coverage
- Pricing information
- Logo URLs

Additionally, several important real Phuket providers are NOT in the database yet.

## Verified Provider Data (from official websites)

### Existing Providers to Enrich

| Provider | Category | Phone (verified) | Website (verified) | Key Update |
|----------|----------|-------------------|---------------------|------------|
| Smart Fix Thailand | handyman | Contact form only | smartfixthailand.com | Add services: AC, pool, garden, drains, renovations. 24/7 service. |
| Phuket Air Conditioner | ac | 095-296-5705 | phuketairconditioner.com | Already good. Add description about cleaning/repair/install. |
| PhuketAC | ac | 064-334-6596 | phuketac.com | Already good. Confirm phone. |
| Phuket Electricians | electrical | 095-296-5705 | electricianphuket.com | Same company as Phuket Air Conditioner. Add description. |
| Phuket Plumbers | plumbing | 097-025-9718 | phuketplumbers.com/en | Add 15+ years experience, all plumbing repairs. |
| Phuket Plumbing | plumbing | -- | phuketplumbing.com | Add water, electrical, building needs, leak detection. |
| Smart Service Phuket | home-cleaning | 062-237-8517 | smartservicephuket.com | EN/RU/TH support. Property maintenance focus. |
| SPM Property Management | garden | WhatsApp via site | spmphuket.com | Pool from 90 THB/sqm, gardening 300 THB/sqm, 25+ years hospitality. |
| Laundry Phuket | laundry | -- | laundry-phuket.com | 70 THB/kg, free pickup, same-day 7hr. |
| Laundry Kata | laundry | -- | laundrykata.com | European standards, Bestin Group partner. |
| Clean Machine | laundry | -- | clean-machine.services | New machines, trained staff, pickup & delivery. |
| Laundry Service Phuket | laundry | -- | laundryservicephuket.net | 70 THB/kg, hotels/villas/individuals. |
| ProClean Services | cleaning | +66 76 111 222 | -- | UNVERIFIED. No website found. May be fake data -- flag for review. |

### New Providers to Add (all verified via official websites)

| Provider | Category | Phone | Website | Description |
|----------|----------|-------|---------|-------------|
| Khun Clean | deep-cleaning | 082-797-3702 | phuket.khunclean.com | Phuket's top deep cleaning. 5-star Google. Deep clean from 2,160 THB (studio). Outdoor, office, restaurant, junk removal. EN/TH. |
| Qleanary | home-cleaning | 098-060-7477 | qleanary.com | General, deep, AC, sofa, mattress, boat/yacht cleaning. Laundry service. EN/RU. Island-wide. |
| MPcare Phuket | home-cleaning | via website | mpcarephuket.com | 500+ clients, 5+ years. Villas, condos. Patong, Phuket Town, Thalang, Chalong coverage. |
| Gookaa | home-cleaning | via app | gookaa.com | App-based maid booking. iOS/Android. On-demand cleaners. |
| Phuket Maids | home-cleaning | via website | phuket-maids.com | From 250 THB/hr. Maid, ironing (12.5 THB/piece), big cleaning from 4,000 THB. |
| Phuket Kaandee Service | pool | via website | phuketkaandeeservice.com | Maid, pool cleaning, gardening, pest control, home maintenance. 4 years in business. |
| Total Pool Solution | pool | 081-970-8487 | totalpoolsolution.com | Western-owned. 20+ years. Only lab-tested water in Phuket. Cleaning, repairs, re-tiling. |
| Pool & Garden Phuket | pool | via website | pool-garden.com | Pool + garden for private villas. Consistent long-term care. |
| Arkon Pest Control | pest | 076-202-200 | arkonpest.com | 23 years. Termites, cockroaches, rats, ants, mosquitoes. Eco-friendly chemicals. |
| Pest Guard Group | pest | 089-652-0773 (EN) | pestguardgroup.in.th | Termite specialist. Bait system eliminates colonies in 4-6 weeks. English support. |
| Bigmove Phuket | moving | via website | bigmovephuket.com | 20+ years. Residential, commercial, international. Single item to entire hotel. |
| USP Relocations | moving | via website | uspphuket.com | Local, domestic, international moves. Door-to-door. Packing service. |
| APP Management | handyman | via website | appmanagement.co.th | Full property services: cleaning, AC, electrical, plumbing, landscaping. Professional team. |
| Phuket Cleaning Bee | home-cleaning | 081-587-8523 | phuketcleanbee.com | Serves entire Phuket. Line/WhatsApp available. |

## Technical Details

### Phase 1: Enrich existing 18 providers
- UPDATE `providers` table with verified phone numbers, enriched `description_en` and `description_ru`
- Add `service_domains` where incomplete

### Phase 2: INSERT ~14 new verified providers
- INSERT into `providers` table with complete data from official websites
- All entries will have `is_verified: true` and `source_url` pointing to official website
- Flag `ProClean Services` as unverified (no website found)

### Phase 3: Add services for new providers
- INSERT into provider services linking table where applicable

### Tables Affected
- `providers` (~18 UPDATEs + ~14 INSERTs)

### No Frontend Changes
The existing Home Services pages already query the `providers` table and render all fields.

### Data Sources
All data verified from official websites during this session:
- phuketairconditioner.com, phuketac.com, electricianphuket.com
- smartfixthailand.com, smartservicephuket.com, wefixphuket.com
- phuket.khunclean.com, qleanary.com, mpcarephuket.com, gookaa.com
- totalpoolsolution.com, pool-garden.com, phuketkaandeeservice.com
- arkonpest.com, pestguardgroup.in.th
- bigmovephuket.com, uspphuket.com
- spmphuket.com, appmanagement.co.th, phuketcleanbee.com

