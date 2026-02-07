

# Add Let's Relax Spa -- All 9 Phuket Branches + Services & Packages

## What We Fetched (verified from letsrelaxspa.com)

### Company Profile
- **Brand**: Let's Relax Spa -- No.1 Thailand Boutique Day Spa
- **Founded**: 1998, Chiang Mai
- **Scale**: 26+ years, 7M+ clients, 60+ locations across 8 provinces, 2 international branches
- **Five Signatures**: Boutique Design, Siamese Serenity, Certified Therapists, Finest Selection, Refreshing Thai Taste (complimentary tea & fruit after service)
- **Booking**: Online only (no phone reservations) -- booking.letsrelaxspa.com

### 9 Phuket Branches

| Branch | Location / District | Address Detail |
|--------|---------------------|----------------|
| Patong 2nd Street | Patong | Ratcha-Uthit Road, Patong 2nd Street |
| Patong 3rd Street | Patong | Pangmuang Sai Kor Road, Patong Beach |
| Karon | Karon | The Waterfront Suites Phuket |
| The SIS Kata | Kata | The Sis Kata Resort Hotel |
| Boat Lagoon | Koh Kaew | Boat Lagoon complex |
| M Social | Phuket Town area | M Social Hotel Phuket |
| Beyond Resort Patong | Patong | B floor, Beyond Resort Patong |
| Laguna Porto de Phuket | Bang Tao / Laguna | 1st floor, Porto de Phuket mall |
| Veranda Resort | Phuket (south) | 1st floor, Veranda Resort Autograph Collection |

### Individual Treatments (prices from website)

| Treatment | Duration | Price (THB) |
|-----------|----------|-------------|
| Hand Massage | 30 min | 350 |
| Back & Shoulder Massage | 30 min | 375 |
| Thai Herbal Steam | 30 min | 500 |
| Foot Massage | 45 min | 600 |
| Back & Shoulder Massage | 60 min | 750 |
| Foot Massage | 60 min | 800 |
| Floral Bath | 30 min | 800 |
| Thai Massage | 120 min | 1,200 |
| Aromatherapy Oil Massage | 60 min | 1,300 |
| Body Scrub | 60 min | 1,300 |
| Body Wrap | 60 min | 1,300 |
| Thai Massage + Herbal Compress | 120 min | 1,400 |
| Four-Hands Thai Massage | 60 min | 1,400 |
| Dr. Spiller Facial Massage | 60 min | 1,600 |
| Warm Oil Massage | 60 min | 1,600 |
| Four-Hands Thai Massage | 120 min | 2,200 |
| Aromatic Hot Stone Massage | 90 min | 2,300 |
| Four-Hands + Herbal Compress | 120 min | 2,400 |
| Aromatherapy Oil Massage | 120 min | 2,600 |

### Spa Packages

| Package | Duration | Price (THB) | Best For |
|---------|----------|-------------|----------|
| Dream Package | 90 min | 1,100 | Quick relief |
| Heavenly Relax | 165 min | 1,850 | Post-travel recovery |
| Simply Thai | 150 min | 1,900 | Authentic Thai experience |
| Body & Soul | 120 min | 2,500 | Skin + massage combo |
| Golfers' Heaven | 135 min | 2,750 | Active/sports fatigue |
| Full Spirit | 165 min | 2,950 | Full body care |
| Blooming Life | 180 min | 3,900 | Skin rejuvenation |
| Executive Hide Away | 180 min | 4,100 | Mental recovery |
| Day Dream | 210 min | 4,700 | Half-day experience |
| Spa Experience | 210 min | 4,900 | Premium full journey |

---

## Implementation Plan

### Phase 1: INSERT 9 salon records into `salons` table
- One record per Phuket branch
- `salon_type`: `'spa'`
- `name_en`: "Let's Relax Spa - [Branch Name]"
- `name_ru`: bilingual Russian translation
- `description_en` / `description_ru`: brand story + branch-specific info
- `services`: array of key treatment names
- `price_from`: 350 (lowest treatment price)
- `website`: branch-specific URL from letsrelaxspa.com
- `is_verified`: true, `is_featured`: true (for top 3 branches), `is_active`: true
- `district`: mapped to existing Phuket districts
- `languages`: `['en', 'th']`
- `amenities`: `['AC', 'WiFi', 'Complimentary Tea', 'Herbal Steam']` (varies per branch)

### Phase 2: Map top branches to LifeOS situations
- INSERT into `catalog_life_map`:
  - **vacation_leisure** -- Patong 2nd St (weight 72, primary spa recommendation)
  - **long_term_living** -- Boat Lagoon branch (weight 65, expat-friendly location)
  - **arrival_first_day** -- Patong 3rd St (weight 48, recovery after flight)

### No Frontend Changes
The `salons` table is already rendered by existing Salons/Spa pages and the LifeOS enrichment hooks. All 9 branches will appear automatically.

### Data Accuracy
All prices, branch names, and descriptions are sourced directly from letsrelaxspa.com (fetched today). No phone numbers will be added since Let's Relax explicitly states "no phone reservations -- book online only."
