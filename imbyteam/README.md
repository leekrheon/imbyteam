# 틈 — IMBY Team

## 시작하기

```bash
npm install
npm run dev
```

## Supabase 설정

`src/supabase.js`에 프로젝트 URL과 anon key가 설정되어 있습니다.

새 Supabase 프로젝트에서 처음 셋업하는 경우:
1. `supabase/schema_original.sql` 실행 (전체 테이블 생성)

기존 프로젝트에서 컬럼 누락/타입 불일치 문제가 있는 경우:
2. `supabase/schema_fixes.sql` 실행 (누락 컬럼 추가, 타입 보정 — 여러 번 실행해도 안전)

SQL 실행 후에는 Supabase 대시보드 **Project Settings → API → Reload schema cache**를 한 번 눌러주거나, SQL 마지막 줄의 `NOTIFY pgrst, 'reload schema';`로 자동 반영됩니다.

## favicon / OG 이미지

`public/` 폴더에 다음 파일을 추가해주세요 (index.html에 이미 메타태그가 연결되어 있습니다):
- `favicon.png` — 512×512 권장
- `og-image.png` — 1200×630 권장

추가 후 배포 도메인이 정해지면 `index.html`의 `og:image`, `twitter:image`를 절대경로(`https://yourdomain.com/og-image.png`)로 바꿔주는 것을 권장합니다.

## 빌드

```bash
npm run build
```
