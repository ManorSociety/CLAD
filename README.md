# CLAD V5 - Full Feature Release

## New Features in V5

### 1. New Pricing Structure
- Monthly and Annual billing (20% discount for annual)
- Project Pass: $499 one-time for 12 months, 100 renders
- Standard: $49/mo ($39 annual) - 15 renders
- Pro: $99/mo ($79 annual) - 75 renders  
- Enterprise: $199/mo ($159 annual) - 200 renders

### 2. Color Chip Upload
- Take a photo of any paint chip, fabric, or material
- AI extracts exact color
- Save colors to your library
- Apply to any surface

### 3. Compare View (Mobile/Tablet Optimized)
- Slider comparison
- Side-by-side view
- Tap to flip
- Perfect for job site presentations

### 4. Project Sharing
- Generate shareable links
- Control permissions (downloads, email requirement, expiration)
- Social media export (Instagram, Facebook, Pinterest)
- Before/after image generation

### 5. Interior Mode (Full Implementation)
- Room types: Kitchen, Living, Bedroom, Bathroom, Office, Dining
- Interior styles: Modern, Farmhouse, Scandinavian, Traditional, etc.
- Material selection: Flooring, Cabinets, Countertops, Backsplash

### 6. Builder Dashboard (Enterprise)
- Multi-project management
- Client information per project
- Project status tracking (Design, Approved, Building, Complete)
- Search and filter

### 7. Offline Mode
- Cache projects for job site use
- Works without internet connection
- Auto-sync when back online
- Pending sync indicator

## Quick Start

```bash
cd CLAD-V5-FULL
npm install
npm install @google/genai
echo "VITE_API_KEY=your-gemini-api-key" > .env
npm run dev
```

Open http://localhost:3000

## File Structure

```
CLAD-V5-FULL/
├── App.tsx                    # Main application
├── types.ts                   # All types, styles, materials
├── services/
│   ├── geminiService.ts       # AI rendering (exterior + interior)
│   ├── storageService.ts      # IndexedDB + offline cache
│   ├── sharingService.ts      # Project sharing + social export
│   ├── authService.ts         # Authentication
│   └── backendService.ts      # Payments
├── components/
│   ├── ColorChipUpload.tsx    # Color extraction
│   ├── CompareView.tsx        # Comparison slider
│   ├── ShareModal.tsx         # Sharing UI
│   ├── BuilderDashboard.tsx   # Enterprise dashboard
│   ├── InteriorControls.tsx   # Interior mode UI
│   ├── OfflineIndicator.tsx   # Offline status
│   ├── PricingSection.tsx     # New pricing UI
│   └── ReportProblemModal.tsx # Support tickets
└── ...config files
```

## Deployment

```bash
npm run build
vercel
```

## Environment Variables

```
VITE_API_KEY=your-gemini-api-key
VITE_SUPABASE_URL=your-supabase-url (optional)
VITE_SUPABASE_ANON_KEY=your-supabase-key (optional)
```

# Updated
# Updated
# test
