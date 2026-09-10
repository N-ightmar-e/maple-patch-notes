# 메이플 패치노트 1.2.206

2026-09-10 공식 테스트월드 스킬 조정을 읽기 위한 비공식 웹사이트입니다.

- `/`: 48개 직업, 공통 및 콘텐츠 색인과 전체 검색
- `/compare`: 공식 공지의 전후 수치, 개별 상향/하향, 파티 효과 삭제
- `/sources`: 이전 릴리즈 조사, 판정 기준 및 아이콘 출처

자료: https://maplestory.nexon.com/testworld/news/all/198
직전 릴리즈는 1.2.205(8월 13일), 이전 전용 스킬 조정은 1.2.204(7월 16일)입니다. 수치 비교는 9월 10일 공지 자체의 이전/이후 값이며, 모든 값을 과거 릴리즈에서 독립 재확인한 자료가 아닙니다.

64개 섹션, 1,153개 항목과 727개 수치 비교를 담았습니다. 원문 4,009개 본문 블록의 파싱 누락 검증 및 모든 수치·산술 대조를 통과했습니다. 403개 상향, 297개 하향, 27개 확인 필요 판정은 각 수치 단위의 분류입니다. 직업 전체 딜 변화율이 아닙니다.

공식 직업 이미지 48개 및 스킬 항목 638개에 연결한 실제 아이콘을 로컬에 포함합니다. 아이콘은 공식 1~5차 가이드 기준이며 새 테스트 클라이언트 아이콘을 보장하지 않습니다. 미확인 아이콘은 중립 검 표시와 텍스트로 구분합니다. 출처 및 SHA-256은 `public/asset-sources.json`에 있습니다. 메이플스토리 이미지 권리는 NEXON에 있습니다.

실행: `npm install`, `npm run dev`
빌드: `npm run build`
타입 검사: `npx tsc --noEmit`

컴파일과 비브라우저 HTTP 응답, 데이터 및 로컬 이미지 참조를 확인했습니다. 실제 브라우저 상호작용 테스트는 수행하지 않았습니다.

## GitHub Pages

공개 사이트: https://n-ightmar-e.github.io/maple-patch-notes/
저장소: https://github.com/N-ightmar-e/maple-patch-notes

`npm run build:pages`는 같은 React 화면과 데이터를 Vite로 빌드해 `dist/github-pages/`에 세 개의 정적 HTML 진입점을 만듭니다. GitHub Pages의 `/maple-patch-notes/` 경로를 이미지와 링크에 적용합니다. 로그인 서버나 비밀 키가 필요하지 않습니다.

`main`에는 소스코드, `gh-pages`에는 생성된 파일을 보관합니다. Pages 게시 원본은 `gh-pages` 브랜치의 `/`이며 `.nojekyll`로 정적 파일을 그대로 제공합니다. 사이트를 갱신할 때는 소스 변경을 `main`에 커밋하고 `npm run build:pages` 후 결과를 `gh-pages`에 배포하면 됩니다. 기존 `npm run build`는 Sites 서버 빌드를 유지합니다.

GitHub Pages에서는 각 메뉴가 해당 HTML 페이지로 이동합니다. JavaScript를 켜야 직업 색인, 검색 및 비교 필터를 사용할 수 있습니다.
