우리 가족 창작사진관 MASTER C1.1.4 — 자동 누끼 결과 처리 오류 수정

원인: C1.1.3에서 SelfieSegmenter의 confidenceMasks[1]을 읽었으나, 이 모델은 confidenceMasks[0] 한 장만 반환합니다. 엔진 다운로드와 인식이 작동해도 앱이 결과가 없다고 표시하던 코드 오류입니다.

수정: foreground 마스크 [0] 사용, 반환값 및 크기 검사 추가, 실패 시 상세 메시지.
유지: 사진 가져오기, 로컬 AI 모델/배포 workflow, 수동 선택 도구, 작품 만들기, 저장, 백업.

설치: 기존 창작사진관 GitHub 저장소에서 index.html, app.js, style.css, manifest.webmanifest 파일 교체 후 Commit. 기존 .github/workflows/publish-creative-studio.yml 파일과 GitHub Pages Actions 설정은 그대로 유지. GitHub Pages 배포 완료 후 Safari 새로고침. 반드시 MASTER C1.1.4 표시 확인. 다른 familypics 저장소와 Safari 데이터는 건드리지 말 것.

시험: 원래 시험하던 회색 배경 인물 사진 → ✂️ 누끼 → 🪄 자동으로 인물 따기. 성공하면 투명 배경으로 인물이 남아야 함. 실패하면 전체 메시지와 스크린샷 공유. 실제 iPad에서의 작동은 아직 검증 전.

보안: 사진은 브라우저에서 분석하고 서버로 업로드하지 않음. GitHub Actions는 AI 프로그램과 모델을 공개 정적 파일로 배포함. 
