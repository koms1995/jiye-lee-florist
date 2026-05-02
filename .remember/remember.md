# Handoff

## State
nrly.co 스타일 redesign 완료 (commit a397699). Gallery-first 레이아웃, 이름 타일(index 2), 페이지 로드 stagger 애니메이션, 최소 Navbar, Footer EMAIL+IG 구조, 영문 전용. `pnpm build` 성공, 31개 테스트 통과. Puppeteer로 레이아웃 확인 완료 — 구조 정상, 이미지만 플레이스홀더 상태.

## Next
1. `public/images/gallery/` 실제 꽃 사진으로 교체 (01.jpg~08.jpg, 1×1px 플레이스홀더 현재 상태)
2. `lib/constants.ts`에 `EMAIL`과 `KAKAO_LINK` 실제 값 입력
3. Vercel 배포 (`pnpm dlx vercel` 또는 Vercel MCP)

## Context
- Tailwind v4 — 토큰은 `tailwind.config.ts` 아닌 `app/globals.css` `@theme` 블록에 있음
- `vitest.setup.ts`에 IntersectionObserver + embla mock 필수 (없으면 테스트 깨짐)
- `EMAIL=''` 이면 Footer에서 Email 링크가 비활성(dim) 처리됨 — 정상 동작
