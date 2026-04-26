# 06 — Brand System (Tailwind Tokens)

`tailwind.config.ts`에 그대로 복붙 가능. 05 디자인 브리프의 컬러 팔레트가 토큰화되어 있음.

## tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
        },
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
        },
        text: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },
        border: 'var(--border)',
        bullish: '#EF4444',
        bearish: '#3B82F6',
        neutral: '#64748B',
        exp: '#FBBF24',
        streak: '#F97316',
        heart: '#EC4899',
        energy: '#06B6D4',
        tier: {
          common: '#94A3B8',
          rare: '#3B82F6',
          epic: '#A855F7',
          legendary: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['24px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        h3: ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.6' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        chip: '999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04)',
        elevated: '0 4px 12px rgba(0,0,0,0.08)',
      },
      transitionTimingFunction: {
        'ease-out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## globals.css (CSS 변수)

```css
/* app/globals.css */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --surface-0: #FFFFFF;
    --surface-1: #F8FAFC;
    --surface-2: #F1F5F9;
    --text-1: #0F172A;
    --text-2: #475569;
    --text-3: #94A3B8;
    --border: #E2E8F0;
  }

  .dark {
    --surface-0: #0B0F19;
    --surface-1: #111827;
    --surface-2: #1F2937;
    --text-1: #F8FAFC;
    --text-2: #94A3B8;
    --text-3: #64748B;
    --border: #334155;
  }

  body {
    @apply bg-surface-0 text-text-1 font-sans antialiased;
  }
}
```

## 컴포넌트 샘플 클래스

### 카드
```html
<div class="bg-surface-1 rounded-card shadow-card p-5 border border-border">
  ...
</div>
```

### 일차 버튼
```html
<button class="bg-brand text-white rounded-btn px-5 py-3 font-semibold
               hover:bg-brand-dark transition-colors duration-200
               disabled:opacity-50">
  매수하기
</button>
```

### 점선 보조 버튼 (AI 코칭 등)
```html
<button class="border border-dashed border-brand text-brand rounded-btn
               px-4 py-2 text-body font-medium
               hover:bg-brand/5 transition-colors">
  AI에게 물어보기
</button>
```

### 칩 / 배지
```html
<span class="inline-flex items-center gap-1 bg-streak/10 text-streak
             rounded-chip px-3 py-1 text-caption">
  🔥 7일 연속
</span>
```

### EXP 바
```html
<div class="h-2 bg-surface-2 rounded-full overflow-hidden">
  <div class="h-full bg-exp" style="width: 64%"></div>
</div>
```

### 매수/매도 토글
```html
<div class="grid grid-cols-2 gap-1 p-1 bg-surface-2 rounded-btn">
  <button class="py-2 rounded bg-bullish text-white font-semibold">매수</button>
  <button class="py-2 rounded text-text-2">매도</button>
</div>
```

## 애니메이션 토큰

```css
@layer utilities {
  .animate-in-soft {
    animation: fade-up 280ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-streak-pulse {
    animation: streak-pulse 1.5s ease-in-out infinite;
  }
  @keyframes streak-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }
}
```

## shadcn/ui 통합

```bash
npx shadcn@latest init
```

`components.json`의 색상 베이스를 `slate` 또는 `neutral`로 두고, 위 토큰으로 오버라이드.
