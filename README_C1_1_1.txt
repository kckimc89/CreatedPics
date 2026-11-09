우리 가족 창작사진관 MASTER C1.1.1 — 자동 누끼 모듈 로딩 수정판

변경: 공식 MediaPipe vision_bundle.mjs 사용(+esm 제거), jsDelivr 실패 시 unpkg 대체 경로 시도, 다운로드 단계별 메시지 개선.

설치: 기존 창작사진관 GitHub 저장소의 index.html, app.js, style.css, manifest.webmanifest만 교체. familypics 및 config.js 수정 금지. 기존 작품 DB 이름/구조와 수동 누끼·합성 기능은 유지. Safari 사이트 데이터 삭제 금지.

시험: iPad Safari 새로고침 후 MASTER C1.1.1 확인 → 정상 로드된 사진 → ✂️ 누끼 → 자동으로 인물 따기. 최초 실행은 인터넷 연결이 필요합니다. 외부 CDN이 차단되면 여전히 실패할 수 있으며 성공 여부는 아이패드 시험으로만 확인됩니다.

이 버전은 클라이언트 JavaScript 정적 점검을 거친 수정본이며 실제 iPad / 모델 다운로드 실행 검증을 마친 것은 아닙니다. 원본 사진 자체는 외부로 전송하지 않습니다.
