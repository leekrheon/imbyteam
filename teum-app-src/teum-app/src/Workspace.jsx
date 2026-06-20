import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home, MessageSquare, Calendar as CalendarIcon, Users, HelpCircle,
  Moon, Sun, Search, Plus, Send, Smile,
  ChevronLeft, ChevronRight, ChevronDown, X, MapPin, Clock, Bell,
  CalendarPlus, ArrowLeft, Check, Star, Settings, Video,
  Lightbulb, ThumbsUp, ListTodo, SquareKanban,
  LayoutList, Command, CornerDownLeft,
  Play, Square, ArrowUpRight, TrendingUp, Bookmark,
  Globe, Pencil, BarChart2, FileText, Sparkles, Archive, Eye, Tag,
} from "lucide-react";

/* =========================================================================
   사용자 프로필: 글자 대신 실루엣 아이콘, 사용자별 색상만 다르게
   ========================================================================= */
const USER_COLORS = {
  주: { fg: "#05d560", bg: "#edfbf4" },
  소: { fg: "#7c6fe0", bg: "#f0eefc" },
  민: { fg: "#e87040", bg: "#fcefe9" },
  예: { fg: "#2f8fe0", bg: "#e9f3fc" },
};
// 알 수 없는 사용자용 색상 — 이니셜 문자 코드로 안정적으로 배정
const FALLBACK_COLORS = [
  { fg: "#c9356a", bg: "#fbeef3" },
  { fg: "#0ea5a5", bg: "#e7f7f7" },
  { fg: "#d6892a", bg: "#fbf2e6" },
  { fg: "#6366f1", bg: "#ecedfd" },
  { fg: "#16a34a", bg: "#e9f7ee" },
];
function userColor(ini) {
  if (USER_COLORS[ini]) return USER_COLORS[ini];
  if (!ini) return { fg: "#9aa0a7", bg: "#f0f1f4" };
  const code = ini.charCodeAt(0) || 0;
  return FALLBACK_COLORS[code % FALLBACK_COLORS.length];
}
// 사람 실루엣 SVG (첨부 이미지와 동일 형태: 머리 원 + 어깨 반원)
function UserSilhouette({ ini, size = 28, radius, title }) {
  const { fg, bg } = userColor(ini);
  const r = radius != null ? radius : Math.round(size * 0.3);
  const rx = (r / size) * 100;
  const clipId = `clip-${ini || "x"}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", flex: "0 0 auto" }} aria-label={title}>
      <defs>
        <clipPath id={clipId}>
          <rect width="100" height="100" rx={rx} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" rx={rx} fill={bg} />
        <circle cx="50" cy="36" r="18" fill={fg} />
        <path d="M50 60 C28 60 15 76 14 100 L86 100 C85 76 72 60 50 60 Z" fill={fg} />
      </g>
    </svg>
  );
}
// 실루엣 + presence 점(선택) 래퍼
function UserAvatar({ ini, size = 28, radius, presence, presenceSize }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", flex: "0 0 auto" }}>
      <UserSilhouette ini={ini} size={size} radius={radius} title={ini} />
      {presence && <span className={`presence ${presence}`} style={presenceSize ? { width: presenceSize, height: presenceSize } : undefined} />}
    </span>
  );
}

/* =========================================================================
   틈 (TEUM) — 팀 대화와 공유 일정이 한 곳에 모이는 워크스페이스
   메신저 + 공유 캘린더 결합형 SaaS UI
   ========================================================================= */

const CSS = `
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css");

.teum, .teum * {
  box-sizing: border-box;
  font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  letter-spacing: -0.3px;
  margin: 0;
  padding: 0;
}

.teum {
  --bg: #ffffff;
  --bg-solid: #ffffff;
  --bg-subtle: #fafafb;
  --bg-panel: #f7f8fa;
  --bg-hover: #f2f3f6;
  --bg-active: #e8eaee;
  --border: #e6e8ec;
  --border-2: #d5d8de;
  --text: #111214;
  --text-2: #636870;
  --text-3: #a2a8b0;
  --icon: #111214;
  --key: #05d560;
  --key-press: #04bc55;
  --key-soft: #edfbf4;
  --key-line: #c2f0d6;
  --neutral-soft: #f0f1f4;
  --neutral-line: #d5d8de;
  --radius: 12px;
  --radius-lg: 16px;
  --shadow-sm: none;
  --shadow-md: 0 4px 20px rgba(16,24,40,.09);
  --shadow-lg: 0 16px 48px rgba(16,24,40,.14);
  /* glass tokens — 화이트/다크에서는 불투명(blur 없음), 글래스 테마에서만 활성화 */
  --glass-bg: var(--bg);
  --glass-border: var(--border);
  --glass-blur: none;
  --app-bg: var(--bg-subtle);

  position: absolute;
  inset: 0;
  display: flex;
  background: var(--app-bg);
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
  overflow: clip;
  -webkit-font-smoothing: antialiased;
}

/* ── 글래스모피즘 테마 ── */
.teum.glass {
  /* 텍스트: 채도 낮춰서 glass 위에서 자연스럽게 */
  --text: #0d1f18;
  --text-2: #3a5a4e;
  --text-3: #6b8c7e;
  --icon: #1a3028;

  /* 배경 레이어: 이미지2처럼 점점 밝아지는 depth */
  --bg-solid: #ffffff;
  --bg: rgba(255,255,255,0.72);          /* 패널/카드 기본 */
  --bg-subtle: rgba(240,247,244,0.55);   /* 리스트 행 등 최하단 */
  --bg-panel: rgba(245,251,248,0.60);
  --bg-hover: rgba(255,255,255,0.82);    /* hover → 더 밝게 떠오름 */
  --bg-active: rgba(255,255,255,0.92);

  /* 테두리: 얇고 밝은 상단 하이라이트 느낌 */
  --border: rgba(255,255,255,0.65);
  --border-2: rgba(200,220,212,0.70);

  /* 액센트 */
  --key-soft: rgba(5,213,96,.13);
  --key-line: rgba(5,213,96,.30);
  --neutral-soft: rgba(255,255,255,0.55);
  --neutral-line: rgba(180,210,198,0.50);

  /* 그림자: inset 상단 하이라이트가 핵심 (레퍼런스 이미지2) */
  --shadow-sm: 0 2px 8px rgba(10,40,25,.06), inset 0 1px 0 rgba(255,255,255,.90);
  --shadow-md: 0 8px 24px rgba(10,40,25,.10), inset 0 1px 0 rgba(255,255,255,.85);
  --shadow-lg: 0 20px 48px rgba(10,40,25,.15), inset 0 1px 0 rgba(255,255,255,.80);

  /* glass 표면 */
  --glass-bg: rgba(255,255,255,0.58);
  --glass-border: rgba(255,255,255,0.75);
  --glass-blur: blur(28px) saturate(1.8) brightness(1.02);

  /* 앱 배경: 이미지2처럼 서늘한 청녹 그라디언트 */
  --app-bg:
    radial-gradient(ellipse 90% 70% at 15% 0%,   rgba(5,213,96,.12) 0%, transparent 50%),
    radial-gradient(ellipse 70% 60% at 85% 90%,  rgba(5,180,130,.10) 0%, transparent 50%),
    radial-gradient(ellipse 55% 45% at 50% 50%,  rgba(180,240,210,.06) 0%, transparent 60%),
    linear-gradient(160deg, #e8f5ef 0%, #dff0ea 40%, #e4f4f0 100%);
}

.teum.dark {
  --bg: #131618;
  --bg-solid: #131618;
  --bg-subtle: #0e1112;
  --bg-panel: #16191b;
  --bg-hover: #21262a;
  --bg-active: #2a3034;
  --border: #2c3136;
  --border-2: #363c42;
  --text: #f1f3f5;
  --text-2: #a8afb6;
  --text-3: #6d747b;
  --icon: #e6eaed;
  --key-soft: rgba(5,213,96,.13);
  --key-line: rgba(5,213,96,.28);
  --neutral-soft: #21262a;
  --neutral-line: #343b40;
  --shadow-sm: none;
  --shadow-md: 0 6px 24px rgba(0,0,0,.5);
  --shadow-lg: 0 18px 48px rgba(0,0,0,.65);
  --glass-bg: var(--bg);
  --glass-border: var(--border);
  --glass-blur: none;
  --app-bg: var(--bg-subtle);
}

/* ── 다크 + 글래스 조합 (글래스 테마의 어두운 변형은 별도 제공하지 않지만, 안전하게 정의) ── */
.teum.glass.dark {
  --bg: rgba(18,26,22,0.80);
  --bg-solid: #0f1a15;
  --bg-subtle: rgba(12,20,16,0.60);
  --bg-hover: rgba(255,255,255,0.07);
  --bg-active: rgba(255,255,255,0.12);
  --border: rgba(255,255,255,0.10);
  --border-2: rgba(255,255,255,0.16);
  --glass-bg: rgba(18,28,22,0.62);
  --glass-border: rgba(255,255,255,0.10);
  --glass-blur: blur(28px) saturate(1.6);
  --shadow-sm: 0 2px 8px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.08);
  --shadow-md: 0 8px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.07);
  --shadow-lg: 0 24px 60px rgba(0,0,0,.50), inset 0 1px 0 rgba(255,255,255,.06);
  --app-bg:
    radial-gradient(ellipse 70% 55% at 15% 15%, rgba(5,213,96,.07) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 85% 80%, rgba(5,180,130,.05) 0%, transparent 50%),
    #091310;
}

.teum button { font: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.teum input, .teum textarea { font: inherit; color: inherit; outline: none; border: none; background: none; }
.teum ::placeholder { color: var(--text-3); }
.teum ::-webkit-scrollbar { width: 6px; height: 6px; }
.teum ::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 6px; }
.teum ::-webkit-scrollbar-thumb:hover { background: var(--text-3); }

/* ━━━ 전역 애니메이션 시스템 ━━━ */

/* 모든 버튼 — 클릭 시 살짝 눌리는 피드백 */
.teum button:active:not(:disabled) { transform: scale(.96); }
.teum .iconbtn:active { transform: scale(.88); }
.teum .railbtn:active { transform: scale(.92); }

/* keyframes */
@keyframes slideInRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes slideInUp    { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes popIn        { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
@keyframes fadeIn       { from { opacity: 0; } to { opacity: 1; } }
@keyframes pulse-dot    { 0%,100% { transform: scale(1); opacity: 1; } }

/* 상세 패널 — 오른쪽에서 슬라이드 */
.detail { animation: slideInRight .22s cubic-bezier(.22,.8,.28,1); }

/* 모달 — 팝인 */
.modal, .iss-compose, .floatchat { animation: popIn .18s cubic-bezier(.22,.8,.28,1); }

/* 드롭다운 */
.iss-chip-drop { animation: slideInUp .14s cubic-bezier(.22,.8,.28,1); }

/* 카드 그리드 stagger */
.idea-grid .idea-card { animation: slideInUp .22s cubic-bezier(.22,.8,.28,1) both; }
.idea-grid .idea-card:nth-child(2) { animation-delay: .04s; }
.idea-grid .idea-card:nth-child(3) { animation-delay: .08s; }
.idea-grid .idea-card:nth-child(4) { animation-delay: .12s; }
.idea-grid .idea-card:nth-child(n+5) { animation-delay: .16s; }

/* 이슈 리스트 행 stagger */
.iss-row { animation: slideInUp .18s cubic-bezier(.22,.8,.28,1) both; }
.grp:nth-child(2) .iss-row { animation-delay: .04s; }
.grp:nth-child(3) .iss-row { animation-delay: .08s; }
.grp:nth-child(4) .iss-row { animation-delay: .12s; }

/* 보드 카드 */
.bcard { animation: slideInUp .18s cubic-bezier(.22,.8,.28,1) both; }

/* 아카이브 카드 */
.arch-card { animation: slideInUp .2s cubic-bezier(.22,.8,.28,1) both; }
.arch-card:nth-child(2) { animation-delay: .05s; }

/* 홈 카드 */
.card { animation: slideInUp .2s cubic-bezier(.22,.8,.28,1) both; }

/* 채팅 메시지 */
.msg { animation: slideInUp .15s cubic-bezier(.22,.8,.28,1) both; }

/* 패널 행 */
.row { transition: background .12s ease, transform .1s ease; }
.row:active { transform: scale(.98); }

/* 탭바 active indicator */
.railbtn { transition: background .18s ease, color .18s ease, transform .14s cubic-bezier(.22,.8,.28,1); }
.railbtn.on { animation: popIn .2s cubic-bezier(.22,.8,.28,1); }

/* 사이클 링 애니메이션 */
.cycle-ring .fill { transition: stroke-dashoffset .7s cubic-bezier(.22,.8,.28,1); }

/* presence dot pulse */
.presence.on { }

/* 분담 바 세그먼트 */
.share-seg { transition: width .6s cubic-bezier(.22,.8,.28,1); }

/* 이미지 hover */
.ic-img-thumb { transition: transform .18s ease; }
.ic-img-thumb:hover { transform: scale(1.04); }

/* 아이디어 카드 hover */
.idea-card { transition: transform .18s cubic-bezier(.22,.8,.28,1), box-shadow .2s ease, border-color .15s; }

/* 입력 포커스 */
.field input:focus, .field textarea:focus, .iss-compose-title:focus, .iss-compose-desc:focus {
  transition: border-color .18s ease, box-shadow .18s ease;
}

/* 토스트 */
@keyframes toastOut { to { opacity: 0; transform: translateX(-50%) translateY(10px); } }

/* 뷰 전환 페이드 */
.fade { animation: fade .24s cubic-bezier(.22,.8,.28,1); }
@keyframes fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

/* ══ 글래스모피즘 테마: 레이어드 frosted glass ══
   depth 순서: 배경 → rail/panel(blur) → card(blur+shadow) → button(밝은white) → input(흰)
   상단 inset 하이라이트(rgba white)가 유리 느낌의 핵심
*/

/* ① 사이드바 / 패널 / 상단바: 기본 frosted layer */
.teum.glass .rail,
.teum.glass .panel,
.teum.glass .topbar,
.teum.glass .iss-head {
  background: rgba(255,255,255,0.52);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-color: rgba(255,255,255,0.70);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.90), 1px 0 0 rgba(255,255,255,.45);
}

/* ② 메인 / 스크롤 영역: 완전 투명 */
.teum.glass .main { background: transparent; }
.teum.glass .home-root,
.teum.glass .iss-scroll,
.teum.glass .archive-scroll,
.teum.glass .idea-scroll,
.teum.glass .cal-grid { background: transparent; }

/* ③ 카드/이벤트: 패널보다 밝은 frosted, 상단 하이라이트 + 부드러운 shadow */
.teum.glass .card,
.teum.glass .idea-card,
.teum.glass .arch-summary,
.teum.glass .arch-card,
.teum.glass .arch-list,
.teum.glass .ref-card,
.teum.glass .ev-card,
.teum.glass .inline-brief,
.teum.glass .arch-cycle-banner {
  background: rgba(255,255,255,0.68);
  backdrop-filter: blur(16px) saturate(1.6);
  -webkit-backdrop-filter: blur(16px) saturate(1.6);
  border-color: rgba(255,255,255,0.80);
  box-shadow: 0 4px 20px rgba(10,40,25,.08), inset 0 1px 0 rgba(255,255,255,.95);
}

/* ④ 모달/명령팔레트/폴카드: 가독성 최우선, 거의 불투명 */
.teum.glass .modal,
.teum.glass .cmd,
.teum.glass .poll-card {
  background: rgba(248,253,251,0.96);
  backdrop-filter: blur(32px) saturate(2);
  -webkit-backdrop-filter: blur(32px) saturate(2);
  border-color: rgba(255,255,255,0.85);
  box-shadow: 0 20px 60px rgba(10,40,25,.16), inset 0 1px 0 rgba(255,255,255,.98);
}

/* ⑤ 상세 패널 */
.teum.glass .detail {
  background: rgba(250,254,252,0.94);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-left-color: rgba(255,255,255,0.70);
}

/* ⑥ 스크림 */
.teum.glass .modal-scrim,
.teum.glass .cmd-scrim,
.teum.glass .scrim {
  background: rgba(8,24,18,.28);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* ⑦ 리스트 행 / 캘린더 셀: 투명 유지 */
.teum.glass .cal-cell { background: transparent; }
.teum.glass .iss-row { background: rgba(255,255,255,0.55); border-bottom-color: rgba(255,255,255,0.40); }
.teum.glass .iss-row:hover { background: rgba(255,255,255,0.78); }
.teum.glass .iss-row .ttl { color: #0d1f18; }
.teum.glass .iss-row .iid { color: #5a7a6e; }
.teum.glass .grp-head { background: rgba(240,248,244,0.72); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.teum.glass .grp-head .nm { color: #0d1f18; }
.teum.glass .grp-head .ct { color: #5a7a6e; }

/* ⑧ 버튼류: 이미지2처럼 하얀 유리 버튼 — inset 하이라이트가 핵심 */
.teum.glass .railbtn {
  background: transparent;
}
.teum.glass .railbtn:hover {
  background: rgba(255,255,255,0.70);
  box-shadow: 0 2px 8px rgba(10,40,25,.08), inset 0 1px 0 rgba(255,255,255,.95);
}
.teum.glass .railbtn.on {
  background: rgba(255,255,255,0.82);
  box-shadow: 0 2px 12px rgba(10,40,25,.10), inset 0 1px 0 rgba(255,255,255,.98);
  color: var(--text);
}
.teum.glass .railbtn.on svg { color: var(--text); }

.teum.glass .iconbtn:hover {
  background: rgba(255,255,255,0.72);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.95);
}

.teum.glass .addbtn {
  background: rgba(255,255,255,0.58);
  border-color: rgba(255,255,255,0.72);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.90);
}
.teum.glass .addbtn:hover {
  background: rgba(255,255,255,0.80);
  box-shadow: 0 2px 8px rgba(10,40,25,.08), inset 0 1px 0 rgba(255,255,255,.98);
}

/* ⑨ iss-chip: 유리 버튼 스타일 */
.teum.glass .iss-chip {
  background: rgba(255,255,255,0.72);
  border: 1px solid rgba(255,255,255,0.80);
  box-shadow: 0 1px 4px rgba(10,40,25,.06), inset 0 1px 0 rgba(255,255,255,.95);
  color: var(--text-2);
}
.teum.glass .iss-chip:hover {
  background: rgba(255,255,255,0.90);
  box-shadow: 0 2px 8px rgba(10,40,25,.08), inset 0 1px 0 rgba(255,255,255,.98);
  color: var(--text);
}
.teum.glass .iss-chip-drop {
  background: rgba(250,253,252,0.97);
  border-color: rgba(255,255,255,0.85);
  box-shadow: 0 12px 40px rgba(10,40,25,.14), inset 0 1px 0 rgba(255,255,255,.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* ⑩ 세그먼트/옵션 버튼 */
.teum.glass .poll-date-opt,
.teum.glass .typepick button,
.teum.glass .theme-opt,
.teum.glass .statuspick button {
  background: rgba(255,255,255,0.72);
  border-color: rgba(255,255,255,0.80);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.90);
}
/* 선택된 상태 — glass 흰색 오버라이드보다 specificity 높게 */
.teum.glass .poll-date-opt.on { background: var(--key) !important; border-color: var(--key) !important; color: #fff !important; box-shadow: 0 2px 8px rgba(5,213,96,.30); }
.teum.glass .typepick button.on { background: var(--key) !important; border-color: var(--key) !important; color: #fff !important; box-shadow: 0 2px 8px rgba(5,213,96,.30); }
.teum.glass .statuspick button.on { background: var(--key) !important; border-color: var(--key) !important; color: #fff !important; box-shadow: 0 2px 8px rgba(5,213,96,.30); }
.teum.glass .poll-preview-hint,
.teum.glass .arch-card-foot {
  background: rgba(255,255,255,0.55);
}
.teum.glass .modal-foot .ghost {
  background: rgba(255,255,255,0.75);
  border-color: rgba(200,220,212,.60);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.90);
}
.teum.glass .cmd-shortcut.set {
  background: rgba(255,255,255,0.80);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.95);
}

/* ⑪ 입력 필드: 가장 밝고 또렷하게 */
.teum.glass .field input,
.teum.glass .field textarea,
.teum.glass .field select,
.teum.glass .searchbox,
.teum.glass .label-add input,
.teum.glass .cmd-input,
.teum.glass .iss-label-new input,
.teum.glass .brief-textarea,
.teum.glass .composer-box {
  background: rgba(255,255,255,0.90);
  border-color: rgba(255,255,255,0.85);
  box-shadow: inset 0 1px 3px rgba(10,40,25,.04), inset 0 -1px 0 rgba(255,255,255,.70);
}
.teum.glass .field input::placeholder,
.teum.glass .field textarea::placeholder,
.teum.glass .brief-textarea::placeholder { color: #8aaa9c; }

/* ⑫ quick-grid 카드 */
.teum.glass .quick {
  background: rgba(255,255,255,0.60);
  border-color: rgba(255,255,255,0.75);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.90);
}
.teum.glass .quick:hover {
  background: rgba(255,255,255,0.82);
  box-shadow: 0 6px 20px rgba(10,40,25,.10), inset 0 1px 0 rgba(255,255,255,.98);
}

/* ⑬ work-pill (근무 토글) */
.teum.glass .work-pill.on {
  background: rgba(255,255,255,0.80);
  border-color: rgba(5,213,96,.35);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.95);
}

/* ── 타이핑 인디케이터 ── */
.typing-indicator { display: flex; align-items: center; gap: 10px; padding: 6px 10px; }
.typing-dots { display: flex; gap: 4px; align-items: center; }
.typing-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--text-3); display: inline-block; animation: typing-bounce .9s infinite ease-in-out; }
.typing-dots span:nth-child(2) { animation-delay: .18s; }
.typing-dots span:nth-child(3) { animation-delay: .36s; }
@keyframes typing-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-5px); opacity: 1; } }
.typing-who { font-size: 12.5px; color: var(--text-3); font-weight: 500; }

/* ── 이슈 인라인 편집 ── */
.statuspick.readonly button { cursor: default; opacity: .7; }
.statuspick.readonly button:hover { background: transparent; }
.iss-title-input { width: 100%; font-size: 18px; font-weight: 700; color: var(--text); background: var(--bg-subtle); border: 1.5px solid var(--key); border-radius: 9px; padding: 6px 10px; outline: none; margin-bottom: 4px; }
.iss-field-btn { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 7px; border: 1px solid transparent; font-size: 13.5px; font-weight: 500; color: var(--text); background: transparent; transition: background .12s, border-color .12s; cursor: pointer; }
.iss-field-btn:hover { background: var(--bg-hover); border-color: var(--border); }
.iss-dropdown { position: absolute; left: 60px; top: 100%; z-index: 120; background: #fff; border: 1px solid var(--border-2); border-radius: 11px; box-shadow: 0 8px 28px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.10); padding: 5px; min-width: 160px; }
.teum.dark .iss-dropdown { background: #1e2025; }
.iss-dropdown-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 10px; border-radius: 7px; font-size: 13px; font-weight: 500; color: var(--text); transition: background .1s; }
.iss-dropdown-item:hover { background: var(--bg-hover); }
.iss-dropdown-item.on { background: var(--key-soft); color: var(--key); font-weight: 700; }
.iss-label-input { height: 24px; border: none; outline: none; font-size: 12.5px; color: var(--text); background: transparent; min-width: 80px; padding: 0 4px; }
.iss-label-input::placeholder { color: var(--text-3); }
.iss-date-input { border: 1px solid transparent; border-radius: 7px; padding: 3px 6px; font-size: 13.5px; color: var(--text); background: transparent; cursor: pointer; transition: border-color .12s, background .12s; }
.iss-date-input:hover { background: var(--bg-hover); border-color: var(--border); }
.iss-date-input:focus { border-color: var(--key); outline: none; background: var(--bg-subtle); }
.teum.glass .inline-brief-tabs {
  background: transparent;
  border-bottom-color: rgba(255,255,255,0.45);
}

/* ⑮ brief-block */
.teum.glass .brief-block {
  background: rgba(255,255,255,0.72);
  border-color: rgba(255,255,255,0.78);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.90);
}
.teum.glass .brief-block.editing {
  background: rgba(255,255,255,0.90);
  border-color: var(--key-line);
  box-shadow: 0 0 0 3px rgba(5,213,96,.10), inset 0 1px 0 rgba(255,255,255,.98);
}


/* ---------- icon rail ---------- */
.rail {
  width: 72px; flex: 0 0 72px;
  background: var(--bg);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 0 14px; gap: 4px; z-index: 30;
}
.brand {
  width: 40px; height: 40px; border-radius: 12px;
  display: grid; place-items: center;
  margin-bottom: 14px; padding: 0;
  transition: transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s;
  position: relative;
}
.brand svg { border-radius: 0; transition: filter .2s; }
.brand:hover svg { filter: drop-shadow(0 4px 10px rgba(16,24,40,.22)); }
.brand:hover { transform: translateY(-2px); }
.brand-presence { right: -2px; bottom: -2px; width: 11px; height: 11px; }
.railbtn {
  width: 56px; padding: 9px 0 7px; border-radius: 13px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  color: var(--text-2); position: relative;
  transition: background .18s ease, color .18s ease, transform .12s ease;
}
.railbtn svg { width: 21px; height: 21px; stroke-width: 1.9; color: var(--icon); transition: color .18s; }
.railbtn span { font-size: 11px; font-weight: 600; }
.railbtn:hover { background: var(--bg-hover); }
.railbtn:active { transform: scale(.94); }
.railbtn.on { background: var(--neutral-soft); color: var(--text); }
.railbtn.on svg { color: var(--text); }
.railbadge {
  position: absolute; top: 5px; right: 10px; min-width: 16px; height: 16px;
  padding: 0 4px; border-radius: 9px; background: var(--key); color: #fff;
  font-size: 10px; font-weight: 700; display: grid; place-items: center;
  border: 2px solid var(--bg);
}
.railspacer { flex: 1; }

/* ---------- list panel ---------- */
.panel {
  width: 276px; flex: 0 0 276px;
  background: var(--bg);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; min-height: 0; z-index: 20;
}
.panel-head { padding: 16px 16px 10px; }
.ws-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.ws-name { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; letter-spacing: -0.4px; }
.ws-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--key); }
.my-iss-divider {
  height: 1px; background: var(--text-3); opacity: 0.18;
  margin: 6px 10px;
}
.logo-bar {
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border);
  flex: 0 0 auto;
}
.logo-bar svg {
  height: 18px; width: auto; display: block;
}
/* 다크 테마: 경로를 밝은 색으로 */
.teum.dark .logo-bar svg path { fill: var(--text) !important; }
/* 글래스 테마: 짙은 그린 계열 */
.teum.glass .logo-bar svg path { fill: #0d1f18 !important; }
.teum.glass.dark .logo-bar svg path { fill: var(--text) !important; }
.iconbtn {
  width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center;
  color: var(--text-3); transition: background .13s, color .13s;
}
.iconbtn svg { width: 17px; height: 17px; stroke-width: 1.7; }
.iconbtn:hover { background: var(--bg-hover); color: var(--text); }
.searchbox {
  display: flex; align-items: center; gap: 7px; height: 35px; padding: 0 11px;
  background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 9px;
  transition: border-color .14s;
}
.searchbox:focus-within { border-color: var(--key); box-shadow: 0 0 0 3px var(--key-soft); }
.searchbox svg { width: 15px; height: 15px; color: var(--text-3); stroke-width: 1.7; }
.searchbox input { flex: 1; font-size: 13px; }

.panel-scroll { flex: 1; overflow-y: auto; padding: 6px 8px 16px; min-height: 0; }
.addbtn {
  width: 100%; height: 38px; border-radius: 9px; margin: 4px 0 12px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  background: var(--bg-subtle); color: var(--text-2); font-weight: 600; font-size: 13px;
  transition: background .13s, color .13s;
}
.addbtn svg { width: 15px; height: 15px; stroke-width: 2; }
.addbtn:hover { background: var(--bg-hover); color: var(--text); }
.addbtn-icon { width: 38px; flex: 0 0 38px; }

.sec-label { font-size: 11px; font-weight: 700; color: var(--text-3); padding: 18px 8px 5px; letter-spacing: 0.04em; text-transform: uppercase; }
.sec-label:first-child { padding-top: 8px; }

.row {
  width: 100%; display: flex; align-items: center; gap: 9px;
  padding: 5px 10px; border-radius: 8px; position: relative;
  color: var(--text-2); transition: background .12s, color .12s;
}
.row:hover { background: var(--bg-hover); color: var(--text); }
.row.on { background: var(--bg-hover); color: var(--text); }
.row.on .row-title { font-weight: 600; color: var(--text); }
.row svg.lead { width: 16px; height: 16px; stroke-width: 1.7; color: var(--text-3); flex: 0 0 auto; }
.row-title { font-size: 13.5px; font-weight: 500; flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.row.unread .row-title { font-weight: 700; color: var(--text); }
.row-badge {
  min-width: 17px; height: 17px; padding: 0 5px; border-radius: 9px;
  background: var(--key); color: #fff; font-size: 10.5px; font-weight: 700; display: grid; place-items: center;
}
.avatar {
  width: 28px; height: 28px; border-radius: 8px; flex: 0 0 auto;
  display: grid; place-items: center; font-size: 11.5px; font-weight: 700;
  background: var(--bg-hover); color: var(--text-2); position: relative;
}
.avatar.me { background: var(--neutral-soft); color: var(--text); }
.presence { position: absolute; right: -2px; bottom: -2px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--bg); }
.presence.on { background: var(--key); }
.presence.away { background: #e8a800; }
.presence.off { background: var(--text-3); }

/* upcoming event row */
.ev-row { display: flex; gap: 10px; padding: 9px 10px; border-radius: 9px; transition: background .12s; width: 100%; text-align: left; align-items: flex-start; }
.ev-row:hover { background: var(--bg-hover); }
.ev-date { flex: 0 0 38px; text-align: center; }
.ev-date .d { font-size: 16px; font-weight: 700; line-height: 1; letter-spacing: -0.5px; }
.ev-date .w { font-size: 10px; color: var(--text-3); font-weight: 600; margin-top: 3px; }
.ev-body { flex: 1; min-width: 0; border-left: 2px solid var(--key); padding-left: 10px; }
.ev-body.gray { border-color: var(--text-3); }
.ev-title { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ev-time { font-size: 11.5px; color: var(--text-2); margin-top: 2px; }

/* ---------- main ---------- */
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--bg-subtle); position: relative; }
.topbar {
  height: 56px; flex: 0 0 56px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 12px; padding: 0 20px;
  background: var(--bg);
}
.topbar .back { display: none; }
.close-x { display: none; }
.top-title { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; letter-spacing: -0.4px; }
.top-title svg { width: 17px; height: 17px; color: var(--text-2); stroke-width: 1.7; }
.top-sub { font-size: 12px; color: var(--text-3); margin-left: 2px; }
.top-actions { margin-left: auto; display: flex; gap: 4px; }

.fade { animation: fade .28s cubic-bezier(.2,.7,.2,1); }

/* ---------- chat ---------- */
.chat-scroll { flex: 1; overflow-y: auto; padding: 18px 26px 8px; min-height: 0; display: flex; flex-direction: column; }
.day-div { display: flex; align-items: center; gap: 12px; margin: 18px 0 14px; }
.day-div::before, .day-div::after { content: ""; flex: 1; height: 1px; background: var(--border); }
.day-div span { font-size: 12px; font-weight: 700; color: var(--text-2); background: var(--bg-hover); padding: 3px 12px; border-radius: 20px; }

.msg { display: flex; gap: 12px; padding: 7px 10px; border-radius: 12px; position: relative; transition: background .14s; }
.msg:hover { background: var(--bg-subtle); }
.msg .ava { width: 38px; height: 38px; border-radius: 11px; flex: 0 0 auto; display: grid; place-items: center; font-size: 13px; font-weight: 700; background: var(--bg-hover); color: var(--text-2); }
.msg .ava.me { background: var(--neutral-soft); color: var(--text); }
.msg.cont .ava { visibility: hidden; height: 0; }
.msg-body { flex: 1; min-width: 0; }
.msg-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
.msg-name { font-size: 14px; font-weight: 700; }
.msg-time { font-size: 11.5px; color: var(--text-3); }
.msg-text { font-size: 14px; color: var(--text); line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
.msg-actions {
  position: absolute; top: -14px; right: 14px; display: flex; gap: 2px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
  padding: 3px; box-shadow: var(--shadow-sm); opacity: 0; transform: translateY(4px);
  transition: opacity .15s, transform .15s; pointer-events: none;
}
.msg:hover .msg-actions { opacity: 1; transform: none; pointer-events: auto; }
.msg-actions button { width: 28px; height: 28px; border-radius: 7px; display: grid; place-items: center; color: var(--icon); transition: background .14s; }
.msg-actions button svg { width: 15px; height: 15px; }
.msg-actions button:hover { background: var(--bg-hover); }

.reacts { display: flex; gap: 6px; margin-top: 7px; }
.react { display: flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px; border-radius: 20px; background: var(--bg-subtle); border: 1px solid var(--border); font-size: 12px; font-weight: 600; transition: border-color .14s, background .14s; }
.react:hover { border-color: var(--border-2); }
.react.mine { background: var(--bg-active); border-color: var(--border-2); color: var(--text); }
.react-pick-wrap { position: relative; }
.react-pick { position: absolute; bottom: 34px; right: 0; display: flex; gap: 2px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 5px; box-shadow: var(--shadow-md); z-index: 50; }
.react-pick button { width: 30px; height: 30px; border-radius: 7px; font-size: 17px; display: grid; place-items: center; transition: background .12s; }
.react-pick button:hover { background: var(--bg-hover); }
.ev-card-foot button.attended { color: var(--key); font-weight: 700; }

/* embedded event card inside chat (the integration) */
.ev-card {
  margin-top: 9px; max-width: 380px; border: 1px solid var(--border-2); border-radius: 14px;
  overflow: hidden; background: var(--bg); box-shadow: var(--shadow-sm); transition: box-shadow .18s, transform .14s;
}
.ev-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.ev-card-top { display: flex; gap: 12px; padding: 14px 16px; }
.ev-card-cal { flex: 0 0 46px; border-radius: 11px; overflow: hidden; border: 1px solid var(--border); text-align: center; }
.ev-card-cal .m { background: var(--key); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 0; }
.ev-card-cal .d { font-size: 20px; font-weight: 800; padding: 5px 0 6px; }
.ev-card-info { flex: 1; min-width: 0; }
.ev-card-info .t { font-size: 14.5px; font-weight: 700; }
.ev-card-info .meta { font-size: 12.5px; color: var(--text-2); margin-top: 4px; display: flex; align-items: center; gap: 6px; }
.ev-card-info .meta svg { width: 13px; height: 13px; }
.ev-card-foot { display: flex; border-top: 1px solid var(--border); }
.ev-card-foot button { flex: 1; height: 42px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text); transition: background .14s; }
.ev-card-foot button svg { width: 15px; height: 15px; }
.ev-card-foot button:hover { background: var(--bg-hover); }
.ev-card-foot button + button { border-left: 1px solid var(--border); color: var(--text-2); }
.ev-card-foot button + button:hover { background: var(--bg-hover); color: var(--text); }

/* mention reference card (idea/issue/event linked from discussion) */
.ref-card {
  margin-top: 9px; max-width: 380px; display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border: 1px solid var(--border-2); border-radius: 14px;
  background: var(--bg); box-shadow: var(--shadow-sm); cursor: pointer;
  transition: box-shadow .18s, transform .14s, border-color .14s;
}
.ref-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); border-color: var(--text-3); }
.ref-icon { width: 36px; height: 36px; border-radius: 11px; flex: 0 0 auto; display: grid; place-items: center; background: var(--neutral-soft); color: var(--text); }
.ref-icon svg { width: 18px; height: 18px; }
.ref-body { flex: 1; min-width: 0; }
.ref-tag { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: .02em; }
.ref-title { font-size: 14px; font-weight: 700; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ref-sub { font-size: 12.5px; color: var(--text-2); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ref-arrow { width: 16px; height: 16px; color: var(--text-3); flex: 0 0 auto; }

/* composer */
.composer { padding: 12px 22px 18px; }
.composer-box {
  border: 1px solid var(--border-2); border-radius: 16px; background: var(--bg);
  transition: border-color .18s, box-shadow .18s; box-shadow: var(--shadow-sm);
}
.composer-box.focus { border-color: var(--key); box-shadow: 0 0 0 3px var(--key-soft); }
.composer textarea { width: 100%; padding: 14px 16px 4px; font-size: 14px; resize: none; line-height: 1.5; max-height: 140px; }
.composer-foot { display: flex; align-items: center; gap: 4px; padding: 6px 10px 10px; }
.composer-foot .iconbtn svg { width: 19px; height: 19px; }
.emoji-wrap { position: relative; }
.emoji-pop { position: absolute; bottom: 38px; left: 0; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 10px; box-shadow: var(--shadow-md); display: none; flex-wrap: wrap; width: 200px; gap: 4px; z-index: 100; }
.emoji-wrap:hover .emoji-pop, .emoji-wrap:focus-within .emoji-pop { display: flex; }
.emoji-pop button { width: 32px; height: 32px; font-size: 19px; border-radius: 8px; display: grid; place-items: center; transition: background .12s; }
.emoji-pop button:hover { background: var(--bg-hover); }
.toast { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); background: var(--text); color: var(--bg); font-size: 13px; font-weight: 700; padding: 10px 20px; border-radius: 12px; white-space: nowrap; z-index: 200; animation: toastin .22s cubic-bezier(.22,.8,.28,1); pointer-events: none; }
@keyframes toastin { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* ── 알림 뱃지 / 드롭다운 ── */
.notif-badge {
  position: absolute; top: -2px; right: -2px; min-width: 16px; height: 16px; padding: 0 4px;
  border-radius: 999px; background: #e8473e; color: #fff; font-size: 10px; font-weight: 800;
  display: grid; place-items: center; line-height: 1; box-shadow: 0 0 0 2px var(--bg);
}
.notif-scrim { position: fixed; inset: 0; z-index: 290; background: transparent; }
.notif-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0; width: 320px; max-height: 420px;
  background: var(--glass-bg); border: 1px solid var(--glass-border); backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 300; overflow: hidden;
  display: flex; flex-direction: column; animation: toastin .16s cubic-bezier(.22,.8,.28,1);
}
.notif-dropdown-head {
  display: flex; align-items: center; justify-content: space-between; padding: 12px 14px;
  border-bottom: 1px solid var(--border); font-size: 13.5px; font-weight: 700; flex: 0 0 auto;
}
.notif-markall { font-size: 12px; font-weight: 700; color: var(--key); padding: 4px 8px; border-radius: 7px; transition: background .12s; }
.notif-markall:hover { background: var(--key-soft); }
.notif-dropdown-list { overflow-y: auto; padding: 6px; }
.notif-dropdown-item {
  display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 9px 8px;
  border-radius: 10px; transition: background .12s; position: relative;
}
.notif-dropdown-item:hover { background: var(--bg-hover); }
.notif-dropdown-item .ttl { font-size: 13px; font-weight: 700; }
.notif-dropdown-item .tm { font-size: 12px; color: var(--text-2); margin-top: 2px; }
.notif-dropdown-item.unread::before {
  content: ""; position: absolute; left: -1px; top: 50%; transform: translateY(-50%);
  width: 6px; height: 6px; border-radius: 999px; background: var(--key);
}
.notif-dropdown-item.unread { background: var(--key-soft); }
.notif-item.unread .ttl { color: var(--key-press); }

.join-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 2px; }
.send {
  margin-left: auto; width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center;
  background: var(--bg-hover); color: var(--text-3); transition: background .16s, color .16s, transform .12s;
}
.send svg { width: 18px; height: 18px; }
.send.ready { background: var(--text); color: var(--bg); }
.send.ready:hover { background: var(--text-2); }
.send.ready:active { transform: scale(.92); }

/* ---------- calendar ---------- */
.cal-head { display: flex; align-items: center; gap: 14px; padding: 18px 24px 14px; flex-wrap: wrap; }
.cal-month { font-size: 21px; font-weight: 800; min-width: 140px; }
.navgrp { display: flex; gap: 2px; }
.todaybtn { height: 34px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--border-2); font-size: 13px; font-weight: 700; transition: background .15s, border-color .15s; }
.todaybtn:hover { background: var(--bg-hover); border-color: var(--text-3); }
.segwrap { display: flex; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 11px; padding: 3px; }
.seg { height: 30px; padding: 0 16px; border-radius: 8px; font-size: 13px; font-weight: 700; color: var(--text-2); transition: all .16s; }
.seg.on { background: var(--bg); color: var(--text); box-shadow: var(--shadow-sm); }

.cal-grid { flex: 1; display: flex; flex-direction: column; padding: 0 24px 22px; min-height: 0; }
.cal-dow { display: grid; grid-template-columns: repeat(7,1fr); border-bottom: 1px solid var(--border); }
.cal-dow div { padding: 8px 4px; font-size: 12px; font-weight: 700; color: var(--text-2); text-align: left; }
.cal-dow div.sun { color: #d65a5a; }
.cal-body { flex: 1; display: grid; grid-auto-rows: 1fr; min-height: 0; }
.cal-week { display: grid; grid-template-columns: repeat(7,1fr); border-bottom: 1px solid var(--border); }
.cal-cell {
  border-right: 1px solid var(--border); padding: 7px 7px 5px; min-height: 0; overflow: hidden;
  display: flex; flex-direction: column; gap: 4px; transition: background .15s; text-align: left;
}
.cal-cell:last-child { border-right: none; }
.cal-cell:hover { background: var(--bg-subtle); }
.cal-cell.out { background: var(--bg-subtle); }
.cal-cell.out .cell-num { color: var(--text-3); }
.cell-num-row { display: flex; align-items: center; justify-content: space-between; }
.cell-num { font-size: 13px; font-weight: 700; width: 26px; height: 24px; display: grid; place-items: center; border-radius: 8px; }
.cell-num.sun { color: #d65a5a; }
.cell-num.today { background: var(--key); color: #fff; box-shadow: 0 3px 10px rgba(5,213,96,.4); }
.cell-add { width: 22px; height: 22px; border-radius: 7px; display: grid; place-items: center; color: var(--text-3); opacity: 0; transition: opacity .14s, background .14s, color .14s; }
.cell-add svg { width: 14px; height: 14px; }
.cal-cell:hover .cell-add { opacity: 1; }
.cell-add:hover { background: var(--neutral-soft); color: var(--text); }
.chip {
  display: flex; align-items: center; gap: 6px; height: 22px; padding: 0 8px; border-radius: 7px;
  font-size: 11.5px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  background: var(--neutral-soft); color: var(--text); transition: transform .12s, filter .14s; flex: 0 0 auto;
}
.chip:hover { filter: brightness(.97); transform: translateX(1px); }
.chip.gray { background: var(--bg-hover); color: var(--text-2); }
.chip[style*="--chip-c"] { background: color-mix(in srgb, var(--chip-c) 14%, transparent); color: var(--text); }
.chip .cdot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: 0 0 auto; }
.chip-more { font-size: 11px; font-weight: 700; color: var(--text-3); padding: 0 8px; text-align: left; }

/* 캘린더 이슈 데드라인 칩 — 이슈 목록과 동일한 흰색 배경 스타일 */
.chip-issue {
  display: flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px; border-radius: 7px;
  font-size: 11.5px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  background: var(--bg); color: var(--text); border: 1px solid var(--border-2);
  transition: transform .12s, background .12s, color .12s; flex: 0 0 auto; cursor: pointer;
}
.chip-issue:hover { background: var(--bg-hover); transform: translateX(1px); }
.chip-issue svg { width: 10px; height: 10px; flex: 0 0 auto; color: var(--text); stroke-width: 2.2; }
.teum.dark .chip-issue { background: var(--bg-panel); border-color: var(--border-2); color: var(--text); }
.teum.dark .chip-issue svg { color: var(--text); }
.teum.glass .chip-issue { background: rgba(255,255,255,0.82); border-color: rgba(255,255,255,0.70); color: var(--text); box-shadow: inset 0 1px 0 rgba(255,255,255,.95); }
.teum.glass .chip-issue svg { color: var(--text); }

/* full-screen detail overlay (rail stays visible) */
.scrim { position: absolute; top: 0; left: 72px; right: 0; bottom: 0; background: rgba(16,24,40,.28); opacity: 0; animation: scrimin .2s forwards; z-index: 40; }
@keyframes scrimin { to { opacity: 1; } }
.detail {
  position: absolute; top: 0; left: 72px; right: 0; bottom: 0;
  background: var(--bg);
  z-index: 41; display: flex; flex-direction: column; opacity: 0; transform: translateY(10px); animation: panelin .26s cubic-bezier(.2,.8,.2,1) forwards;
}
@keyframes panelin { to { opacity: 1; transform: none; } }
.detail-inner { max-width: 720px; width: 100%; margin: 0 auto; }
.detail-head { display: flex; align-items: center; padding: 18px 28px; border-bottom: 1px solid var(--border); flex: 0 0 auto; }
.detail-head .tag { font-size: 12px; font-weight: 700; color: var(--text); background: var(--neutral-soft); padding: 4px 10px; border-radius: 8px; }
.detail-head .tag.gray { color: var(--text-2); background: var(--bg-hover); }
.detail-scroll { flex: 1; overflow-y: auto; padding: 28px 28px 32px; }
.detail h2 { font-size: 20px; font-weight: 700; line-height: 1.35; margin-bottom: 16px; letter-spacing: -0.4px; color: var(--text); }
.detail-line { display: flex; gap: 13px; padding: 11px 0; align-items: flex-start; }
.detail-line svg { width: 18px; height: 18px; color: var(--text-2); flex: 0 0 auto; margin-top: 1px; }
.detail-line .k { font-size: 12px; color: var(--text-3); font-weight: 600; }
.detail-line .v { font-size: 14px; font-weight: 600; margin-top: 2px; }
.att-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.att { display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 12px 0 6px; border-radius: 20px; background: var(--bg-subtle); border: 1px solid var(--border); font-size: 13px; font-weight: 600; }
.att svg { border-radius: 6px; }
.att .a { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 700; background: var(--bg-hover); color: var(--text-2); }
.detail-foot { padding: 16px 28px; border-top: 1px solid var(--border); display: flex; gap: 8px; flex: 0 0 auto; }

/* ===== Brief Editor ===== */
.brief-editor { display: flex; flex-direction: column; }
.brief-editor .detail-head { flex: 0 0 auto; }
.brief-editor > div:nth-child(2) { flex: 1; min-height: 0; }

/* 왼쪽 섹션 탭 */
.brief-tabs { width: 170px; flex: 0 0 170px; border-right: 1px solid var(--border); padding: 18px 10px; display: flex; flex-direction: column; gap: 4px; background: var(--bg-subtle); }
.brief-tab { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; text-align: left; transition: background .13s; width: 100%; position: relative; }
.brief-tab:hover { background: var(--bg-hover); }
.brief-tab.on { background: var(--bg); box-shadow: 0 1px 4px rgba(0,0,0,.07); }
.brief-tab.on .brief-tab-label { font-weight: 800; color: var(--text); }
.brief-tab-emoji { width: 28px; height: 28px; flex: 0 0 auto; display: grid; place-items: center; color: var(--text-2); }
.brief-tab-emoji svg { width: 18px; height: 18px; }
.brief-tab.on .brief-tab-emoji svg { color: var(--text); }
.brief-tab-label { font-size: 13.5px; font-weight: 600; color: var(--text-2); }
.brief-live-dot { position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: var(--key); animation: pulse 1.4s infinite; border: 2px solid var(--bg-subtle); }

/* 겹친 아바타 presence 표시 */
.brief-presence { display: flex; align-items: center; gap: 9px; }
.brief-presence-avatars { display: flex; align-items: center; }
.brief-presence-ava {
  width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
  position: relative; overflow: visible;
  border: 2px solid var(--bg); margin-left: -8px;
}
.brief-presence-ava svg { border-radius: 50%; }
.brief-presence-ava:first-child { margin-left: 0; }
.brief-presence-dot {
  position: absolute; right: -1px; bottom: -1px; width: 8px; height: 8px;
  border-radius: 50%; background: var(--key); border: 2px solid var(--bg);
  animation: pulse 1.4s infinite;
}
.brief-presence-label { font-size: 12px; font-weight: 700; color: var(--text-2); white-space: nowrap; }

/* 메인 콘텐츠 */
.brief-content { flex: 1; overflow-y: auto; padding: 28px 32px 32px; min-height: 0; }
.brief-section-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.brief-section-emoji { width: 48px; height: 48px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-subtle); flex: 0 0 auto; margin-top: 2px; display: grid; place-items: center; color: var(--text); }
.brief-section-emoji svg { width: 24px; height: 24px; }
.brief-section-title { font-size: 22px; font-weight: 800; }
.brief-section-desc { font-size: 13.5px; color: var(--text-3); margin-top: 5px; line-height: 1.5; }
.brief-editing-badge { margin-left: auto; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--key); background: var(--key-soft); padding: 5px 10px; border-radius: 20px; flex: 0 0 auto; white-space: nowrap; }

/* 블록 */
.brief-blocks { display: flex; flex-direction: column; gap: 12px; }
.brief-block { border: 1px solid var(--border); border-radius: 8px; background: var(--bg); transition: border-color .15s, box-shadow .15s; }
.brief-block:hover { border-color: var(--border-2); }
.brief-block.editing { border-color: var(--key-line); box-shadow: 0 0 0 3px var(--key-soft); }
.brief-block-body { padding: 12px 14px 8px; }
.brief-textarea {
  width: 100%; min-height: 80px; font-size: 15px; line-height: 1.7;
  color: var(--text); background: transparent; resize: none;
  font-family: inherit; border: none; outline: none;
}
.brief-text { font-size: 14px; line-height: 1.65; color: var(--text); cursor: text; min-height: 28px; white-space: pre-wrap; }
.brief-text.empty { color: var(--text-3); font-style: italic; }
.brief-block-meta { display: flex; align-items: center; gap: 6px; padding: 4px 14px 8px; }
.brief-editor-tag { font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
.brief-meta-time { font-size: 11.5px; color: var(--text-3); font-weight: 600; }
.brief-del-btn { margin-left: auto; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; color: var(--text-3); opacity: 0; transition: opacity .13s, background .13s; }
.brief-block:hover .brief-del-btn { opacity: 1; }
.brief-del-btn:hover { background: var(--bg-hover); color: var(--text); }
.brief-add-block { display: flex; align-items: center; gap: 6px; padding: 8px 4px; border-radius: 8px; width: 100%; text-align: left; color: var(--text-3); font-size: 12.5px; font-weight: 600; border: none; transition: color .13s; margin-top: 4px; }
.brief-add-block:hover { color: var(--key); }

/* 편집 기록 사이드바 */
.brief-log { width: 240px; flex: 0 0 240px; border-left: 1px solid var(--border); overflow-y: auto; background: var(--bg-subtle); }
.brief-log-head { font-size: 12px; font-weight: 800; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; padding: 18px 16px 10px; }
.brief-log-list { display: flex; flex-direction: column; }
.brief-log-item { display: flex; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.brief-log-ava { width: 28px; height: 28px; border-radius: 9px; display: grid; place-items: center; flex: 0 0 auto; overflow: hidden; }
.brief-log-ava svg { border-radius: 9px; }
.brief-log-name { font-size: 13px; font-weight: 700; }
.brief-log-action { font-size: 12px; color: var(--text-2); margin-top: 2px; }
.brief-log-time { font-size: 11.5px; color: var(--text-3); margin-top: 3px; font-variant-numeric: tabular-nums; }

/* ===== 인라인 브리프 (아이디어 상세 화면 안에 그대로 펼쳐지는 브리프 섹션) ===== */
.inline-brief { margin: 24px -28px 0; border-top: 1px solid var(--border); background: transparent; overflow: hidden; }
.inline-brief .brief-title-input { font-size: 15px; }
.inline-brief-header { display: flex; align-items: center; gap: 8px; padding: 18px 28px 0; }
.inline-brief-header-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--key-soft); display: grid; place-items: center; flex: 0 0 auto; }
.inline-brief-header-icon svg { width: 14px; height: 14px; color: var(--key); }
.inline-brief-header-title { font-size: 13px; font-weight: 700; color: var(--text); flex: 1; }
.inline-brief-header-sub { font-size: 11.5px; color: var(--text-3); }
.inline-brief-tabs { display: flex; border-bottom: 1px solid var(--border); background: transparent; padding: 0 28px; margin-top: 12px; }
.inline-brief-tab { display: flex; align-items: center; gap: 5px; padding: 8px 12px; font-size: 12.5px; font-weight: 600; color: var(--text-3); background: transparent; border: none; border-bottom: 2px solid transparent; border-radius: 0; transition: color .13s, border-color .13s; margin-bottom: -1px; }
.inline-brief-tab:hover { color: var(--text-2); }
.inline-brief-tab.on { color: var(--key); border-bottom-color: var(--key); font-weight: 700; }
.inline-brief .brief-blocks { margin-top: 0; }
.inline-brief .brief-block { background: transparent; border-radius: 8px; border-color: var(--border); }
.inline-brief .brief-block.editing { background: var(--bg-subtle); }
.inline-brief-body { padding: 16px 28px 20px; }
.inline-brief-linked { display: inline-flex; align-items: center; gap: 5px; margin-top: 12px; font-size: 11.5px; color: var(--text-3); }

.btn-primary { flex: 1; height: 42px; border-radius: 10px; background: var(--key); color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 7px; letter-spacing: -0.3px; transition: background .13s; }
.btn-primary svg { width: 17px; height: 17px; }
.btn-primary:hover { background: var(--key-press); opacity: .95; }

.btn-ghost { width: 42px; height: 42px; border-radius: 10px; border: 1px solid var(--border); display: grid; place-items: center; color: var(--text-2); transition: background .13s, border-color .13s; }
.btn-ghost:hover { background: var(--bg-hover); }
.btn-ghost svg { width: 18px; height: 18px; }

/* ---------- home dashboard ---------- */
.home-root { flex: 1; display: flex; min-height: 0; overflow: hidden; }
.home-scroll { flex: 1; overflow-y: auto; padding: 26px; min-height: 0; }
.greet-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.greet { font-size: 24px; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.6px; }
.greet-sub { font-size: 14px; color: var(--text-2); }

/* ── AI 데일리 브리핑 카드 — 동적 그라데이션 배경 ── */
@keyframes brief-swirl-1 {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
  25% { transform: translate(35%, -32%) scale(1.45) rotate(90deg); border-radius: 60% 40% 30% 70% / 50% 60% 50% 40%; }
  50% { transform: translate(-30%, 28%) scale(0.7) rotate(180deg); border-radius: 30% 70% 50% 50% / 60% 40% 70% 30%; }
  75% { transform: translate(28%, 22%) scale(1.2) rotate(270deg); border-radius: 50% 50% 40% 60% / 40% 60% 50% 50%; }
  100% { transform: translate(0, 0) scale(1) rotate(360deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
}
@keyframes brief-swirl-2 {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 60% 40% 30% 70% / 50% 60% 50% 40%; }
  25% { transform: translate(-38%, 30%) scale(1.5) rotate(-90deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
  50% { transform: translate(34%, -28%) scale(0.65) rotate(-180deg); border-radius: 50% 50% 70% 30% / 30% 70% 40% 60%; }
  75% { transform: translate(-26%, -24%) scale(1.25) rotate(-270deg); border-radius: 70% 30% 50% 50% / 50% 50% 60% 40%; }
  100% { transform: translate(0, 0) scale(1) rotate(-360deg); border-radius: 60% 40% 30% 70% / 50% 60% 50% 40%; }
}
@keyframes brief-swirl-3 {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 30% 70% 50% 50% / 60% 40% 70% 30%; }
  25% { transform: translate(32%, 34%) scale(0.7) rotate(90deg); border-radius: 50% 50% 70% 30% / 30% 70% 40% 60%; }
  50% { transform: translate(-34%, -30%) scale(1.45) rotate(180deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
  75% { transform: translate(30%, -26%) scale(1.1) rotate(270deg); border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%; }
  100% { transform: translate(0, 0) scale(1) rotate(360deg); border-radius: 30% 70% 50% 50% / 60% 40% 70% 30%; }
}
.ai-brief-card {
  display: flex; border-radius: var(--radius-lg);
  border: 1px solid var(--border); overflow: hidden; margin-bottom: 20px;
  position: relative; isolation: isolate; background: #f4fdf8;
 color: #fff; }
/* 움직이는 블롭들 */
.ai-brief-blobs { position: absolute; inset: 0; z-index: -2; overflow: hidden; transform: scaleX(-1); }
.ai-brief-blob { position: absolute; mix-blend-mode: multiply; }
.ai-brief-blob.b1 { top: -40%; left: -8%; width: 45%; padding-bottom: 45%; background: #22cd6d; filter: blur(48px); opacity: .7; animation: brief-swirl-1 9s infinite ease-in-out; }
.ai-brief-blob.b2 { top: -20%; right: -10%; width: 40%; padding-bottom: 40%; background: #38d98a; filter: blur(46px); opacity: .5; animation: brief-swirl-2 11s infinite ease-in-out; }
.ai-brief-blob.b3 { bottom: -50%; left: 10%; width: 42%; padding-bottom: 42%; background: #a3e635; filter: blur(50px); opacity: .45; animation: brief-swirl-3 10s infinite ease-in-out; }
.ai-brief-blob.b4 { bottom: -30%; right: 12%; width: 36%; padding-bottom: 36%; background: #5eead4; filter: blur(52px); opacity: .4; animation: brief-swirl-1 13s infinite reverse ease-in-out; }
/* frosted glass 레이어 — 텍스트 가독성 */
.ai-brief-glass { position: absolute; inset: 0; z-index: -1; background: rgba(255,255,255,.55); backdrop-filter: blur(6px) saturate(1.2); -webkit-backdrop-filter: blur(6px) saturate(1.2); }
.teum.dark .ai-brief-card { background: #0c1612; }
.teum.dark .ai-brief-glass { background: rgba(14,17,18,.62); }

@media (prefers-reduced-motion: reduce) {
  .ai-brief-blob { animation: none !important; }
}
.ai-brief-bar { display: none; }
.ai-brief-body { flex: 1; padding: 20px 24px; min-width: 0; position: relative; z-index: 1; }
.ai-brief-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ai-brief-icon { display: grid; place-items: center; color: var(--text); line-height: 1; }
.ai-brief-icon svg { width: 17px; height: 17px; stroke-width: 2; fill: var(--text); }
.ai-brief-label { font-size: 13px; font-weight: 800; color: var(--text); letter-spacing: -0.2px; }
.ai-brief-badge {
  font-size: 10.5px; font-weight: 900; letter-spacing: .08em;
  background: var(--key); color: #fff; padding: 2px 7px; border-radius: 6px;
}
.ai-brief-live { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: var(--key); margin-left: auto; }
.ai-brief-lines { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.ai-brief-line { letter-spacing: -0.3px;
  font-size: 14.5px; line-height: 1.65; color: var(--text); font-weight: 500;
  opacity: 0; animation: briefFadeIn .4s ease forwards;
}
@keyframes briefFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.ai-brief-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.ai-brief-chip {
  display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 13px;
  border-radius: 11px; border: 1px solid rgba(255,255,255,.5); font-size: 12.5px; font-weight: 700;
  color: #111; background: rgba(255,255,255,.32);
  backdrop-filter: blur(10px) saturate(1.4); -webkit-backdrop-filter: blur(10px) saturate(1.4);
  box-shadow: 0 2px 10px rgba(16,24,40,.06), inset 0 1px 0 rgba(255,255,255,.5);
  transition: all .16s;
  max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ai-brief-chip:hover { background: rgba(255,255,255,.55); border-color: rgba(255,255,255,.8); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(16,24,40,.1), inset 0 1px 0 rgba(255,255,255,.6); }
.ai-brief-chip.urgent { border-color: var(--key-line); color: #111; background: rgba(5,213,96,.14); }
.teum.dark .ai-brief-chip { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.12); color: var(--text); box-shadow: 0 2px 10px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.08); }
.teum.dark .ai-brief-chip:hover { background: rgba(255,255,255,.13); }
.home-chat-panel {
  width: 360px; flex: 0 0 360px; border-left: 1px solid var(--border);
  display: flex; flex-direction: column; background: var(--bg); min-height: 0;
}
.home-chat-head {
  height: 52px; flex: 0 0 52px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 18px; gap: 8px;
}
.home-chat-title { font-size: 14.5px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: var(--text); flex: 1; min-width: 0; }
.home-chat-title svg { color: var(--icon); }
.home-chat-actions { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }
.home-chat-actions .iconbtn { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; color: var(--text-3); transition: background .13s, color .13s; }
.home-chat-actions .iconbtn:hover { background: var(--bg-hover); color: var(--text); }
.home-chat-actions .iconbtn svg { width: 17px; height: 17px; }

/* ── 플로팅 채팅 창 ── */
.floatchat { position: fixed; width: 380px; height: 520px; max-height: 80vh; z-index: 200; display: flex; flex-direction: column; background: var(--bg); border: 1px solid var(--border-2); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; }
.teum.glass .floatchat { background: rgba(252,254,253,0.94); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); }
.floatchat-head { display: flex; align-items: center; gap: 9px; padding: 12px 14px; border-bottom: 1px solid var(--border); cursor: grab; user-select: none; touch-action: none; }
.floatchat-head:active { cursor: grabbing; }
.floatchat-title { font-size: 14px; font-weight: 800; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.floatchat-head .iconbtn { width: 28px; height: 28px; border-radius: 7px; display: grid; place-items: center; color: var(--text-3); flex: 0 0 auto; transition: background .13s, color .13s; }
.floatchat-head .iconbtn:hover { background: var(--bg-hover); color: var(--text); }
.floatchat-head .iconbtn svg { width: 16px; height: 16px; }
.floatchat-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.floatchat-empty { margin: auto; color: var(--text-3); font-size: 13px; }
.fc-row { display: flex; flex-direction: column; max-width: 78%; gap: 3px; }
.fc-row.me { align-self: flex-end; align-items: flex-end; }
.fc-row.you { align-self: flex-start; align-items: flex-start; }
.fc-who { font-size: 11.5px; color: var(--text-2); font-weight: 600; padding: 0 3px; }
.fc-bubble { padding: 9px 13px; border-radius: 13px; font-size: 13.5px; line-height: 1.5; background: var(--bg-hover); }
.fc-row.me .fc-bubble { background: var(--key); color: #fff; }
.fc-time { font-size: 10.5px; color: var(--text-3); padding: 0 3px; }
.floatchat-composer { display: flex; align-items: center; gap: 8px; padding: 11px 13px; border-top: 1px solid var(--border); }
.floatchat-composer input { flex: 1; height: 38px; padding: 0 13px; border-radius: 19px; background: var(--bg-subtle); border: 1px solid var(--border); font-size: 13.5px; }
.floatchat-composer input:focus { border-color: var(--key); }
.fc-send { width: 38px; height: 38px; border-radius: 50%; background: var(--key); color: #fff; display: grid; place-items: center; flex: 0 0 auto; transition: opacity .13s; }
.fc-send:disabled { opacity: .4; }
.fc-send svg { width: 17px; height: 17px; }

.home-chat-panel .chat-scroll { padding: 14px 18px 8px; }
.home-chat-panel .composer { padding: 8px 14px 14px; }

.edit-btn { flex: 0 0 auto; height: 38px; padding: 0 16px; border-radius: 11px; border: 1px solid var(--border-2); font-size: 13px; font-weight: 700; color: var(--text); transition: all .15s; display: flex; align-items: center; gap: 6px; }
.edit-btn svg { width: 15px; height: 15px; }
.edit-btn:hover { background: var(--bg-hover); border-color: var(--text-3); }
.edit-btn.on { background: var(--key); color: #fff; border-color: var(--key); box-shadow: 0 4px 12px rgba(5,213,96,.3); }
.home-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
.home-col { display: flex; flex-direction: column; gap: 18px; }
.widget-wrap { display: flex; flex-direction: column; }
.widget-wrap.edit { outline: 2px dashed var(--border-2); outline-offset: 4px; border-radius: 20px; }
.widget-edit-bar { display: flex; align-items: center; justify-content: space-between; padding: 0 4px; font-size: 12px; font-weight: 700; color: var(--text-2); }
.widget-edit-actions { display: flex; gap: 6px; }
.widget-edit-actions button { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border-2); display: grid; place-items: center; color: var(--icon); transition: background .14s; }
.widget-edit-actions button svg { width: 15px; height: 15px; }
.widget-edit-actions button:hover:not(:disabled) { background: var(--bg-hover); }
.widget-edit-actions button:disabled { opacity: .35; cursor: default; }
.card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
.card-head { display: flex; align-items: center; gap: 9px; padding: 17px 20px 13px; flex: 0 0 auto; }
.card-head svg { width: 18px; height: 18px; color: var(--icon); }
.card-head h3 { font-size: 14.5px; font-weight: 700; letter-spacing: -0.3px; }
.card-head .count { margin-left: auto; font-size: 12px; font-weight: 600; color: var(--text-3); background: var(--bg-hover); padding: 2px 8px; border-radius: 7px; }
.card-body { padding: 4px 12px 14px; }
.todo { display: flex; align-items: center; gap: 12px; padding: 11px 8px; border-radius: 11px; transition: background .14s; width: 100%; text-align: left; }
.todo:hover { background: var(--bg-hover); }
.todo .bar { width: 4px; height: 34px; border-radius: 3px; background: var(--text-3); flex: 0 0 auto; }
.todo .bar.gray { background: var(--border-2); }
.todo .ttl { font-size: 13.5px; font-weight: 600; letter-spacing: -0.2px; }
.todo .tm { font-size: 12.5px; color: var(--text-2); margin-top: 2px; }
.todo .time-tag { margin-left: auto; font-size: 12px; font-weight: 700; color: var(--text-2); }
.recent { display: flex; gap: 11px; padding: 11px 8px; border-radius: 11px; transition: background .14s; width: 100%; text-align: left; }
.recent:hover { background: var(--bg-hover); }
.recent .ava { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; font-size: 12px; font-weight: 700; background: var(--bg-hover); color: var(--text-2); flex: 0 0 auto; }
.recent .who { font-size: 13.5px; font-weight: 700; }
.recent .who .ch { color: var(--text-3); font-weight: 600; margin-left: 6px; font-size: 12px; }
.recent .prev { font-size: 13px; color: var(--text-2); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; }
.quick { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-subtle); transition: transform .14s, border-color .14s, background .14s; text-align: left; }
.quick:hover { transform: translateY(-2px); border-color: var(--text-3); background: var(--bg); box-shadow: var(--shadow-md); }
.quick .qi { width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; background: var(--key-soft); }
.quick .qi svg { width: 19px; height: 19px; color: var(--key); }
.quick .ql { font-size: 14px; font-weight: 700; }
.quick .qd { font-size: 12.5px; color: var(--text-2); }

/* ---------- team ---------- */
.team-scroll { flex: 1; overflow-y: auto; padding: 26px; min-height: 0; }
.team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 14px; }
.member { display: flex; align-items: center; gap: 13px; padding: 16px; border: 1px solid var(--border); border-radius: 16px; background: var(--bg); transition: transform .14s, box-shadow .16s, border-color .14s; width: 100%; text-align: left; cursor: pointer; }
.member:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--text-3); }
.member.on { border-color: var(--text-3); background: var(--bg-active); }
.member.self { cursor: default; opacity: 1; }
.member:disabled { opacity: 1; }
.member.self:hover { transform: none; box-shadow: none; border-color: var(--border); }
.member .ava { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; font-size: 16px; font-weight: 700; background: var(--bg-hover); color: var(--text-2); position: relative; flex: 0 0 auto; }
.member .ava.me { background: var(--neutral-soft); color: var(--text); }
.member .nm { font-size: 15px; font-weight: 700; }
.member .rl { font-size: 12.5px; color: var(--text-2); margin-top: 2px; }

/* team chat embedded below roster */
.team-chat-wrap { margin-top: 22px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; min-height: 520px; overflow: hidden; }
.team-chat-wrap .chat-scroll { padding: 18px 22px 8px; }
.team-chat-wrap .composer { padding: 10px 18px 16px; }

/* work-pill in topbar */
.work-pill { display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: 10px; background: var(--key); color: #fff; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(5,213,96,.3); transition: all .15s; font-variant-numeric: tabular-nums; }
.work-pill svg { width: 15px; height: 15px; }
.work-pill.on { background: var(--bg); color: var(--text); border: 1px solid var(--key-line); box-shadow: none; }
.work-pill.on svg { color: var(--key); }
.work-pill:hover { transform: translateY(-1px); }

/* ---------- attendance / work timer (home) ---------- */
.work-body { padding: 6px 20px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.work-timer { font-size: 32px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.5px; color: var(--text); }
.work-total { font-size: 13px; color: var(--text-2); }
.work-total b { color: var(--text); font-weight: 800; }
.work-btn { width: 100%; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--text); color: var(--bg); font-size: 14px; font-weight: 700; letter-spacing: -0.3px; transition: background .13s, opacity .13s; margin-top: 2px; }
.work-btn svg { width: 18px; height: 18px; }
.work-btn:hover { opacity: .88; }

.work-btn.stop { background: var(--text); color: var(--bg); }
.work-btn.stop:hover { opacity: .88; }
.work-compare { width: 100%; margin-top: 8px; border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 9px; }
.wc-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-2); font-weight: 600; }
.wc-row b { color: var(--text); font-weight: 800; font-variant-numeric: tabular-nums; }
.wc-row b.up { color: var(--key); }
.wc-row b.down { color: var(--text-3); }
.liveDot { width: 7px; height: 7px; border-radius: 50%; background: var(--key); display: inline-block; animation: pulse 1.4s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

/* team comparison bars (열품타 style) */
.cmp-row { display: flex; align-items: center; gap: 12px; padding: 9px 8px; border-radius: 11px; }
.cmp-bar-wrap { flex: 1; min-width: 0; }
.cmp-name { font-size: 12.5px; font-weight: 700; margin-bottom: 5px; }
.cmp-bar { height: 7px; border-radius: 4px; background: var(--bg-hover); overflow: hidden; }
.cmp-fill { height: 100%; border-radius: 4px; background: var(--key); transition: width .5s cubic-bezier(.2,.8,.2,1); }
.cmp-fill.gray { background: var(--text); }
.cmp-time { font-size: 12.5px; font-weight: 700; color: var(--text-2); flex: 0 0 auto; font-variant-numeric: tabular-nums; }

/* ---------- personal performance widget ---------- */
.perf-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 4px 12px 14px; }
.perf-kpi { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; border-radius: 13px; background: var(--bg-subtle); border: 1px solid var(--border); text-align: center; }
.perf-kpi-val { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); line-height: 1; }
.perf-kpi-label { font-size: 11px; font-weight: 600; color: var(--text-3); margin-bottom: 4px; }
.perf-bars { padding: 0 12px 14px; display: flex; flex-direction: column; gap: 9px; }
.perf-bar-row { display: flex; align-items: center; gap: 10px; }
.perf-bar-label { font-size: 12px; font-weight: 600; color: var(--text-2); flex: 0 0 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.perf-bar-track { flex: 1; height: 6px; border-radius: 4px; background: var(--bg-hover); overflow: hidden; }
.perf-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(to right, #6fe6a6, var(--key)); transition: width .5s cubic-bezier(.2,.8,.2,1); }
.perf-bar-val { font-size: 11.5px; font-weight: 700; color: var(--text-3); flex: 0 0 28px; text-align: right; font-variant-numeric: tabular-nums; }
.perf-divider { height: 1px; background: var(--border); margin: 0 12px 10px; }

/* ---------- idea eval criteria ---------- */
.eval-criteria { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.eval-criterion { display: flex; flex-direction: column; gap: 5px; }
.eval-crit-head { display: flex; align-items: center; justify-content: space-between; }
.eval-crit-label { font-size: 12px; font-weight: 700; color: var(--text-2); }
.eval-crit-val { font-size: 12px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.eval-crit-dots { display: flex; gap: 4px; }
.eval-crit-dot { width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid var(--border-2); background: var(--bg-subtle); display: grid; place-items: center; font-size: 11.5px; font-weight: 700; color: var(--text-3); transition: all .13s; cursor: pointer; }
.eval-crit-dot:hover { border-color: var(--key-line); background: var(--key-soft); color: var(--key); }
.eval-crit-dot.on { background: var(--key); border-color: var(--key); color: #fff; }
.eval-crit-bar-track { height: 4px; border-radius: 3px; background: var(--bg-hover); overflow: hidden; }
.eval-crit-bar-fill { height: 100%; border-radius: 3px; background: var(--key); transition: width .3s ease; }
.eval-verdict { margin-top: 14px; padding: 0 0 2px; }
.eval-verdict-label { font-size: 12.5px; font-weight: 700; color: var(--text-2); margin-bottom: 8px; }
.eval-verdict-btns { display: flex; gap: 8px; }
.eval-verdict-btn { flex: 1; height: 36px; border-radius: 10px; border: 1.5px solid var(--border-2); font-size: 13px; font-weight: 700; color: var(--text-2); transition: all .14s; }
.eval-verdict-btn:hover { border-color: var(--border-2); background: var(--bg-hover); }
.eval-verdict-btn.pick { border-color: var(--key-line); color: var(--key); }
.eval-verdict-btn.pick.on { background: var(--key); border-color: var(--key); color: #fff; }
.eval-verdict-btn.hold { border-color: rgba(232,112,64,.3); color: #e87040; }
.eval-verdict-btn.hold.on { background: #e87040; border-color: #e87040; color: #fff; }
.eval-verdict-reason { width: 100%; margin-top: 10px; min-height: 56px; padding: 10px 13px; border: 1px solid var(--border-2); border-radius: 10px; font-size: 13px; line-height: 1.55; resize: none; background: var(--bg-subtle); color: var(--text); transition: border-color .15s, box-shadow .15s; }
.eval-verdict-reason:focus { border-color: var(--key); box-shadow: 0 0 0 3px var(--key-soft); outline: none; }
.eval-avg-banner { display: flex; align-items: center; gap: 10px; padding: 10px 13px; border-radius: 11px; background: var(--key-soft); border: 1px solid var(--key-line); margin-top: 14px; }
.eval-avg-banner svg { width: 15px; height: 15px; color: var(--key); flex: 0 0 auto; }
.eval-avg-banner span { font-size: 12.5px; font-weight: 600; color: var(--text); }
.eval-avg-banner b { color: var(--key); font-weight: 800; }


/* ---------- idea board — 지행 스타일 카드 ---------- */
.idea-scroll { flex: 1; overflow-y: auto; padding: 22px 26px 28px; min-height: 0; }
.idea-head { display: flex; align-items: flex-end; gap: 14px; margin-bottom: 22px; }
.idea-head .h { font-size: 22px; font-weight: 800; }
.idea-head .s { font-size: 13px; color: var(--text-2); margin-top: 4px; }

.idea-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 18px; align-items: start; }

/* 카드 본체 — Figma 스펙 */
.idea-card {
  border: 1px solid var(--border); border-radius: 16px; background: var(--bg);
  padding: 21px; display: flex; flex-direction: column;
  transition: transform .16s, border-color .15s, background .15s;
  text-align: left; cursor: pointer; position: relative;
}
.idea-card:hover { transform: translateY(-2px); border-color: var(--border-2); }
.idea-card.picked { background: #fffbeb; border-color: #f5d84e; }
.idea-card.picked:hover { border-color: #e6c800; }
.teum.dark .idea-card.picked { background: rgba(245,216,78,.08); border-color: rgba(245,216,78,.35); }
.teum.glass .idea-card.picked { background: rgba(255,248,180,.55); border-color: rgba(245,216,78,.55); }

/* 상단: 아바타 + 작성자 + 북마크 */
.ic-header { display: flex; align-items: center; gap: 12px; margin-bottom: 0; }
.ic-avatar {
  width: 48px; height: 48px; border-radius: 14px; flex: 0 0 48px;
  border: 1px solid #f3f4f6; background: #f9fafb;
  display: grid; place-items: center; font-size: 18px; font-weight: 900;
  color: var(--text); overflow: hidden;
}
.ic-avatar.me { background: var(--neutral-soft); }
.ic-author-wrap { flex: 1; min-width: 0; }
.ic-author { font-size: 16px; font-weight: 400; color: #101828; line-height: 24px; }
.ic-meta { font-size: 14px; color: var(--key); font-weight: 500; line-height: 20px; }
.ic-meta .sep { margin: 0 4px; }
.ic-bookmark {
  position: absolute; top: 21px; right: 21px;
  width: 20px; height: 24px; display: flex; align-items: flex-start; justify-content: center; padding-top: 4px;
  color: #99a1af; transition: color .14s;
}
.ic-bookmark svg { width: 20px; height: 20px; stroke-width: 1.8; }
.ic-bookmark:hover { color: var(--text-2); }
.ic-bookmark.saved svg { fill: var(--text); color: var(--text); }

/* 제목 */
.ic-title { font-size: 16px; font-weight: 700; line-height: 24px; color: #101828; margin-top: 16px; }

/* 설명 */
.ic-desc { font-size: 14px; color: #6a7282; font-weight: 400; line-height: 20px; margin-top: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 아이디어 이미지 첨부 */
.idea-img-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.idea-img-thumb { width: 72px; height: 72px; border-radius: 10px; overflow: hidden; position: relative; border: 1px solid var(--border); background: var(--bg-hover); background-size: cover; background-position: center; flex: 0 0 auto; }
.idea-img-del { position: absolute; top: 3px; right: 3px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,.55); color: #fff; display: grid; place-items: center; opacity: 0; transition: opacity .13s; }
.idea-img-del svg { width: 11px; height: 11px; }
.idea-img-thumb:hover .idea-img-del { opacity: 1; }
.idea-img-add { width: 72px; height: 72px; border-radius: 10px; border: 1.5px dashed var(--border-2); background: var(--bg-subtle); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--text-3); font-size: 11.5px; font-weight: 600; transition: border-color .13s, background .13s; }
.idea-img-add:hover { border-color: var(--key); background: var(--key-soft); color: var(--key); }

/* 카드 썸네일 */
.ic-imgs { display: flex; gap: 6px; margin-top: 12px; }
.ic-img-thumb { flex: 1; height: 80px; border-radius: 10px; background-size: cover; background-position: center; background-color: var(--bg-hover); position: relative; overflow: hidden; min-width: 0; }
.ic-img-more { position: absolute; inset: 0; background: rgba(0,0,0,.45); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; }

/* 상세 갤러리 */
.idea-detail-imgs { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-top: 16px; }
.idea-detail-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; border: 1px solid var(--border); cursor: zoom-in; transition: opacity .14s; }
.idea-detail-img:hover { opacity: .88; }

/* 하단 배지 + 통계 행 */
.ic-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 16px; }
.ic-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ic-badge {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 12px; border-radius: 4px;
  font-size: 14px; font-weight: 400; flex: 0 0 auto; white-space: nowrap; line-height: 20px;
}
.ic-badge.neutral { background: #f3f4f6; color: #6a7282; }
.ic-badge.hot { background: #fef2f2; color: #ff6467; }
.ic-badge.new-pick { background: #fef2f2; color: #ff6467; }
.ic-badge svg { width: 15px; height: 15px; }
.ic-stats { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
.ic-stat { display: flex; align-items: center; gap: 4px; font-size: 14px; color: var(--text-2); font-weight: 600; font-variant-numeric: tabular-nums; line-height: 20px; }
.ic-stat svg { width: 15px; height: 15px; stroke-width: 1.7; color: #99a1af; }
.ic-stat .star-fill { color: #f5b400; fill: #f5b400; }

/* 상태 배지 (IdeaDetail 등에서 사용) */
.status { font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 8px; }
.status.review { color: var(--text-2); background: var(--bg-hover); }
.status.picked { color: var(--key); background: var(--key-soft); }
.status.hold { color: #b08400; background: rgba(216,176,8,.13); }

/* detail / compose 공용 */
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-chip { font-size: 11.5px; font-weight: 600; color: var(--text-2); background: var(--bg-subtle); border: 1px solid var(--border); padding: 3px 9px; border-radius: 7px; }
.eval-row { display: flex; align-items: center; gap: 8px; margin-top: 2px; padding-top: 12px; border-top: 1px solid var(--border); }
.rec-btn { display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 9px; border: 1px solid var(--border-2); font-size: 13px; font-weight: 700; color: var(--text-2); transition: all .14s; }
.rec-btn svg { width: 15px; height: 15px; }
.rec-btn:hover { border-color: var(--key-line); }
.rec-btn.on { background: var(--key-soft); border-color: var(--key-line); color: var(--key); }
.eval-score { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--text); }
.eval-score svg { width: 15px; height: 15px; color: var(--text-3); fill: var(--text-3); }
.eval-score .n { color: var(--text-3); font-weight: 600; font-size: 12px; }
.eval-cmt { margin-left: auto; display: flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 600; color: var(--text-3); }
.eval-cmt svg { width: 15px; height: 15px; }
.rec-progress { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.rec-progress-bar { flex: 1; height: 6px; border-radius: 4px; background: var(--bg-hover); overflow: hidden; }
.rec-progress-fill { height: 100%; border-radius: 4px; background: var(--key); transition: width .4s ease; }
.rec-progress span { font-size: 12px; font-weight: 600; color: var(--text-2); flex: 0 0 auto; }


.stars { display: flex; gap: 2px; }
.stars button { padding: 2px; }
.stars svg { width: 22px; height: 22px; color: var(--border-2); transition: color .1s, transform .1s; }
.stars button:hover svg { transform: scale(1.12); }
.stars svg.fill { color: var(--key); fill: var(--key); }
.cmt-box { display: flex; gap: 8px; margin-top: 14px; }
.cmt-box input { flex: 1; height: 40px; padding: 0 14px; border: 1px solid var(--border-2); border-radius: 11px; font-size: 13.5px; transition: border-color .16s, box-shadow .16s; }
.cmt-box input:focus { border-color: var(--key); box-shadow: 0 0 0 3px var(--key-soft); }
.cmt-box button { width: 40px; height: 40px; border-radius: 11px; background: var(--key); color: #fff; display: grid; place-items: center; }
.cmt-box button svg { width: 17px; height: 17px; }
.cmt-list { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.cmt { display: flex; gap: 10px; }
.cmt .a { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; font-size: 11px; font-weight: 700; background: var(--bg-hover); color: var(--text-2); flex: 0 0 auto; }
.cmt .b .nm { font-size: 12.5px; font-weight: 700; }
.cmt .b .tx { font-size: 13px; color: var(--text); margin-top: 2px; line-height: 1.5; }

.modal-scrim { position: fixed; inset: 0; background: rgba(16,24,40,.38); z-index: 200; display: grid; place-items: center; padding: 24px; }
.modal { width: 520px; max-width: 100%; background: var(--bg); border-radius: 14px; box-shadow: var(--shadow-lg); overflow: hidden; transform: scale(.96); opacity: 0; animation: popin .26s cubic-bezier(.2,.8,.2,1) forwards; border: 1px solid var(--border); }
@keyframes popin { to { transform: none; opacity: 1; } }
.modal-head { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--bg-subtle); }
.modal-head h3 { font-size: 16px; font-weight: 800; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.field label { display: block; font-size: 12.5px; font-weight: 700; color: var(--text-2); margin-bottom: 7px; }
.field input, .field textarea, .field select { width: 100%; padding: 12px 14px; border: 1px solid var(--border-2); border-radius: 12px; font-size: 14px; transition: border-color .16s, box-shadow .16s; background: var(--bg); color: var(--text); }
.field textarea { resize: none; line-height: 1.55; }
.field input:focus, .field textarea:focus, .field select:focus { border-color: var(--key); box-shadow: 0 0 0 3px var(--key-soft); }
.timerow { display: flex; align-items: center; gap: 8px; }
.timerow select { flex: 1; width: auto; padding: 12px 10px; }
.timerow-sep { color: var(--text-3); font-weight: 600; flex: 0 0 auto; }
.daypick { flex: 0 0 auto; height: 46px; padding: 0 16px; border-radius: 12px; border: 1px solid var(--border-2); font-size: 13.5px; font-weight: 700; color: var(--text-2); transition: all .15s; }
.daypick.on { background: var(--bg-active); border-color: var(--text-3); color: var(--text); }
.typepick { display: flex; gap: 8px; flex-wrap: wrap; }
.colorpick { display: flex; gap: 10px; flex-wrap: wrap; }
/* 브리프 제목 입력 */
.brief-title-field { margin-bottom: 22px; }
.brief-title-input { width: 100%; font-size: 24px; font-weight: 800; letter-spacing: -0.6px; color: var(--text); padding: 4px 0; border-bottom: 2px solid transparent; transition: border-color .15s; }
.brief-title-input:focus { border-bottom-color: var(--key); }
.brief-title-input::placeholder { color: var(--text-3); font-weight: 700; }
.brief-title-hint { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-3); font-weight: 500; margin-top: 8px; }
/* 라벨 선택 */
.label-pick { display: flex; flex-wrap: wrap; gap: 7px; }
.label-opt { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 12px; border-radius: 7px; font-size: 13px; font-weight: 700; color: #1a1a1a; transition: opacity .13s, transform .1s; letter-spacing: -0.2px; }
.label-opt:hover { transform: translateY(-1px); }
.label-opt.on { opacity: 1 !important; box-shadow: 0 0 0 2px var(--bg), 0 0 0 3px rgba(0,0,0,.18); }
.label-add { display: flex; gap: 8px; margin-top: 10px; }
.label-add input { flex: 1; height: 38px; padding: 0 12px; border-radius: 9px; border: 1px solid var(--border); background: var(--bg-subtle); font-size: 13.5px; }
.label-add input:focus { border-color: var(--key); }
.label-add button { width: 38px; height: 38px; border-radius: 9px; background: var(--bg-hover); display: grid; place-items: center; color: var(--text-2); transition: background .13s; }
.label-add button:hover { background: var(--bg-active); color: var(--text); }
.label-add button svg { width: 17px; height: 17px; }
.iss-label-new { display: flex; gap: 6px; padding: 8px 8px 6px; border-top: 1px solid var(--border); margin-top: 2px; }
.iss-label-new input { flex: 1; height: 30px; padding: 0 10px; border-radius: 7px; border: 1px solid var(--border); background: var(--bg-subtle); font-size: 12.5px; color: var(--text); }
.iss-label-new input:focus { border-color: var(--key); outline: none; }
.iss-label-new button { width: 30px; height: 30px; border-radius: 7px; background: var(--bg-hover); display: grid; place-items: center; color: var(--text-2); transition: background .13s, color .13s; flex: 0 0 auto; }
.iss-label-new button:hover:not(:disabled) { background: var(--key-soft); color: var(--key); }
.iss-label-new button:disabled { opacity: 0.35; }
.iss-label-new { display: flex; gap: 6px; padding: 8px 8px 6px; border-top: 1px solid var(--border); margin-top: 2px; }
.iss-label-new input { flex: 1; height: 30px; padding: 0 10px; border-radius: 7px; border: 1px solid var(--border); background: var(--bg-subtle); font-size: 12.5px; color: var(--text); }
.iss-label-new input:focus { border-color: var(--key); outline: none; }
.iss-label-new button { width: 30px; height: 30px; border-radius: 7px; background: var(--bg-hover); display: grid; place-items: center; color: var(--text-2); transition: background .13s, color .13s; flex: 0 0 auto; }
.iss-label-new button:hover:not(:disabled) { background: var(--key-soft); color: var(--key); }
.iss-label-new button:disabled { opacity: 0.35; }

/* ── 이슈 작성 (Linear 스타일) ── */
.iss-compose { width: 580px; max-width: 96vw; background: var(--bg); border-radius: 18px; border: 1px solid var(--border-2); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: visible; position: relative; }
.teum.dark .iss-compose { background: var(--bg-panel); }
.teum.dark .iss-row .ttl { color: #e8ecef; }
.teum.dark .iss-row .iid { color: #6d747b; }
.teum.glass .iss-compose { background: rgba(252,254,253,0.96); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); }
.iss-compose-title { width: 100%; padding: 22px 24px 8px; font-size: 20px; font-weight: 800; letter-spacing: -0.6px; color: var(--text); }
.iss-compose-title::placeholder { color: var(--text-3); font-weight: 600; }
.iss-compose-desc { width: 100%; padding: 6px 24px 16px; font-size: 14px; color: var(--text-2); line-height: 1.6; resize: none; border-bottom: 1px solid var(--border); }
.iss-compose-desc::placeholder { color: var(--text-3); }
.iss-compose-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 10px 16px; gap: 8px; }
.iss-compose-chips { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.iss-chip-wrap { position: relative; }
.iss-chip { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px; border-radius: 7px; font-size: 12.5px; font-weight: 600; color: var(--text-2); background: var(--bg-hover); transition: background .12s, color .12s; white-space: nowrap; }
.iss-chip:hover { background: var(--bg-active); color: var(--text); }
.iss-chip svg { flex: 0 0 auto; }
.iss-chip-drop { position: absolute; bottom: calc(100% + 6px); left: 0; z-index: 100; background: var(--bg); border: 1px solid var(--border-2); border-radius: 12px; box-shadow: var(--shadow-lg); padding: 5px; min-width: 160px; animation: slideInUp .14s cubic-bezier(.22,.8,.28,1); }
.iss-chip-drop-wide { min-width: 200px; }
.iss-chip-drop-date { min-width: 180px; padding: 10px; }
.teum.glass .iss-chip-drop { background: rgba(252,254,253,0.97); }
.iss-drop-item { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--text); text-align: left; transition: background .1s; }
.iss-drop-item:hover { background: var(--bg-hover); }
.iss-drop-item.on { background: var(--key-soft); color: var(--text); font-weight: 700; }
.iss-drop-item svg { width: 15px; height: 15px; flex: 0 0 auto; }
.iss-drop-label-dot { width: 10px; height: 10px; border-radius: 3px; flex: 0 0 auto; }
.iss-drop-empty { padding: 10px 12px; font-size: 12.5px; color: var(--text-3); line-height: 1.6; }
.iss-compose-submit { height: 32px; padding: 0 16px; font-size: 13px; font-weight: 700; border-radius: 9px; flex: 0 0 auto; }

/* ── 패널 액션 아이템 (회의 조율 / 브리프) ── */
.panel-action-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 9px; text-align: left; transition: background .12s; }
.panel-action-item:hover { background: var(--bg-hover); }
.pai-icon { width: 30px; height: 30px; border-radius: 8px; background: var(--bg-active); color: var(--text-2); display: grid; place-items: center; flex: 0 0 auto; transition: background .12s; }
.pai-icon svg { width: 15px; height: 15px; }
.pai-icon.brief { background: var(--key-soft); color: var(--key); }
.panel-action-item:hover .pai-icon { background: var(--border-2); }
.pai-body { flex: 1; min-width: 0; }
.pai-title { font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.2px; }
.pai-sub { font-size: 11.5px; color: var(--text-3); margin-top: 1px; }
.pai-arrow { width: 14px; height: 14px; color: var(--text-3); flex: 0 0 auto; }
.sec-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 6px; background: var(--bg-active); color: var(--text-2); font-size: 11px; font-weight: 800; }

/* ── 회의 조율 모달 ── */
.poll-compose-modal .modal-head { gap: 12px; }
.poll-compose-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--bg-hover); color: var(--text-2); display: grid; place-items: center; flex: 0 0 auto; }
.poll-compose-icon svg { width: 18px; height: 18px; }
.poll-date-pick { display: flex; flex-wrap: wrap; gap: 6px; }
.poll-date-opt { padding: 7px 11px; border-radius: 8px; background: var(--bg-subtle); border: 1px solid var(--border); font-size: 13px; font-weight: 600; color: var(--text-2); transition: all .14s; }
.poll-date-opt:hover { border-color: var(--border-2); background: var(--bg-hover); color: var(--text); }
.poll-date-opt.on { background: var(--key); border-color: var(--key); color: #fff; }
.poll-preview-hint { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); background: var(--bg-subtle); padding: 11px 14px; border-radius: 10px; border: 1px solid var(--border); }
.poll-preview-hint b { color: var(--text); font-weight: 700; }

.poll-card { margin-top: 10px; border: 1px solid var(--border); border-radius: 14px; background: var(--bg); padding: 14px; max-width: 460px; }
.poll-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.poll-ic { width: 34px; height: 34px; border-radius: 10px; background: var(--key-soft); color: var(--key); display: grid; place-items: center; flex: 0 0 auto; }
.poll-ic svg { width: 17px; height: 17px; }
.poll-title { font-size: 14.5px; font-weight: 700; letter-spacing: -0.3px; }
.poll-sub { font-size: 12px; color: var(--text-3); margin-top: 2px; }
.poll-grid { display: grid; gap: 3px; }
.poll-cell { height: 34px; display: flex; align-items: center; justify-content: center; font-size: 11.5px; border-radius: 6px; }
.poll-corner { background: transparent; }
.poll-dhead { font-weight: 700; color: var(--text-2); font-size: 11px; }
.poll-thead { font-weight: 600; color: var(--text-3); font-size: 11px; justify-content: flex-end; padding-right: 6px; }
.poll-slot { background: var(--bg-hover); position: relative; cursor: pointer; transition: transform .08s; border: 1px solid transparent; }
.poll-slot:hover { transform: scale(1.06); border-color: var(--border-2); }
.poll-slot.mine { outline: 2px solid var(--key); outline-offset: -2px; }
.poll-slot.best { box-shadow: 0 0 0 2px var(--key); }
.poll-n { font-size: 11px; font-weight: 800; color: #0a5c2c; }
.poll-check { width: 11px; height: 11px; color: var(--key); position: absolute; top: 2px; right: 2px; stroke-width: 3.5; }
.poll-best { display: flex; align-items: center; gap: 6px; margin-top: 12px; padding: 9px 11px; border-radius: 9px; background: var(--key-soft); color: var(--text); font-size: 12.5px; font-weight: 600; }
.poll-best b { color: var(--key); font-weight: 800; }
.poll-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
.poll-leg { display: flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; color: var(--text-2); }
.poll-leg svg { border-radius: 5px; }
.poll-leg:not(.on) { color: var(--text-3); opacity: .65; }

/* 폴 만들기 모달 */
.poll-date-pick { display: flex; flex-wrap: wrap; gap: 7px; }
.poll-date-opt { height: 34px; padding: 0 12px; border-radius: 9px; background: var(--bg-subtle); border: 1px solid var(--border); font-size: 13px; font-weight: 600; color: var(--text-2); transition: all .12s; }
.poll-date-opt:hover { background: var(--bg-hover); }
.poll-date-opt.on { background: var(--key); border-color: var(--key); color: #fff; }
.poll-preview-hint { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-2); font-weight: 500; background: var(--bg-subtle); padding: 10px 12px; border-radius: 9px; }
.color-dot { width: 32px; height: 32px; border-radius: 50%; background: var(--c); display: grid; place-items: center; transition: transform .12s, box-shadow .14s; position: relative; }
.color-dot:hover { transform: scale(1.1); }
.color-dot.on { box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px var(--c); }
.color-dot svg { width: 16px; height: 16px; color: #fff; stroke-width: 3; }
.typepick button { flex: 1; min-width: calc(50% - 4px); height: 44px; border-radius: 12px; border: 1px solid var(--border-2); font-size: 13.5px; font-weight: 700; color: var(--text-2); transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
.typepick button.on { background: var(--bg-active); border-color: var(--text-3); color: var(--text); }
.modal-foot { display: flex; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--border); }
.profile-hero { display: flex; align-items: center; gap: 16px; padding: 4px 0 20px; margin-bottom: 6px; border-bottom: 1px solid var(--border); }
.profile-hero-info { min-width: 0; }
.profile-hero-name { font-size: 19px; font-weight: 800; letter-spacing: -0.5px; }
.profile-hero-role { font-size: 13.5px; color: var(--text-2); margin-top: 4px; }
.profile-hero-stat { font-size: 12.5px; color: var(--key); font-weight: 700; margin-top: 6px; }
.profile-setting-row { width: 100%; display: flex; align-items: center; justify-content: space-between; height: 46px; padding: 0 14px; border-radius: 11px; background: var(--bg-subtle); border: 1px solid var(--border); font-size: 14px; font-weight: 600; color: var(--text); transition: background .13s; }
.profile-setting-row:hover { background: var(--bg-hover); }
.profile-toggle { width: 40px; height: 24px; border-radius: 14px; background: var(--bg-active); position: relative; transition: background .18s; flex: 0 0 auto; }
.theme-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.theme-opt { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 0; border-radius: 11px; border: 1px solid var(--border); background: var(--bg-subtle); font-size: 12.5px; font-weight: 600; color: var(--text-2); transition: all .14s; }
.theme-opt:hover { background: var(--bg-hover); }
.theme-opt.on { border-color: var(--key); background: var(--key-soft); color: var(--key); }
.theme-opt svg { color: currentColor; }
.profile-toggle.on { background: var(--key); }
.profile-toggle-knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .18s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.profile-toggle.on .profile-toggle-knob { transform: translateX(16px); }
.modal-foot .ghost { flex: 0 0 auto; padding: 0 18px; height: 44px; border-radius: 12px; border: 1px solid var(--border-2); font-weight: 700; font-size: 14px; transition: background .14s; }
.modal-foot .ghost:hover { background: var(--bg-hover); }

/* ── 프로필 모달 히어로 (직행 기업 페이지 스타일) ── */

/* ── 아이디어 상세 히어로 ── */
.idea-detail-hero { background: linear-gradient(160deg, #0d1f18 0%, #1e3d2c 50%, #162e22 100%); flex: 0 0 auto; position: relative; color: #fff;}
.idea-detail-hero-inner { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 0; }
.idea-detail-status-badge { font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 4px; background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.18); }
.idea-detail-status-badge.picked { background: rgba(5,213,96,0.20); color: #05d560; border-color: rgba(5,213,96,0.35); }
.idea-detail-close { color: rgba(255,255,255,0.65) !important; }
.idea-detail-close:hover { background: rgba(255,255,255,0.10) !important; color: #fff !important; }
.idea-detail-hero .iconbtn { color: rgba(255,255,255,0.65); }
.idea-detail-hero .iconbtn:hover { background: rgba(255,255,255,0.12); color: #fff; }
.idea-detail-hero .iconbtn svg { color: inherit; }
.idea-detail-hero-content { padding: 14px 24px 22px; }
.idea-detail-title { font-size: 19px; font-weight: 800; color: #fff; line-height: 1.35; letter-spacing: -0.4px; margin: 0 0 10px; }
.idea-detail-meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(255,255,255,0.60); font-weight: 500; }
.idea-detail-sep { color: rgba(255,255,255,0.30); }
.idea-detail-desc { font-size: 14.5px; line-height: 1.72; color: var(--text); padding-top: 4px; }

/* ── 프로필 모달 히어로 (직행 기업 페이지 스타일) ── */
.profile-modal { width: 480px; }
.profile-modal-hero {
  background: linear-gradient(135deg, #0d1f18 0%, #1a3d2b 60%, #0f2d20 100%);
  padding: 20px 20px 22px; position: relative; min-height: 110px;
  display: flex; flex-direction: column; justify-content: flex-end; gap: 12px; color: #fff;
}
.profile-modal-close {
  position: absolute; top: 14px; right: 14px;
  color: rgba(255,255,255,0.7);
}
.profile-modal-close:hover { background: rgba(255,255,255,0.12); color: #fff; }
.profile-modal-avatar { margin-bottom: 2px; }
.profile-modal-hero-info { display: flex; flex-direction: column; gap: 2px; }
.profile-modal-name { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.4px; }
.profile-modal-role { font-size: 13px; color: rgba(255,255,255,0.65); font-weight: 500; }
.profile-modal-stats {
  display: flex; align-items: center; gap: 0;
  background: rgba(255,255,255,0.08); border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  overflow: hidden; align-self: flex-start;
}
.profile-modal-stat-item { padding: 8px 16px; text-align: center; }
.profile-modal-stat-val { display: block; font-size: 13px; font-weight: 700; color: #fff; }
.profile-modal-stat-label { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 1px; font-weight: 500; }
.profile-modal-stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.12); }
.teum.glass .profile-modal-hero { background: linear-gradient(135deg, #0a241a 0%, #14382a 60%, #0c2618 100%); color: #fff; }

/* ── 아이디어 상세 히어로 (직행 공고 팝업 스타일) ── */
.idea-detail-hero {
  background: linear-gradient(160deg, #0d1f18 0%, #1e3d2c 50%, #162e22 100%);
  padding: 0; flex: 0 0 auto; position: relative; color: #fff;
}
.idea-detail-hero-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px 0;
}
.idea-detail-status-badge {
  font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 4px;
  background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.75);
  border: 1px solid rgba(255,255,255,0.18);
}
.idea-detail-status-badge.picked {
  background: rgba(5,213,96,0.20); color: #05d560;
  border-color: rgba(5,213,96,0.35);
}
.idea-detail-close { color: rgba(255,255,255,0.65) !important; }
.idea-detail-close:hover { background: rgba(255,255,255,0.10) !important; color: #fff !important; }
.idea-detail-hero .iconbtn { color: rgba(255,255,255,0.65); }
.idea-detail-hero .iconbtn:hover { background: rgba(255,255,255,0.12); color: #fff; }
.idea-detail-hero .iconbtn svg { color: inherit; }
.idea-detail-hero-content { padding: 14px 24px 22px; }
.idea-detail-title { font-size: 19px; font-weight: 800; color: #fff; line-height: 1.35; letter-spacing: -0.4px; margin: 0 0 10px; }
.idea-detail-meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(255,255,255,0.60); font-weight: 500; }
.idea-detail-sep { color: rgba(255,255,255,0.30); }
.idea-detail-desc { font-size: 14.5px; line-height: 1.72; color: var(--text); margin-bottom: 4px; padding-top: 4px; }
.teum.glass .idea-detail-hero { background: linear-gradient(160deg, #091510 0%, #162e22 50%, #0f2418 100%); color: #fff; }
/* 다크 히어로 영역 전체 자식 color 강제 상속 */
.idea-detail-hero, .idea-detail-hero * { color: inherit; }
.idea-detail-hero { color: #fff; }
.profile-modal-hero, .profile-modal-hero * { color: inherit; }
.profile-modal-hero { color: #fff; }

/* ---------- issues (Linear-inspired) ---------- */
.iss-head {  display: flex; align-items: center; gap: 14px; padding: 16px 22px 14px; border-bottom: 1px solid var(--border); }
.cycle-pill { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.cycle-ring { position: relative; width: 30px; height: 30px; flex: 0 0 auto; }
.cycle-ring svg { transform: rotate(-90deg); }
.cycle-ring .track { stroke: var(--border-2); }
.cycle-ring .fill { stroke: var(--key); stroke-linecap: round; transition: stroke-dashoffset .5s ease; }
.cycle-meta .nm { font-size: 14px; font-weight: 800; }
.cycle-meta .rg { font-size: 12px; color: var(--text-2); margin-top: 1px; }
.iss-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.viewseg { display: flex; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 10px; padding: 3px; }
.viewseg button { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 7px; font-size: 12.5px; font-weight: 700; color: var(--text-2); transition: all .15s; }
.viewseg button svg { width: 15px; height: 15px; }
.viewseg button.on { background: var(--bg); color: var(--text); box-shadow: var(--shadow-sm); }
.newiss { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 9px; background: var(--bg); color: var(--text); border: 1px solid var(--border-2); font-size: 13px; font-weight: 600; letter-spacing: -0.2px; transition: background .13s, border-color .13s; }
.newiss svg { width: 16px; height: 16px; stroke-width: 2.3; }
.newiss:hover { background: var(--bg-hover); border-color: var(--border-2); }

.kbd { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 5px; background: var(--bg-hover); border: 1px solid var(--border-2); font-size: 11px; font-weight: 700; color: var(--text-2); }

/* status icon */
.sicon { width: 16px; height: 16px; flex: 0 0 auto; display: inline-block; }

/* priority bars */
.prio { display: inline-flex; align-items: flex-end; gap: 2px; height: 14px; width: 16px; flex: 0 0 auto; }
.prio span { width: 3px; border-radius: 1px; background: var(--border-2); }
.prio span.b1 { height: 5px; } .prio span.b2 { height: 9px; } .prio span.b3 { height: 13px; }
.prio span.fill { background: var(--icon); }
.prio.urgent { width: 16px; height: 16px; border-radius: 5px; background: var(--icon); color: var(--bg); display: grid; place-items: center; font-size: 11px; font-weight: 900; }
.prio.none { width: 16px; height: 16px; display: grid; place-items: center; }
.prio.none::after { content: ""; width: 11px; height: 2px; border-radius: 2px; background: var(--border-2); }

/* list view */
.iss-scroll { flex: 1; overflow-y: auto; min-height: 0; }

/* ── 팔원별 이슈 분담 바 ── */
.share-wrap { flex: 1; min-width: 0; margin: 0 16px; }
.share-bar { display: flex; height: 11px; border-radius: 6px; overflow: hidden; background: var(--bg-hover); }
.share-seg { height: 100%; transition: width .45s cubic-bezier(.2,.8,.2,1); min-width: 2px; box-shadow: inset -1.5px 0 0 var(--bg); }
.share-seg:last-child { box-shadow: none; }
.share-empty { flex: 1; }
.share-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 7px; }
.share-leg { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; color: var(--text-2); }
.share-leg i { width: 8px; height: 8px; border-radius: 3px; flex: 0 0 auto; }


/* ── 아카이브 + 대시보드 ── */
.archive-scroll { flex: 1; overflow-y: auto; min-height: 0; padding: 24px; display: flex; flex-direction: column; gap: 16px; }

/* 상단 통계: 한 카드 3칸 분할 + 세로 구분선 */
.arch-cycle-banner { display: flex; align-items: center; gap: 24px; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 18px 22px; }
.arch-cycle-left { flex: 0 0 auto; }
.arch-cycle-num { font-size: 18px; font-weight: 800; color: var(--text); letter-spacing: -0.4px; }
.arch-cycle-range { font-size: 12px; color: var(--text-3); margin-top: 2px; font-weight: 500; }
.arch-cycle-right { flex: 1; }
.arch-cycle-progress-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.arch-cycle-progress-label span { font-size: 12px; font-weight: 600; color: var(--text-3); }
.arch-cycle-fraction { color: var(--text-2) !important; }
.arch-cycle-bar-wrap { height: 6px; background: var(--bg-subtle); border-radius: 99px; overflow: hidden; border: 1px solid var(--border); }
.arch-cycle-bar { height: 100%; background: var(--key); border-radius: 99px; transition: width .4s ease; }
.arch-cycle-pct { font-size: 12px; font-weight: 700; color: var(--key); margin-top: 5px; text-align: right; }
.arch-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; background: var(--bg); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
.arch-summary-col { padding: 26px 30px; border-left: 1px solid var(--border); }
.arch-summary-col:first-child { border-left: none; }
.arch-sum-label { font-size: 14.5px; font-weight: 500; color: var(--text-2); margin-bottom: 12px; }
.arch-sum-value { font-size: 30px; font-weight: 800; letter-spacing: -1px; color: var(--text); display: flex; align-items: baseline; gap: 7px; line-height: 1.1; }
.arch-sum-value span:not(.arch-sum-badge) { font-size: 17px; font-weight: 700; letter-spacing: -0.5px; }
.arch-sum-badge { font-size: 12px; font-weight: 700; color: var(--key); background: var(--key-soft); padding: 3px 9px; border-radius: 7px; letter-spacing: -0.2px; align-self: center; }
.arch-sum-sub { font-size: 13.5px; font-weight: 400; color: var(--text-3); margin-top: 12px; }

/* 차트 카드 */
.arch-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.arch-card { background: var(--bg); border: 1px solid var(--border); border-radius: 18px; padding: 24px; }
.arch-card-title { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.arch-card-sub { font-size: 13.5px; font-weight: 400; color: var(--text-3); margin-top: 5px; margin-bottom: 22px; }
.arch-bars { display: flex; align-items: flex-end; justify-content: space-around; gap: 8px; height: 150px; }
.arch-bar-col { display: flex; flex-direction: column; align-items: center; gap: 9px; flex: 1; height: 100%; justify-content: flex-end; }
.arch-bar-wrap { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; flex: 1; width: 100%; gap: 6px; }
.arch-bar-val { font-size: 12px; font-weight: 700; color: var(--text-2); }
.arch-bar { width: 64%; max-width: 30px; min-height: 4px; border-radius: 6px 6px 0 0; background: linear-gradient(to bottom, var(--text), var(--text-2)); transition: height .5s cubic-bezier(.2,.8,.2,1); }
.arch-bar.cur { background: linear-gradient(to bottom, var(--key), #6fe6a6); }
.arch-bar-label { font-size: 13px; font-weight: 500; color: var(--text-3); }
.arch-card-foot { margin-top: 20px; padding: 13px; border-radius: 12px; background: var(--bg-subtle); text-align: center; font-size: 13.5px; font-weight: 500; color: var(--text-2); }
.arch-card-foot b { color: var(--key); font-weight: 800; }

/* 담당자 랭킹 */
.arch-rank { display: flex; flex-direction: column; gap: 13px; }
.arch-rank-row { display: flex; align-items: center; gap: 10px; }
.arch-rank-ava { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; font-size: 11.5px; font-weight: 800; color: #fff; flex: 0 0 auto; }
.arch-rank-name { font-size: 13.5px; font-weight: 600; flex: 0 0 54px; }
.arch-rank-bar { flex: 1; height: 9px; border-radius: 5px; background: var(--bg-hover); overflow: hidden; }
.arch-rank-fill { height: 100%; background: linear-gradient(to right, #6fe6a6, var(--key)); border-radius: 5px; transition: width .5s ease; }
.arch-rank-n { font-size: 13px; font-weight: 700; color: var(--text-2); flex: 0 0 auto; min-width: 32px; text-align: right; }

/* 라벨 칩 */
.arch-labels { display: flex; flex-wrap: wrap; gap: 8px; }
.arch-label-chip { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 13px; border-radius: 10px; background: var(--bg-hover); font-size: 13.5px; font-weight: 600; color: var(--text-2); }
.arch-label-chip span { font-weight: 800; color: var(--text); }

/* 사이클별 완료 목록 */
.arch-cycle { margin-top: 6px; }
.arch-cycle-head { display: flex; align-items: center; gap: 10px; margin-bottom: 11px; }
.arch-cycle-name { font-size: 16px; font-weight: 800; letter-spacing: -0.4px; }
.arch-cycle-count { font-size: 12.5px; font-weight: 600; color: var(--text-3); background: var(--bg-hover); padding: 2px 9px; border-radius: 7px; }
.arch-list { display: flex; flex-direction: column; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.arch-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); width: 100%; text-align: left; cursor: pointer; transition: background .12s; }
.arch-item:hover { background: var(--bg-hover); }
.arch-item:last-child { border-bottom: none; }
.arch-item-id { font-size: 12px; font-weight: 500; color: var(--text-3); flex: 0 0 auto; font-variant-numeric: tabular-nums; }
.arch-item-title { font-size: 13.5px; font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.2px; }
.arch-item-meta { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.arch-item-label { font-size: 11px; font-weight: 600; color: var(--text-3); background: var(--bg-hover); padding: 2px 8px; border-radius: 6px; }
.arch-item-date { font-size: 12px; color: var(--text-3); font-variant-numeric: tabular-nums; }
@media (max-width: 1080px) {
  .arch-summary { grid-template-columns: 1fr; }
  .arch-summary-col { border-left: none; border-top: 1px solid var(--border); }
  .arch-summary-col:first-child { border-top: none; }
  .arch-charts { grid-template-columns: 1fr; }
}

.grp { border-bottom: 1px solid var(--border); }
.grp.grp-dim { opacity: 0.3; }
.grp.grp-highlight .grp-head { background: var(--key-soft); }
.grp.grp-highlight .grp-head .nm { color: var(--key); font-weight: 800; }
.bcol.grp-dim { opacity: 0.3; }
.bcol.grp-highlight .bcol-head { background: var(--key-soft); }
.bcol.grp-highlight .bcol-head .nm { color: var(--key); font-weight: 800; }
.grp-head { display: flex; align-items: center; gap: 10px; padding: 9px 22px; background: var(--bg-subtle); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 2; }
.grp-head .nm { font-size: 13px; font-weight: 800; color: var(--text); }
.grp-head .ct { font-size: 12.5px; color: var(--text-3); font-weight: 700; }
.grp-head .add { margin-left: auto; width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; color: var(--icon); transition: background .14s; }
.grp-head .add:hover { background: var(--bg-hover); }
.grp-head .add svg { width: 16px; height: 16px; }
.iss-row { display: flex; align-items: center; gap: 10px; padding: 11px 20px; border-bottom: 1px solid var(--border); transition: background .12s; width: 100%; text-align: left; }
.iss-row:last-child { border-bottom: none; }
.iss-row:hover { background: var(--bg-hover); }
.iss-row .iid { font-size: 12px; font-weight: 500; color: var(--text-3); flex: 0 0 54px; font-variant-numeric: tabular-nums; }
.iss-row .ttl { font-size: 13.5px; font-weight: 500; color: var(--text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.2px; }
.lbl { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 9px; border-radius: 5px; border: 1px solid var(--border-2); font-size: 11.5px; font-weight: 600; color: var(--text-2); flex: 0 0 auto; }
.lbl .ld { width: 7px; height: 7px; border-radius: 50%; background: var(--text-3); }
.lbl.filled { border: none; color: #1a1a1a; font-weight: 700; padding: 0 11px; border-radius: 5px; letter-spacing: -0.2px; }
.iss-due { font-size: 12px; color: var(--text-2); font-weight: 600; flex: 0 0 auto; }
.iss-cmt { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-3); font-weight: 600; flex: 0 0 auto; }
.iss-cmt svg { width: 14px; height: 14px; }
.iss-ava { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; font-size: 11px; font-weight: 700; background: var(--bg-hover); color: var(--text-2); flex: 0 0 auto; }
.iss-ava.me { background: var(--neutral-soft); color: var(--text); }
.iss-ava.none { border: 1.5px dashed var(--border-2); background: transparent; color: var(--text-3); }

/* board view */
.board { flex: 1; overflow-x: auto; overflow-y: hidden; min-height: 0; display: flex; gap: 14px; padding: 16px 22px; }
.bcol { flex: 0 0 282px; display: flex; flex-direction: column; min-height: 0; }
.bcol-head { display: flex; align-items: center; gap: 9px; padding: 4px 6px 12px; }
.bcol-head .nm { font-size: 13px; font-weight: 800; }
.bcol-head .ct { font-size: 12px; color: var(--text-3); font-weight: 700; }
.bcol-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 9px; padding-bottom: 8px; }
.bcard { border: 1px solid var(--border); border-radius: 13px; background: var(--bg); box-shadow: var(--shadow-sm); padding: 13px; display: flex; flex-direction: column; gap: 9px; transition: transform .14s, box-shadow .16s, border-color .14s; text-align: left; }
.bcard:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--text-3); }
.bcard .top { display: flex; align-items: center; gap: 8px; }
.bcard .top .iid { font-size: 12px; font-weight: 700; color: var(--text-3); }
.bcard .bt { font-size: 13.5px; font-weight: 600; line-height: 1.4; }
.bcard .bot { display: flex; align-items: center; gap: 7px; }
.bcard .bot .iss-ava { width: 22px; height: 22px; font-size: 10px; margin-left: auto; }

/* issue detail reuses .detail; extra rows */
.det-prop { display: flex; align-items: center; gap: 12px; padding: 9px 0; }
.det-prop .pk { font-size: 12.5px; color: var(--text-3); width: 80px; flex: 0 0 auto; font-weight: 600; letter-spacing: 0.01em; }
.det-prop .pv { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--text); }
.det-prop .pv .iss-ava { width: 24px; height: 24px; font-size: 11px; }
.statuspick { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.statuspick button { display: flex; align-items: center; gap: 7px; height: 30px; padding: 0 10px; border-radius: 8px; font-size: 12.5px; font-weight: 500; color: var(--text-2); background: var(--bg-subtle); transition: all .13s; }
.statuspick button.on { background: var(--bg-hover); color: var(--text); font-weight: 600; }
.det-sec-label { font-size: 12px; font-weight: 700; color: var(--text-3); margin: 20px 0 10px; }

/* ---------- command menu (Cmd+K) ---------- */
.cmd-scrim { position: fixed; inset: 0; background: rgba(16,24,40,.34); z-index: 210; display: flex; justify-content: center; align-items: flex-start; padding: 88px 20px 20px; }
.cmd { width: 580px; max-width: 100%; background: var(--bg); border: 1px solid var(--border-2); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; transform: translateY(-8px); opacity: 0; animation: cmdin .2s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes cmdin { to { transform: none; opacity: 1; } }
.cmd-input { display: flex; align-items: center; gap: 11px; padding: 16px 18px; border-bottom: 1px solid var(--border); }
.cmd-input svg { width: 19px; height: 19px; color: var(--text-3); }
.cmd-input input { flex: 1; font-size: 16px; }
.cmd-list { max-height: 380px; overflow-y: auto; padding: 8px; }
.cmd-hint-bar { font-size: 12px; color: var(--text-2); padding: 9px 14px; background: var(--bg-subtle); border-bottom: 1px solid var(--border); line-height: 1.5; }
.cmd-grp { font-size: 11.5px; font-weight: 700; color: var(--text-3); padding: 10px 12px 6px; }
.cmd-item { display: flex; align-items: center; gap: 8px; padding: 4px 6px 4px 12px; border-radius: 10px; width: 100%; text-align: left; transition: background .1s; }
.cmd-item .cmd-run { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; padding: 6px 0; }
.cmd-item svg { width: 18px; height: 18px; color: var(--icon); flex: 0 0 auto; }
.cmd-item .cl { font-size: 14px; font-weight: 600; flex: 1; }
.cmd-item.sel { background: var(--bg-active); }
.cmd-item.sel .cl { color: var(--text); }
.cmd-item.sel .cmd-run svg { color: var(--text); }
.cmd-shortcut { flex: 0 0 auto; min-width: 80px; height: 30px; padding: 0 10px; border-radius: 8px; border: 1px dashed var(--border-2); display: flex; align-items: center; justify-content: center; transition: all .12s; }
.cmd-shortcut.set { border-style: solid; background: var(--bg); }
.cmd-shortcut:hover { border-color: var(--key); background: var(--key-soft); }
.cmd-shortcut.capturing { border-color: var(--key); background: var(--key-soft); color: var(--key); font-size: 12px; font-weight: 700; }
.cmd-shortcut .cmd-shortcut-add { font-size: 12px; color: var(--text-3); font-weight: 600; }
.cmd-shortcut svg { width: auto; height: auto; }
.cmd-empty { padding: 28px; text-align: center; font-size: 13.5px; color: var(--text-3); }
.cmd-foot { display: flex; align-items: center; gap: 14px; padding: 10px 16px; border-top: 1px solid var(--border); }
.cmd-foot .ci { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-3); font-weight: 600; }

/* ---------- mobile tab bar ---------- */
.tabbar { display: none; }

@media (max-width: 1080px) {
  .panel { width: 264px; flex-basis: 264px; }
  .home-grid { grid-template-columns: 1fr; }
  .home-col { flex: unset; }
  .home-chat-panel { width: 300px; flex-basis: 300px; }
}

@media (max-width: 760px) {
  .teum { flex-direction: column; padding-bottom: 64px; }
  .rail { display: none; }
  .panel {
    width: 100%; flex-basis: auto; flex: 1; border-right: none;
    position: absolute; inset: 0 0 64px; z-index: 15;
    transform: translateX(0); transition: transform .3s cubic-bezier(.2,.8,.2,1);
  }
  .panel.hide { transform: translateX(-100%); }
  .main { position: absolute; inset: 0 0 64px; z-index: 16; transform: translateX(100%); transition: transform .3s cubic-bezier(.2,.8,.2,1); }
  .main.show { transform: translateX(0); }
  .topbar .back { display: grid; }
  .close-x { display: grid; }
  .cal-head { flex-wrap: wrap; gap: 10px; }
  .cal-month { min-width: 0; font-size: 18px; }
  .home-grid { grid-template-columns: 1fr; }
  .home-col { flex: unset; }
  .home-chat-panel { width: 100%; flex-basis: auto; border-left: none; border-top: 1px solid var(--border); }
  .chat-scroll, .composer { padding-left: 14px; padding-right: 14px; }
  .scrim { left: 0; bottom: 64px; }
  .detail { left: 0; bottom: 64px; }
  .detail-head, .detail-foot { padding-left: 18px; padding-right: 18px; }
  .detail-scroll { padding: 20px 18px 26px; }
  .tabbar {
    display: flex; position: absolute; left: 0; right: 0; bottom: 0; height: 64px; z-index: 50;
    background: var(--bg); border-top: 1px solid var(--border); padding: 6px 6px 8px;
  }
  .tabbtn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding-top: 5px; border-radius: 12px; color: var(--text-2); position: relative; transition: color .15s; }
  .tabbtn svg { width: 22px; height: 22px; color: var(--icon); stroke-width: 1.9; }
  .tabbtn span { font-size: 11px; font-weight: 600; }
  .tabbtn.on { color: var(--text); }
  .tabbtn.on svg { color: var(--text); }
  .tabbadge { position: absolute; top: 1px; right: 50%; margin-right: -20px; min-width: 15px; height: 15px; padding: 0 4px; border-radius: 8px; background: var(--key); color: #fff; font-size: 9.5px; font-weight: 700; display: grid; place-items: center; border: 2px solid var(--bg); }
}

@media (prefers-reduced-motion: reduce) {
  .teum *, .teum *::before, .teum *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
`;

/* ----------------------------- data ----------------------------- */
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const MON = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

/* presence는 lastActiveMin(자정 기준 분, 마지막 활동 시각)을 현재 시각과 비교해 실시간 계산한다.
 * 초록(활동 중): 근무 중이거나 방금 활동 / 노랑: 종료 후 1시간 이내 / 회색: 1시간 초과(오프라인) */
const TEAM = [
  { id: "주", name: "주헌", role: "대표 · 크리에이티브 디렉터", ini: "주", me: true },
  { id: "소", name: "소라", role: "아트 디렉터", ini: "소", working: true, lastActiveMin: null },
  { id: "민", name: "민우", role: "카피라이터", ini: "민", working: false, lastActiveMin: 13 * 60 + 35 },
  { id: "예", name: "예인", role: "프로젝트 매니저", ini: "예", working: false, lastActiveMin: 12 * 60 + 10 },
];
// 마지막 활동 시각/근무여부 → presence 상태 산출
function computePresence(member, nowMin, working) {
  // 근무 중이면 활동 중(초록)
  if (member?.me ? working : member?.working) return "on";
  const last = member?.lastActiveMin;
  if (last == null) return "off";
  const gap = nowMin - last;
  if (gap < 0) return "on";          // 미래 값 방어
  if (gap <= 60) return "away";      // 종료 후 1시간 이내(노랑)
  return "off";                       // 1시간 초과(회색)
}

/* team-wide group chat */
const TEAM_CHAT = [
  { id: 1, who: "주헌", ini: "주", me: true, time: "오전 9:02", text: "다들 좋은 아침이에요. 오늘 스탠드업 10시에 짧게 할게요." },
  { id: 2, who: "민우", ini: "민", time: "오전 9:14", text: "넵 준비됐습니다." },
  { id: 3, who: "소라", ini: "소", time: "오전 9:20", text: "저는 5분 늦을 수 있어요. 먼저 시작하세요.", reacts: [{ e: "👍", n: 2 }] },
  { id: 4, who: "소라", ini: "소", time: "오전 10:12", text: "신규 캠페인 키비주얼 시안 세 가지 올려둘게요. 톤이 조금씩 달라요." },
  { id: 5, who: "소라", ini: "소", time: "오전 10:12", cont: true, text: "다들 보고 의견 주세요.", reacts: [{ e: "👀", n: 3 }, { e: "🔥", n: 2, mine: true }] },
  { id: 6, who: "민우", ini: "민", time: "오전 10:34", text: "두 번째 시안이 제일 깔끔해요. 여백을 더 살리면 좋을 듯해요." },
  {
    id: 7, who: "주헌", ini: "주", me: true, time: "오전 10:51",
    text: "좋아요. 클라이언트랑 같이 보면서 정하죠. 리뷰 일정 잡았어요.",
    event: { id: "ev-review", month: "6월", day: "17", title: "키비주얼 리뷰 미팅", time: "오후 2:00 ~ 3:00", place: "회의실 A" },
  },
  { id: 8, who: "예인", ini: "예", time: "오전 11:08", text: "참석할게요. 자료 미리 공유 부탁드려요." },
  { id: 9, who: "예인", ini: "예", time: "어제", text: "프로젝트 일정표 캘린더에 정리해뒀어요. 마감일 확인해주세요." },
  {
    id: 10, who: "예인", ini: "예", time: "어제", cont: true, text: "특히 다음 주가 빡빡합니다.",
    event: { id: "ev-deadline", month: "6월", day: "22", title: "캠페인 1차 마감", time: "종일", place: "" },
  },
];

/* 1:1 DMs with each member */
const DM_CHATS = {
  소: [
    { id: 1, who: "소라", ini: "소", time: "오전 9:40", text: "키비주얼 시안 파일 공유드렸어요. 확인 부탁드려요." },
    { id: 2, who: "주헌", ini: "주", me: true, time: "오전 9:55", text: "확인했어요. 두 번째 방향으로 가는 게 좋겠네요." },
    { id: 3, who: "소라", ini: "소", time: "오전 10:02", text: "넵, 그 방향으로 다듬어서 다시 올릴게요." },
  ],
  민: [
    { id: 1, who: "민우", ini: "민", time: "어제", text: "카피 초안 다음 주 초까지 정리해서 드릴게요." },
    { id: 2, who: "주헌", ini: "주", me: true, time: "어제", text: "좋아요. 톤은 지난번 가이드 기준으로 부탁해요." },
  ],
  예: [
    { id: 1, who: "예인", ini: "예", time: "오늘", text: "스튜디오 예약 견적 받으면 바로 공유드릴게요." },
    { id: 2, who: "주헌", ini: "주", me: true, time: "오늘", text: "네 감사합니다." },
  ],
};

/* 일정 색상 팔레트 — 첫 번째가 기본(키컬러) */
const EVENT_COLORS = [
  { key: "green", name: "초록", val: "#05d560" },
  { key: "blue", name: "파랑", val: "#2f8fe0" },
  { key: "purple", name: "보라", val: "#7c6fe0" },
  { key: "orange", name: "주황", val: "#e87040" },
  { key: "pink", name: "핑크", val: "#e0559a" },
  { key: "amber", name: "노랑", val: "#e0a82f" },
  { key: "gray", name: "회색", val: "#8b919a" },
];
const EVENT_COLOR_MAP = Object.fromEntries(EVENT_COLORS.map((c) => [c.key, c.val]));

const EVENTS = [
  { id: "e1", date: "2026-06-15", start: "오전 10:00", end: "오전 10:20", title: "데일리 스탠드업", type: "team", place: "온라인", att: ["주", "소", "민", "예"] },
  { id: "e2", date: "2026-06-15", start: "오후 4:00", end: "오후 5:00", title: "디자인 싱크", type: "team", place: "회의실 B", att: ["소", "민"] },
  { id: "e3", date: "2026-06-16", start: "오후 1:00", end: "오후 2:00", title: "벤더 미팅", type: "personal", place: "강남", att: ["주"] },
  { id: "e4", date: "2026-06-17", start: "오후 2:00", end: "오후 3:00", title: "키비주얼 리뷰 미팅", type: "team", place: "회의실 A", att: ["주", "소", "민", "예"] },
  { id: "e5", date: "2026-06-18", start: "오전 11:00", end: "오후 12:00", title: "촬영 사전 점검", type: "team", place: "스튜디오", att: ["민", "예"] },
  { id: "e6", date: "2026-06-19", start: "오후 2:00", end: "오후 6:00", title: "전사 워크숍", type: "team", place: "라운지", att: ["주", "소", "민", "예"] },
  { id: "e7", date: "2026-06-22", start: "종일", end: "", title: "캠페인 1차 마감", type: "team", place: "", att: ["주", "소", "민", "예"] },
  { id: "e8", date: "2026-06-23", start: "오전 9:30", end: "오전 10:00", title: "주간 회고", type: "team", place: "회의실 A", att: ["주", "소", "민", "예"] },
  { id: "e9", date: "2026-06-25", start: "오후 3:00", end: "오후 4:00", title: "클라이언트 보고", type: "team", place: "온라인", att: ["주", "소"] },
  { id: "e10", date: "2026-06-11", start: "오후 5:00", end: "오후 6:00", title: "예산 점검", type: "personal", place: "", att: ["주"] },
];

/* ---- attendance / work session (Shiftee 출퇴근 + 열품타 비교·동기부여) ---- */
// 오늘(6/15) 팀원별 근무 현황. 분 단위.
const TEAM_TODAY = {
  주: { working: false, minutes: 0, sessions: [] }, // 사용자 — 타이머로 직접 채워짐
  소: { working: true, minutes: 245, startedAt: "오전 9:50" },
  민: { working: true, minutes: 198, startedAt: "오전 10:32" },
  예: { working: false, minutes: 312 },
};
// 최근 7일 누적 근무시간(분) — 팀 평균 비교용
const WEEK_MINUTES = {
  주: [380, 410, 0, 360, 395, 0, 0],
  소: [420, 430, 0, 400, 410, 0, 0],
  민: [350, 360, 0, 330, 340, 0, 0],
  예: [400, 390, 0, 370, 380, 0, 0],
};

const ALL_MEMBERS = ["주", "소", "민", "예"];

const IDEAS = [
  {
    id: "i1", author: "소라", ini: "소", time: "2시간 전", status: "review", me: false,
    title: "버려진 우산으로 만드는 빗물 캠페인",
    desc: "지하철역에 쌓이는 분실 우산을 모아 도시 빗물 데이터를 시각화하는 설치물로 재구성하는 공익 캠페인. 우산 한 개가 하루 강수량을 보여주는 구조로, 환경과 분실물 문제를 동시에 건드립니다.",
    tags: ["공익", "설치", "환경"],
    recs: 8, recommended: true, recBy: ["소", "민", "예"], ratingSum: 26, ratingCount: 6, myRating: 0, comments: 3,
    linkedIssue: null,
  },
  {
    id: "i2", author: "민우", ini: "민", time: "어제", status: "picked", me: false,
    title: "마감 없는 광고, 매일 한 줄씩 자라는 카피",
    desc: "옥외 전광판에 매일 한 문장씩 추가되는 카피를 노출해 행인이 이야기의 다음 줄을 기다리게 만드는 시리즈 광고. 완결을 미루는 방식으로 자발적 재방문을 유도합니다.",
    tags: ["카피", "OOH", "시리즈"],
    recs: 12, recommended: false, recBy: ["주", "소", "민", "예"], ratingSum: 38, ratingCount: 8, myRating: 4, comments: 5,
    linkedIssue: null,
  },
  {
    id: "i3", author: "예인", ini: "예", time: "2일 전", status: "review", me: false,
    title: "팀 회고를 음성 메모로 모으는 주간 루틴",
    desc: "매주 금요일에 각자 30초 음성 메모로 한 주를 회고하고, 다음 주 우선순위를 자동으로 정리하는 내부 운영 아이디어.",
    tags: ["운영", "회고"],
    recs: 5, recommended: false, recBy: ["소", "예"], ratingSum: 17, ratingCount: 4, myRating: 0, comments: 1,
    linkedIssue: null,
  },
  {
    id: "i4", author: "주헌", ini: "주", time: "3일 전", status: "hold", me: true,
    title: "소리로 듣는 브랜드 가이드라인",
    desc: "브랜드 컬러와 무드를 사운드로 변환해, 시각 자료 없이도 톤을 공유할 수 있는 오디오 무드보드. 청각장애 인권 캠페인에서 영감을 받았습니다.",
    tags: ["브랜딩", "사운드", "실험"],
    recs: 3, recommended: false, recBy: ["주"], ratingSum: 9, ratingCount: 3, myRating: 0, comments: 2,
    linkedIssue: null,
  },
];

const IDEA_COMMENTS = {
  i1: [
    { ini: "민", who: "민우", tx: "분실물 데이터 출처만 확보되면 바로 제안서 가능할 것 같아요." },
    { ini: "예", who: "예인", tx: "설치 장소 협의가 관건이겠네요. 역사 측에 먼저 문의해볼게요." },
    { ini: "주", who: "주헌", tx: "빗물 시각화 방식이 신선해요. 리뷰 미팅 안건에 넣죠." },
  ],
  i2: [
    { ini: "소", who: "소라", tx: "비주얼은 타이포만으로 가도 충분히 강할 듯합니다." },
    { ini: "주", who: "주헌", tx: "채택. 다음 캠페인에 바로 적용해봐요." },
  ],
};

/* ---- Linear-style issues (simplified: 4 statuses only) ---- */
/* ---- 사이클 시스템: 주 단위 자동 계산/리셋 ----
 * 기준일(CYCLE_ANCHOR)부터 7일씩 끊어 사이클 번호와 범위를 산출한다.
 * 현재 날짜가 속한 사이클이 "현재 사이클"이고, 매주 자동으로 다음 사이클로 넘어간다.
 * 지난 사이클의 이슈는 ARCHIVE에 보존된다. */
const CYCLE_ANCHOR = new Date("2026-01-05"); // 사이클 1 시작일(월요일)
const CYCLE_LEN_DAYS = 7;

function getCycleInfo(dateStr) {
  const today = new Date(dateStr);
  const diffDays = Math.floor((today - CYCLE_ANCHOR) / (1000 * 60 * 60 * 24));
  const cycleIdx = Math.floor(diffDays / CYCLE_LEN_DAYS); // 0-based
  const start = new Date(CYCLE_ANCHOR);
  start.setDate(start.getDate() + cycleIdx * CYCLE_LEN_DAYS);
  const end = new Date(start);
  end.setDate(end.getDate() + CYCLE_LEN_DAYS - 1);
  const fmt = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return {
    num: cycleIdx + 1,
    name: `사이클 ${cycleIdx + 1}`,
    range: `${fmt(start)} ~ ${fmt(end)}`,
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
    idx: cycleIdx,
  };
}

const PRIORITY = ["없음", "낮음", "보통", "높음", "긴급"]; // index 0..4
const STATUS_ORDER = ["backlog", "todo", "progress", "done"];
const STATUS_META = {
  backlog: { label: "백로그", kind: "backlog" },
  todo: { label: "할 일", kind: "todo" },
  progress: { label: "진행 중", kind: "progress" },
  done: { label: "완료", kind: "done" },
};
const DOW_KR = ["일", "월", "화", "수", "목", "금", "토"];

const ISSUES = [
  { id: "IMB-31", title: "키비주얼 시안 3종 최종 검토", status: "progress", priority: 3, assignee: "소", cycle: true, labels: ["디자인"], due: "2026-06-17", comments: 4,
    desc: "클라이언트 리뷰 전 시안 3종을 점검하고 여백과 타이포 위계를 정리한다." },
  { id: "IMB-30", title: "캠페인 카피 1차 라인업 작성", status: "progress", priority: 2, assignee: "민", cycle: true, labels: ["카피"], due: "2026-06-18", comments: 2,
    desc: "옥외 시리즈 광고용 한 줄 카피 후보 20개를 뽑고 톤별로 분류한다.", fromIdea: "i2" },
  { id: "IMB-29", title: "촬영 스튜디오 예약 확정", status: "todo", priority: 3, assignee: "예", cycle: true, labels: ["운영"], due: "2026-06-18", comments: 1,
    desc: "촬영 일정에 맞춰 스튜디오와 장비를 예약하고 견적을 받는다." },
  { id: "IMB-28", title: "클라이언트 보고 자료 초안", status: "todo", priority: 2, assignee: "주", cycle: true, labels: ["기획"], due: "2026-06-24", comments: 0,
    desc: "보고용 덱 구조를 잡고 핵심 메시지 세 가지를 정리한다." },
  { id: "IMB-27", title: "분실 우산 데이터 출처 확보", status: "backlog", priority: 1, assignee: "민", cycle: false, labels: ["리서치"], due: "", comments: 3,
    desc: "공익 캠페인 아이디어에 필요한 분실물 통계의 공식 출처를 찾는다." },
  { id: "IMB-26", title: "전사 워크숍 안건 정리", status: "backlog", priority: 2, assignee: "주", cycle: false, labels: ["운영"], due: "2026-06-19", comments: 1,
    desc: "워크숍에서 다룰 주제와 진행 순서를 정한다." },
  { id: "IMB-25", title: "긴급: 랜딩 페이지 폼 오류 수정", status: "backlog", priority: 4, assignee: null, cycle: false, labels: ["버그"], due: "", comments: 0,
    desc: "문의 폼 제출이 간헐적으로 실패한다는 제보. 재현과 원인 파악이 필요하다." },
  { id: "IMB-24", title: "신규 제휴 문의 검토", status: "backlog", priority: 2, assignee: null, cycle: false, labels: [], due: "", comments: 0,
    desc: "외부에서 들어온 협업 제안을 검토하고 담당자를 정한다." },
  { id: "IMB-23", title: "브랜드 컬러 토큰 정리", status: "done", priority: 1, assignee: "소", cycle: true, labels: ["디자인"], due: "", comments: 2, completedAt: "2026-06-12", completedDow: 5,
    desc: "디자인 시스템 컬러 토큰을 단일 키컬러 기준으로 정리 완료." },
  { id: "IMB-22", title: "주간 회고 템플릿 작성", status: "done", priority: 1, assignee: "예", cycle: true, labels: ["운영"], due: "", comments: 0, completedAt: "2026-06-11", completedDow: 4,
    desc: "회고용 템플릿을 만들어 모두에게 공유 완료." },
];

/* ---- 아카이브: 지난 사이클들의 완료된 업무 기록 ----
 * 각 이슈에 cycleNum(소속 사이클), completedAt(완료일), completedDow(완료 요일 0=일),
 * leadDays(생성→완료 소요일)를 기록해 통계 추출에 사용한다. */
const ARCHIVE = [
  // 사이클 2 (6월 2일 ~ 6월 8일)
  { id: "IMB-21", title: "6월 뉴스레터 발송", cycleNum: 2, assignee: "예", labels: ["마케팅"], priority: 2, completedAt: "2026-06-08", completedDow: 1, leadDays: 3, comments: 2 },
  { id: "IMB-20", title: "광고 성과 리포트 정리", cycleNum: 2, assignee: "민", labels: ["기획"], priority: 2, completedAt: "2026-06-06", completedDow: 6, leadDays: 2, comments: 1 },
  { id: "IMB-19", title: "SNS 콘텐츠 캘린더 작성", cycleNum: 2, assignee: "소", labels: ["마케팅"], priority: 3, completedAt: "2026-06-06", completedDow: 6, leadDays: 4, comments: 5 },
  { id: "IMB-18", title: "신규 폰트 라이선스 확인", cycleNum: 2, assignee: "소", labels: ["디자인"], priority: 1, completedAt: "2026-06-05", completedDow: 5, leadDays: 1, comments: 0 },
  { id: "IMB-17", title: "클라이언트 미팅 후속 정리", cycleNum: 2, assignee: "주", labels: ["기획"], priority: 2, completedAt: "2026-06-05", completedDow: 5, leadDays: 1, comments: 3 },
  { id: "IMB-16", title: "랜딩페이지 카피 수정", cycleNum: 2, assignee: "민", labels: ["카피"], priority: 2, completedAt: "2026-06-04", completedDow: 4, leadDays: 2, comments: 2 },
  { id: "IMB-15", title: "촬영 콘티 1차안", cycleNum: 2, assignee: "예", labels: ["기획"], priority: 3, completedAt: "2026-06-03", completedDow: 3, leadDays: 5, comments: 4 },
  // 사이클 1 (5월 26일 ~ 6월 1일)
  { id: "IMB-14", title: "브랜드 가이드라인 초안", cycleNum: 1, assignee: "소", labels: ["디자인"], priority: 3, completedAt: "2026-06-01", completedDow: 1, leadDays: 6, comments: 7 },
  { id: "IMB-13", title: "경쟁사 캠페인 리서치", cycleNum: 1, assignee: "민", labels: ["리서치"], priority: 2, completedAt: "2026-05-30", completedDow: 6, leadDays: 3, comments: 2 },
  { id: "IMB-12", title: "제안서 템플릿 정비", cycleNum: 1, assignee: "주", labels: ["기획"], priority: 1, completedAt: "2026-05-29", completedDow: 5, leadDays: 2, comments: 1 },
  { id: "IMB-11", title: "인스타 릴스 3편 편집", cycleNum: 1, assignee: "예", labels: ["마케팅"], priority: 2, completedAt: "2026-05-29", completedDow: 5, leadDays: 4, comments: 3 },
  { id: "IMB-10", title: "웹사이트 접근성 점검", cycleNum: 1, assignee: "소", labels: ["디자인"], priority: 2, completedAt: "2026-05-28", completedDow: 4, leadDays: 2, comments: 0 },
  { id: "IMB-09", title: "키워드 광고 세팅", cycleNum: 1, assignee: "민", labels: ["마케팅"], priority: 3, completedAt: "2026-05-27", completedDow: 3, leadDays: 1, comments: 1 },
];

/* ---- briefs (채택된 아이디어 → 광고 브리프로 전환) ----
 * 섹션 구조: Background | Insight | Idea | Effect
 * 각 블록: { id, text, editedBy(ini), editedAt }
 * TODO: Supabase realtime 연동 시 아래 구조를 그대로 upsert
 *   table: briefs(id, idea_id, title, sections jsonb, updated_at)
 *   realtime: supabase.channel('briefs').on('postgres_changes', ...) */
const mkBlock = (text, by = "", at = "") => ({ id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), text, editedBy: by, editedAt: at });
const INIT_BRIEFS = [
  {
    id: "br-i2",
    ideaId: "i2",
    ideaAuthorIni: "민",
    linkedIssueId: null,
    title: "마감 없는 광고, 매일 한 줄씩 자라는 카피",
    createdAt: "2026-06-14",
    sections: {
      background: [mkBlock("옥외 광고는 대부분 단기 노출로 끝나며 수용자의 재방문 동기를 만들지 못한다.", "예", "2026-06-14")],
      insight: [mkBlock("사람들은 '다음'이 궁금할 때 자발적으로 돌아온다. 미완결 콘텐츠는 완결된 것보다 기억에 더 오래 남는다. (자이가르니크 효과)", "민", "2026-06-14")],
      idea: [mkBlock("전광판에 매일 한 문장씩 추가되는 카피를 노출한다. 행인은 오늘의 문장을 보고 내일 어떤 줄이 추가될지 궁금해 다시 찾아온다.", "민", "2026-06-14"), mkBlock("각 문장은 독립적으로도 읽히고, 전체를 이어 읽으면 하나의 이야기가 된다.", "소", "2026-06-15")],
      effect: [mkBlock("브랜드 메시지의 자발적 재접촉률 증가, SNS 목격 인증 확산, 광고비 대비 장기 노출 효과 극대화.", "예", "2026-06-14")],
    },
    editLog: [
      { ini: "민", name: "민우", action: "브리프 초안 작성", at: "2026-06-14 오후 3:12" },
      { ini: "소", name: "소라", action: "Idea 섹션 2번 블록 추가", at: "2026-06-15 오전 10:22" },
      { ini: "예", name: "예인", action: "Effect 섹션 수정", at: "2026-06-15 오전 11:05" },
    ],
  },
];

const SECTION_LABELS = { background: "Background", insight: "Insight", idea: "Idea", effect: "Effect" };
const SECTION_ORDER = ["background", "insight", "idea", "effect"];
const SECTION_ICON = {
  background: Globe,
  insight: Lightbulb,
  idea: Pencil,
  effect: BarChart2,
};
const SECTION_DESC = {
  background: "이 아이디어가 나온 배경과 시장 상황을 설명하세요.",
  insight: "핵심 인사이트, 소비자 심리, 또는 관련 이론을 적어주세요.",
  idea: "광고/캠페인 아이디어를 구체적으로 작성하세요.",
  effect: "이 아이디어가 만들어낼 효과와 기대 지표를 기술하세요.",
};
// 팀원별 아바타 색상 (익명이지만 편집자 구분용)
const EDITOR_COLOR = { 주: "var(--key)", 소: "#7c6fe0", 민: "#e87040", 예: "#2fa8e0" };

/* ---- 라벨 색상 시스템 ----
 * 브리프 제목으로 생성된 라벨은 검은 글씨가 잘 보이는 밝은 파스텔 색을 무작위로 배정받는다. */
const PASTEL_LABEL_COLORS = [
  "#d7f0c2", "#c7ecdc", "#c5e8f5", "#d3dcfa", "#e6d5f7",
  "#fad5e6", "#fcdcc7", "#fbeec2", "#e8e3d5", "#cdeede",
  "#f5d5d5", "#d5eef5", "#e0f0c8", "#f0dcf5", "#f7e3c5",
];
// 현재 미완료 이슈에 쓰이고 있는 브리프 라벨 색(active)을 제외하고 무작위 배정
function randomLabelColor(usedColors = []) {
  const pool = PASTEL_LABEL_COLORS.filter((c) => !usedColors.includes(c));
  const arr = pool.length ? pool : PASTEL_LABEL_COLORS;
  return arr[Math.floor(Math.random() * arr.length)];
}
// 기본 라벨 + 브리프에서 생성된 라벨
const INIT_LABEL_COLORS = {
  "SNS":    "#c5e8f5",
  "계약":   "#fad5e6",
  "디자인": "#d3dcfa",
  "PT":     "#fbeec2",
  "운영":   "#c7ecdc",
  "리서치": "#e6d5f7",
};

/* ----------------------------- helpers ----------------------------- */
function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const weeks = [];
  let cur = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        y: cur.getFullYear(), m: cur.getMonth(), d: cur.getDate(),
        inMonth: cur.getMonth() === month,
        iso: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`,
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
    if (cur.getMonth() !== month && w >= 4) break;
  }
  return weeks;
}

/* ----------------------------- app ----------------------------- */
function ListTeam({ team, working, selDM, onSelect, presenceOf, notifications, unreadCount, notifOpen, setNotifOpen, onOpenNotif, onMarkAllRead }) {
  const [q, setQ] = useState("");
  const filtered = q.trim() ? team.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.role || "").toLowerCase().includes(q.toLowerCase())) : team;
  return (
    <>
      <div className="panel-head">
        <div className="ws-row">
          <div className="ws-name">대시보드</div>
        </div>
        <div className="searchbox"><Search /><input placeholder="팀원 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="panel-scroll">
        {!q && <>
          <div className="sec-label">팀 대화</div>
          <button className={`row${selDM === null ? " on" : ""}`} onClick={() => onSelect(null)}>
            <span className="avatar"><Users style={{ width: 16, height: 16 }} /></span>
            <span className="row-title">전체</span>
          </button>
          <div className="sec-label">다이렉트 메시지</div>
          {team.filter((p) => !p.me).map((p) => (
            <button key={p.id} className={`row${selDM === p.id ? " on" : ""}`} onClick={() => onSelect(p.id)}>
              <UserAvatar ini={p.ini} size={28} radius={8} presence={presenceOf(p)} />
              <span className="row-title">{p.name}</span>
            </button>
          ))}
        </>}
        <div className="sec-label">멤버{q ? ` · "${q}" 검색` : ""}</div>
        {filtered.map((p) => (
          <div className="row" key={p.id} style={{ cursor: "default" }}>
            <UserAvatar ini={p.ini} size={28} radius={8} presence={presenceOf(p)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row-title">{p.name}{p.me ? " (나)" : ""}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>{p.role}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: "12px 8px", fontSize: 13, color: "var(--text-3)" }}>검색 결과가 없어요.</div>}
      </div>
    </>
  );
}

function fmtHM(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h <= 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}
// 한국어 시각("오전 9:30" / "오후 2:00" / "종일")을 자정 기준 분으로 변환. 실패 시 null
function parseKoTime(str) {
  if (!str || str === "종일") return null;
  const m = str.match(/(오전|오후)?\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let h = parseInt(m[2], 10);
  const min = parseInt(m[3], 10);
  if (m[1] === "오후" && h < 12) h += 12;
  if (m[1] === "오전" && h === 12) h = 0;
  return h * 60 + min;
}
function fmtHMS(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function fmtHMSms(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10); // centiseconds (2 digits)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/* ----------------------------- list: calendar ----------------------------- */
function ListCalendar({ upcoming, onEvent, onAdd, onPoll }) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? upcoming.filter((e) => e.title.includes(q) || (e.place && e.place.includes(q)))
    : upcoming;
  return (
    <>
      <div className="panel-head">
        <div className="ws-row">
          <div className="ws-name"><CalendarIcon style={{ width: 18, height: 18, color: "var(--icon)" }} />다가오는 일정</div>
          <button className="iconbtn" title="일정 추가" onClick={onAdd}><Plus /></button>
        </div>
        <div className="searchbox"><Search /><input placeholder="일정 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="panel-scroll">
        <button className="addbtn" onClick={onPoll}>회의 일정 조율</button>
        {q.trim() && filtered.length === 0 && (
          <div style={{ padding: "8px 10px", fontSize: 13, color: "var(--text-3)" }}>결과가 없어요.</div>
        )}
        {filtered.map((e) => {
          const dt = new Date(e.date);
          return (
            <button key={e.id} className="ev-row" onClick={() => onEvent(e)}>
              <div className="ev-date">
                <div className="d">{dt.getDate()}</div>
                <div className="w">{DOW[dt.getDay()]}</div>
              </div>
              <div className={`ev-body${e.type === "personal" && !e.color ? " gray" : ""}`}
                style={e.color ? { borderColor: EVENT_COLOR_MAP[e.color] } : undefined}>
                <div className="ev-title">{e.title}</div>
                <div className="ev-time">{e.start}{e.end ? ` ~ ${e.end}` : ""}{e.place ? ` · ${e.place}` : ""}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ----------------------------- 회의 일정 조율 카드 (when2meet 스타일) ----------------------------- */
function PollCard({ poll, onVote }) {
  const me = poll.votes["주"] || [];
  const members = ALL_MEMBERS;
  // 슬롯별 가능 인원 수 집계
  function countFor(slotKey) {
    return members.filter((ini) => (poll.votes[ini] || []).includes(slotKey)).length;
  }
  const maxCount = members.length;
  // 최적 시간(가장 많이 겹치는 슬롯) 찾기
  let best = null, bestN = 0;
  poll.dates.forEach((d) => poll.times.forEach((t) => {
    const k = `${d}|${t}`; const n = countFor(k);
    if (n > bestN) { bestN = n; best = k; }
  }));
  const fmtDate = (iso) => { const dt = new Date(iso); return `${dt.getMonth() + 1}/${dt.getDate()}(${DOW_KR[dt.getDay()]})`; };

  return (
    <div className="poll-card">
      <div className="poll-head">
        <span className="poll-ic"><Users /></span>
        <div>
          <div className="poll-title">{poll.title}</div>
          <div className="poll-sub">가능한 시간을 탭하세요 · {members.length}명 중 응답</div>
        </div>
      </div>

      <div className="poll-grid" style={{ gridTemplateColumns: `auto repeat(${poll.dates.length}, 1fr)` }}>
        {/* 헤더: 날짜 */}
        <div className="poll-cell poll-corner" />
        {poll.dates.map((d) => <div key={d} className="poll-cell poll-dhead">{fmtDate(d)}</div>)}
        {/* 행: 시간대 */}
        {poll.times.map((t) => (
          <React.Fragment key={t}>
            <div className="poll-cell poll-thead">{t}</div>
            {poll.dates.map((d) => {
              const k = `${d}|${t}`;
              const n = countFor(k);
              const mine = me.includes(k);
              const ratio = n / maxCount;
              const isBest = k === best && bestN > 1;
              return (
                <button key={k}
                  className={`poll-cell poll-slot${mine ? " mine" : ""}${isBest ? " best" : ""}`}
                  style={{ background: n > 0 ? `color-mix(in srgb, var(--key) ${Math.round(ratio * 70 + 10)}%, transparent)` : undefined }}
                  onClick={() => onVote(poll.id, k)}
                  title={`${n}명 가능`}>
                  {n > 0 && <span className="poll-n">{n}</span>}
                  {mine && <Check className="poll-check" />}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {best && bestN > 1 && (
        <div className="poll-best">
          <Check style={{ width: 14, height: 14 }} />
          가장 많이 겹치는 시간: <b>{fmtDate(best.split("|")[0])} {best.split("|")[1]}</b> ({bestN}명)
        </div>
      )}
      <div className="poll-legend">
        {members.map((ini) => {
          const voted = (poll.votes[ini] || []).length > 0;
          return <span key={ini} className={`poll-leg${voted ? " on" : ""}`}><UserSilhouette ini={ini} size={18} radius={5} />{fullName(ini)}{voted ? "" : " (미응답)"}</span>;
        })}
      </div>
    </div>
  );
}

/* ----------------------------- 플로팅 채팅 창 (앱 내부 새 창) ----------------------------- */
function FloatingChat({ partner, messages, onSend, onClose }) {
  const [pos, setPos] = useState({ x: Math.max(20, window.innerWidth - 460), y: 90 });
  const [text, setText] = useState("");
  const drag = useRef(null);
  const bodyRef = useRef(null);
  const title = partner ? partner.name : "팀 전체 대화";

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  function onPointerDown(e) {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const nx = drag.current.ox + (e.clientX - drag.current.sx);
    const ny = drag.current.oy + (e.clientY - drag.current.sy);
    setPos({ x: Math.max(0, Math.min(window.innerWidth - 120, nx)), y: Math.max(0, Math.min(window.innerHeight - 60, ny)) });
  }
  function onPointerUp() {
    drag.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }
  function submit() {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  }

  return (
    <div className="floatchat" style={{ left: pos.x, top: pos.y }}>
      <div className="floatchat-head" onPointerDown={onPointerDown}>
        {partner ? <UserSilhouette ini={partner.ini} size={22} radius={7} /> : <Users style={{ width: 16, height: 16 }} />}
        <span className="floatchat-title">{title}</span>
        <button className="iconbtn" title="닫기" onClick={onClose}><X /></button>
      </div>
      <div className="floatchat-body" ref={bodyRef}>
        {messages.length === 0 && <div className="floatchat-empty">아직 대화가 없어요</div>}
        {messages.map((m) => (
          <div className={`fc-row ${m.me ? "me" : "you"}`} key={m.id}>
            {!m.me && <div className="fc-who">{m.who}</div>}
            <div className="fc-bubble">{m.text}</div>
            <div className="fc-time">{m.time}</div>
          </div>
        ))}
      </div>
      <div className="floatchat-composer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder={`${title}에 메시지 보내기`}
        />
        <button className="fc-send" onClick={submit} disabled={!text.trim()}><Send /></button>
      </div>
    </div>
  );
}

/* ----------------------------- chat (team-wide or DM) ----------------------------- */
function ChatView({ chat, draft, setDraft, focus, setFocus, onSend, scrollRef, onEvent, onRef, placeholder = "메시지 보내기", timePolls, onVotePoll, typingUser }) {
  const [reactions, setReactions] = useState({});
  const [attended, setAttended] = useState({});
  const [reactPickFor, setReactPickFor] = useState(null);
  // 타이핑 시뮬: 내가 입력 중일 때 랜덤 팀원도 잠깐 타이핑하는 척
  const [simulTyping, setSimulTyping] = useState(null);
  const simulTimer = useRef(null);
  useEffect(() => {
    if (draft.length > 0 && !simulTyping) {
      const pick = ["소라", "민우", "예인"][Math.floor(Math.random() * 3)];
      simulTimer.current = setTimeout(() => setSimulTyping(pick), 800 + Math.random() * 600);
    }
    if (draft.length === 0) {
      clearTimeout(simulTimer.current);
      setSimulTyping(null);
    }
    return () => clearTimeout(simulTimer.current);
  }, [draft]);
  useEffect(() => {
    if (simulTyping) {
      const t = setTimeout(() => setSimulTyping(null), 2500 + Math.random() * 1500);
      return () => clearTimeout(t);
    }
  }, [simulTyping]);
  function toggleReact(msgId, emoji) {
    setReactions((r) => {
      const cur = r[msgId] || {};
      const next = { ...cur };
      if (next[emoji]) { next[emoji] -= 1; if (next[emoji] <= 0) delete next[emoji]; }
      else next[emoji] = 1;
      return { ...r, [msgId]: next };
    });
    setReactPickFor(null);
  }
  return (
    <>
      <div className="chat-scroll fade" ref={scrollRef}>
        {chat.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 13.5 }}>
            아직 대화가 없어요. 첫 메시지를 보내보세요.
          </div>
        )}
        {chat.length > 0 && <div className="day-div"><span>오늘</span></div>}
        {chat.map((m) => (          <div key={m.id} className={`msg${m.cont ? " cont" : ""}`}>
            <UserAvatar ini={m.ini} size={36} radius={11} />
            <div className="msg-body">
              {!m.cont && (
                <div className="msg-meta"><span className="msg-name">{m.who}</span><span className="msg-time">{m.time}</span></div>
              )}
              <div className="msg-text">{m.text}</div>
              {m.ref && m.ref.kind === "poll" && (() => {
                const poll = (timePolls || []).find((p) => p.id === m.ref.pollId);
                return poll ? <PollCard poll={poll} onVote={onVotePoll} /> : null;
              })()}
              {m.ref && m.ref.kind !== "poll" && (
                <div className="ref-card" onClick={() => onRef(m.ref)}>
                  <span className={`ref-icon ${m.ref.kind}`}>
                    {m.ref.kind === "idea" && <Lightbulb />}
                    {m.ref.kind === "issue" && <ListTodo />}
                    {m.ref.kind === "event" && <CalendarIcon />}
                  </span>
                  <div className="ref-body">
                    <div className="ref-tag">{m.ref.kind === "idea" ? "아이디어" : m.ref.kind === "issue" ? "이슈" : "일정"}</div>
                    <div className="ref-title">{m.ref.title}</div>
                    {m.ref.sub && <div className="ref-sub">{m.ref.sub}</div>}
                  </div>
                  <ArrowUpRight className="ref-arrow" />
                </div>
              )}
              {m.event && (
                <div className="ev-card">
                  <div className="ev-card-top">
                    <div className="ev-card-cal">
                      <div className="m">{m.event.month}</div>
                      <div className="d">{m.event.day}</div>
                    </div>
                    <div className="ev-card-info">
                      <div className="t">{m.event.title}</div>
                      <div className="meta"><Clock />{m.event.time}</div>
                      {m.event.place && <div className="meta"><MapPin />{m.event.place}</div>}
                    </div>
                  </div>
                  <div className="ev-card-foot">
                    <button onClick={() => onEvent({ id: m.event.id, date: "2026-06-" + m.event.day, start: m.event.time.split(" ~ ")[0], end: m.event.time.split(" ~ ")[1] || "", title: m.event.title, type: "team", place: m.event.place, att: ["주", "소", "민", "예"] })}>
                      <CalendarIcon />캘린더에서 보기
                    </button>
                    <button className={attended[m.id] ? "attended" : ""} onClick={() => setAttended((a) => ({ ...a, [m.id]: !a[m.id] }))}>
                      <Check />{attended[m.id] ? "참석함" : "참석"}
                    </button>
                  </div>
                </div>
              )}
              {(m.reacts || reactions[m.id]) && (
                <div className="reacts">
                  {(m.reacts || []).map((r, i) => (
                    <button key={"s" + i} className={`react${r.mine ? " mine" : ""}`} onClick={() => toggleReact(m.id, r.e)}>{r.e}<span>{r.n}</span></button>
                  ))}
                  {Object.entries(reactions[m.id] || {}).map(([e, n]) => (
                    <button key={"d" + e} className="react mine" onClick={() => toggleReact(m.id, e)}>{e}<span>{n}</span></button>
                  ))}
                </div>
              )}
            </div>
            <div className="msg-actions">
              <div className="react-pick-wrap">
                <button onClick={() => setReactPickFor(reactPickFor === m.id ? null : m.id)}><Smile /></button>
                {reactPickFor === m.id && (
                  <div className="react-pick">
                    {["👍","😊","🔥","✅","❤️","🎉","👀","🙏"].map((e) => (
                      <button key={e} onClick={() => toggleReact(m.id, e)}>{e}</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => onEvent({ id: "new-" + m.id, date: "2026-06-15", start: "오후 2:00", end: "오후 3:00", title: "새 일정", type: "team", place: "", att: ["주"] })}><CalendarPlus /></button>
            </div>
          </div>
        ))}
        {simulTyping && (
          <div className="typing-indicator">
            <UserAvatar ini={simulTyping[0]} size={28} radius={8} />
            <div>
              <div className="typing-dots"><span /><span /><span /></div>
              <div className="typing-who">{simulTyping} 작성 중</div>
            </div>
          </div>
        )}
      </div>
      <div className="composer">
        <div className={`composer-box${focus ? " focus" : ""}`}>
          <textarea
            rows={1} placeholder={placeholder}
            value={draft} onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          />
          <div className="composer-foot">
            <button className="iconbtn" title="파일 첨부" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.onchange = (e) => { if (e.target.files[0]) { setDraft((d) => d + (d ? " " : "") + "[" + e.target.files[0].name + "]"); } }; input.click(); }}><Plus /></button>
            <button className="iconbtn" title="캘린더 일정 추가" onClick={() => onEvent({ id: "new", date: "2026-06-15", start: "오후 2:00", end: "오후 3:00", title: "새 일정", type: "team", place: "", att: ["주"] })}><CalendarPlus /></button>
            <div className="emoji-wrap">
              <button className="iconbtn" title="이모지"><Smile /></button>
              <div className="emoji-pop">
                {["👍","😊","🔥","✅","❤️","😄","👀","🎉","💡","🙏"].map((e) => (
                  <button key={e} onClick={() => setDraft((d) => d + e)}>{e}</button>
                ))}
              </div>
            </div>
            <button className={`send${draft.trim() ? " ready" : ""}`} onClick={onSend}><Send /></button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ----------------------------- calendar ----------------------------- */
function CalendarView({ y, m, weeks, eventsByDay, todayIso, onPrev, onNext, onToday, onEvent, onAddDate, onBack, issues, onOpenIssue }) {
  const [seg, setSeg] = useState("월");
  // 주 보기: 오늘이 포함된 주만 표시 (없으면 첫 주)
  const shownWeeks = seg === "주"
    ? (weeks.filter((wk) => wk.some((c) => c.iso === todayIso))[0] ? [weeks.find((wk) => wk.some((c) => c.iso === todayIso))] : [weeks[0]])
    : weeks;

  // 내 이슈(assignee==="주") 중 마감일이 있는 것 — 날짜별 맵
  const myIssueDues = {};
  (issues || []).filter((i) => i.assignee === "주" && i.due && i.status !== "done").forEach((i) => {
    (myIssueDues[i.due] = myIssueDues[i.due] || []).push(i);
  });

  return (
    <>
      <div className="cal-head fade" key={`${y}-${m}`}>
        <div className="cal-month">{y}년 {MON[m]}</div>
        <div className="navgrp">
          <button className="iconbtn" onClick={onPrev}><ChevronLeft /></button>
          <button className="iconbtn" onClick={onNext}><ChevronRight /></button>
        </div>
        <button className="todaybtn" onClick={onToday}>오늘</button>
        <div className="segwrap">
          {["월", "주"].map((s) => (
            <button key={s} className={`seg${seg === s ? " on" : ""}`} onClick={() => setSeg(s)}>{s}</button>
          ))}
        </div>
        <button className="newiss" style={{ marginLeft: "auto" }} onClick={() => onAddDate(todayIso)}><Plus />일정 추가</button>
        {onBack && <button className="iconbtn close-x" onClick={onBack}><X /></button>}
      </div>
      <div className="cal-grid">
        <div className="cal-dow">
          {DOW.map((d, i) => <div key={d} className={i === 0 ? "sun" : ""}>{d}</div>)}
        </div>
        <div className="cal-body">
          {shownWeeks.map((week, wi) => (
            <div className="cal-week" key={wi}>
              {week.map((cell) => {
                const evs = eventsByDay[cell.iso] || [];
                const cellIssues = myIssueDues[cell.iso] || [];
                // 이벤트는 최대 2개, 이슈는 최대 1개 → 합산 3개 넘으면 +더보기
                const evSlots = Math.min(evs.length, cellIssues.length > 0 ? 2 : 3);
                const showEvs = evs.slice(0, evSlots);
                const showIss = cellIssues.slice(0, 1);
                const total = evs.length + cellIssues.length;
                const shown = showEvs.length + showIss.length;
                const more = total - shown;
                const isToday = cell.iso === todayIso;
                return (
                  <button className={`cal-cell${cell.inMonth ? "" : " out"}`} key={cell.iso}
                    onClick={() => evs[0] ? onEvent(evs[0]) : onAddDate(cell.iso)}>
                    <div className="cell-num-row">
                      <div className={`cell-num${isToday ? " today" : (new Date(cell.iso).getDay() === 0 ? " sun" : "")}`}>{cell.d}</div>
                      <span className="cell-add" onClick={(ev) => { ev.stopPropagation(); onAddDate(cell.iso); }}><Plus /></span>
                    </div>
                    {showEvs.map((e) => {
                      const cc = e.color ? EVENT_COLOR_MAP[e.color] : null;
                      return (
                        <span key={e.id} className={`chip${e.type === "personal" && !cc ? " gray" : ""}`}
                          style={cc ? { "--chip-c": cc } : undefined}
                          onClick={(ev) => { ev.stopPropagation(); onEvent(e); }}>
                          <span className="cdot" style={cc ? { background: cc } : undefined} />{e.start !== "종일" ? e.start.replace("오전 ", "").replace("오후 ", "") + " " : ""}{e.title}
                        </span>
                      );
                    })}
                    {showIss.map((iss) => (
                      <span key={iss.id} className="chip-issue"
                        onClick={(ev) => { ev.stopPropagation(); onOpenIssue?.(iss); }}>
                        <ListTodo />{iss.title}
                      </span>
                    ))}
                    {more > 0 && <span className="chip-more">+{more}개 더보기</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ----------------------------- event detail ----------------------------- */
function EventDetail({ ev, onClose, onChat }) {
  const dt = new Date(ev.date);
  const dateStr = `${dt.getFullYear()}년 ${MON[dt.getMonth()]} ${dt.getDate()}일 (${DOW[dt.getDay()]})`;
  const time = ev.start === "종일" ? "종일" : `${ev.start}${ev.end ? ` ~ ${ev.end}` : ""}`;
  const [bookmarked, setBookmarked] = useState(false);
  return (
    <aside className="detail">
      <div className="detail-head">
        <div className="detail-inner" style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {ev.color && <span style={{ width: 11, height: 11, borderRadius: 4, background: EVENT_COLOR_MAP[ev.color], flex: "0 0 auto" }} />}
          <span className={`tag${ev.type === "personal" ? " gray" : ""}`}>{ev.type === "personal" ? "개인" : "팀 일정"}</span>
          <button className="iconbtn" style={{ marginLeft: "auto" }} onClick={onClose}><X /></button>
        </div>
      </div>
      <div className="detail-scroll">
        <div className="detail-inner">
          <h2>{ev.title}</h2>
          <div className="detail-line"><CalendarIcon /><div><div className="k">날짜</div><div className="v">{dateStr}</div></div></div>
          <div className="detail-line"><Clock /><div><div className="k">시간</div><div className="v">{time}</div></div></div>
          {ev.place && <div className="detail-line"><MapPin /><div><div className="k">장소</div><div className="v">{ev.place}</div></div></div>}
          {ev.att && (
            <div className="detail-line" style={{ flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 13 }}><Users /><div className="k">참석자 {ev.att.length}명</div></div>
              <div className="att-row">
                {ev.att.map((a, i) => (
                  <span key={i} className="att"><UserSilhouette ini={a} size={22} radius={7} />{fullName(a)}</span>
                ))}
              </div>
            </div>
          )}
          {ev.type === "team" && (
            <div className="detail-line" style={{ marginTop: 8 }}>
              <div className="join-info">
                <Video style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>온라인 참석 링크</span>
                <a href="#" style={{ fontSize: 13, color: "var(--key)", fontWeight: 700 }} onClick={(e) => { e.preventDefault(); alert("https://meet.teum.kr/" + ev.id); }}>https://meet.teum.kr/{ev.id}</a>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="detail-foot">
        <div className="detail-inner" style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={() => onChat(ev)}><MessageSquare />대화 열기</button>
          <button className="btn-ghost" title={bookmarked ? "북마크 해제" : "북마크"} onClick={() => setBookmarked((v) => !v)}
            style={{ color: bookmarked ? "var(--key)" : undefined }}>
            <Star style={{ fill: bookmarked ? "var(--key)" : "none" }} />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ----------------------------- home ----------------------------- */
function HomeView({ upcoming, onEvent, team, working, myTodayMinutes, myTodayMs, liveSeconds, liveMs, onToggleWork, issues, ideas, homeLayout, setHomeLayout, homeEdit, setHomeEdit, onOpenIssue, selDM, dms, chat, draft, setDraft, focus, setFocus, onSend, dmDraft, setDmDraft, dmFocus, setDmFocus, onSendDM, scrollRef, onRef, timePolls, onVotePoll, onCloseChat, onPopout, notifications, onOpenNotif, onMarkAllRead }) {
  // 현재 시각 — 30초마다 갱신해 브리핑이 시간 경과를 실시간 반영
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const hour = now.getHours();

  const todayIsoStr = "2026-06-15";
  const todays = upcoming.filter((e) => e.date === todayIsoStr);
  const others = team.filter((p) => p.id !== "주");
  const othersMinutes = others.map((p) => TEAM_TODAY[p.id]?.minutes || 0);
  const teamAvg = Math.round(othersMinutes.reduce((s, m) => s + m, 0) / othersMinutes.length);
  const diff = myTodayMinutes - teamAvg;
  const myIssues = issues.filter((i) => i.assignee === "주" && i.status !== "done");
  const myDone = issues.filter((i) => i.assignee === "주" && i.status === "done");
  const dmPartner = selDM ? team.find((p) => p.id === selDM) : null;

  /* ─── 상황별 인사말 (16가지) ─── */
  function buildGreeting() {
    const overdueNow = myIssues.filter((i) => i.due && i.due < todayIsoStr);
    const hasOverdue = overdueNow.length > 0;
    const hasDone = myDone.length > 0;
    const hasEvent = todays.length > 0;
    const isWorking = working;

    if (hour < 5) {
      // 새벽
      return hasOverdue
        ? "이 시간까지 붙잡고 있군요, 주헌님. 마감이 코앞이네요."
        : "새벽까지 켜져 있네요, 주헌님. 잠깐 쉬어도 괜찮아요.";
    } else if (hour < 9) {
      // 이른 아침
      return isWorking
        ? "일찍 시작했네요, 주헌님. 오늘 좋은 흐름이에요."
        : hasEvent
        ? `오늘 ${todays.length}개 일정이 있어요. 좋은 아침이에요, 주헌님.`
        : "좋은 아침이에요, 주헌님. 오늘도 잘 부탁해요.";
    } else if (hour < 12) {
      // 오전
      return hasOverdue
        ? `마감 지난 작업이 ${overdueNow.length}개 있어요, 주헌님. 오늘 집중해봐요.`
        : isWorking
        ? "잘 달리고 있어요, 주헌님. 오전이 제일 황금시간이에요."
        : "오전이에요, 주헌님. 지금 시작하기 딱 좋아요.";
    } else if (hour < 14) {
      // 점심
      return hasDone
        ? `오전에 벌써 ${myDone.length}개 완료했네요, 주헌님. 점심 챙기세요.`
        : hasEvent
        ? "점심 시간이에요, 주헌님. 오후 일정 전에 잠깐 쉬어요."
        : "점심은 챙기셨나요, 주헌님? 밥 먹고 다시 달려봐요.";
    } else if (hour < 17) {
      // 오후
      return hasOverdue
        ? "오후도 반이 지나가요, 주헌님. 밀린 작업 먼저 처리해봐요."
        : isWorking
        ? "오후도 잘 가고 있어요, 주헌님. 페이스 유지해요."
        : hasDone
        ? `오늘 ${myDone.length}개 완료했어요, 주헌님. 오후도 이 흐름으로요.`
        : "오후예요, 주헌님. 오늘 마감까지 한 번 더 집중해봐요.";
    } else if (hour < 20) {
      // 저녁
      return hasDone
        ? `오늘 ${myDone.length}개 마무리했네요, 주헌님. 수고했어요.`
        : hasOverdue
        ? "저녁이에요, 주헌님. 밀린 건 내일 아침으로 넘기고 환기해봐요."
        : "저녁이에요, 주헌님. 오늘 하루 어땠어요?";
    } else if (hour < 23) {
      // 밤
      return isWorking
        ? "아직 켜져 있네요, 주헌님. 오늘 정말 열심히 했어요."
        : hasDone
        ? `${myDone.length}개 완료로 마무리하는 하루네요, 주헌님. 잘 자요.`
        : "하루 마무리 시간이에요, 주헌님. 오늘도 수고했어요.";
    } else {
      // 자정 이후
      return "자정이 넘었어요, 주헌님. 오늘은 이만 쉬어요.";
    }
  }
  const greeting = buildGreeting();
  // 지난주의 나 — 근무한 날의 일평균
  const myWeek = WEEK_MINUTES["주"] || [];
  const myWorkedDays = myWeek.filter((m) => m > 0);
  const lastWeekAvg = myWorkedDays.length ? Math.round(myWorkedDays.reduce((s, m) => s + m, 0) / myWorkedDays.length) : 0;
  const cmpMax = Math.max(myTodayMinutes, teamAvg, lastWeekAvg, 60);

  /* ─── AI 브리핑 텍스트 생성 (규칙 기반, 실시간 반영) ─── */
  const urgentIssues = myIssues.filter((i) => i.priority >= 3 || i.status === "progress");
  const progressIssue = myIssues.find((i) => i.status === "progress");
  const highPriorityIssue = myIssues.find((i) => i.priority >= 4) || myIssues.find((i) => i.priority >= 3);
  // 일정에 분 환산 시각 부여
  const timedEvents = todays
    .map((e) => ({ ...e, startMin: parseKoTime(e.start), endMin: parseKoTime(e.end) }))
    .filter((e) => e.startMin != null)
    .sort((a, b) => a.startMin - b.startMin);
  const ongoingEvent = timedEvents.find((e) => e.startMin <= nowMin && (e.endMin == null || e.endMin > nowMin));
  const nextEvent = timedEvents.find((e) => e.startMin > nowMin);
  const pastEvents = timedEvents.filter((e) => (e.endMin != null ? e.endMin : e.startMin) <= nowMin);
  // 마감 관련
  const dueToday = myIssues.filter((i) => i.due === todayIsoStr);
  const overdue = myIssues.filter((i) => i.due && i.due < todayIsoStr);
  // 미응답 일정 조율
  const openPolls = (timePolls || []).filter((p) => !(p.votes?.["주"]?.length));

  function buildBriefing() {
    const lines = [];
    const greet = hour < 6 ? "늦은 시간까지 고생이 많아요" : hour < 11 ? "좋은 아침이에요" : hour < 14 ? "점심은 챙기셨나요" : hour < 18 ? "오후도 힘내요" : hour < 22 ? "저녁 시간이에요" : "하루 마무리 시간이에요";
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // 1) 인사 + 근무 현황 (실시간)
    if (!working && myTodayMinutes === 0) {
      lines.push(`${greet}, 주헌님. 현재 ${timeStr}, 아직 근무를 시작하지 않으셨어요. 준비되면 업무 시작을 눌러주세요.`);
    } else if (working) {
      const cmp = diff < -30 ? ` 팀 평균보다 ${fmtHM(Math.abs(diff))} 적으니 페이스를 올려봐요.` : diff > 30 ? ` 팀 평균보다 ${fmtHM(diff)} 앞서 있어요, 훌륭해요!` : " 팀 평균과 비슷한 페이스예요.";
      lines.push(`${greet}. 지금 근무 중이고 오늘 누적 ${fmtHM(myTodayMinutes)} 기록 중이에요.${cmp}`);
    } else {
      lines.push(`${greet}. 현재 ${timeStr}, 휴식 중이에요. 오늘 누적 근무는 ${fmtHM(myTodayMinutes)}이고 ${diff >= 0 ? "팀 평균을 앞서고 있어요." : `팀 평균보다 ${fmtHM(Math.abs(diff))} 뒤예요.`}`);
    }

    // 2) 지연/마감 — 가장 시급한 것 우선
    if (overdue.length > 0) {
      lines.push(`⚠️ 마감이 지난 이슈가 ${overdue.length}개 있어요${overdue[0] ? ` — '${overdue[0].title}'부터 확인이 필요해요.` : "."}`);
    } else if (dueToday.length > 0) {
      lines.push(`오늘 마감인 이슈가 ${dueToday.length}개 있어요 — ${dueToday.map((i) => `'${i.title}'`).join(", ")}. 마무리에 집중해봐요.`);
    }

    // 3) 지금 시각 기준 일정 상태 (실시간 반영)
    if (ongoingEvent) {
      lines.push(`지금 '${ongoingEvent.title}'가 진행 중이에요 (${ongoingEvent.start}${ongoingEvent.end ? `~${ongoingEvent.end}` : ""}).${ongoingEvent.place ? ` 장소: ${ongoingEvent.place}.` : ""}`);
    } else if (nextEvent) {
      const mins = nextEvent.startMin - nowMin;
      const when = mins <= 60 ? `${mins}분 뒤` : `${nextEvent.start}`;
      lines.push(`다음 일정은 ${when} '${nextEvent.title}'예요${nextEvent.place ? ` (${nextEvent.place})` : ""}.${mins <= 15 ? " 곧 시작하니 준비해주세요!" : ""}`);
    } else if (pastEvents.length > 0 && timedEvents.length > 0) {
      lines.push(`오늘 예정된 일정 ${timedEvents.length}개를 모두 지나왔어요. 남은 시간은 이슈 처리에 활용해봐요.`);
    }

    // 4) 진행 중 / 높은 우선순위 이슈
    if (progressIssue) {
      lines.push(`'${progressIssue.title}' 이슈를 진행 중이에요${progressIssue.due ? ` — 마감 ${progressIssue.due.slice(5).replace("-", "/")}` : ""}. 오늘 안에 한 단계 더 진전시켜봐요.`);
    } else if (highPriorityIssue) {
      lines.push(`아직 시작 안 한 ${PRIORITY[highPriorityIssue.priority]} 우선순위 이슈 '${highPriorityIssue.title}'가 있어요. 지금 착수하기 좋아요.`);
    }

    // 5) 일정 조율 미응답
    if (openPolls.length > 0) {
      lines.push(`회의 일정 조율 '${openPolls[0].title}'에 아직 응답하지 않으셨어요. 가능한 시간을 표시해주세요.`);
    }

    // 6) 마무리 / 격려 — 오늘 한 일 요약
    if (myDone.length > 0 && (hour >= 16 || !working)) {
      lines.push(`오늘 이미 ${myDone.length}개 이슈를 완료했어요. ${myDone.length >= 3 ? "생산적인 하루네요!" : "좋은 흐름이에요."}`);
    } else if (myIssues.length === 0 && overdue.length === 0) {
      lines.push("처리할 이슈가 없어요. 새 아이디어를 올리거나 팀을 도와봐도 좋아요.");
    } else if (myTodayMinutes > 300 && working) {
      lines.push("5시간 넘게 집중하고 있어요. 잠깐의 휴식이 오히려 효율을 높여줘요.");
    }

    return lines.slice(0, 5);
  }

  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  const briefingLines = buildBriefing();

  function move(id, dir) {
    setHomeLayout((arr) => {
      const idx = arr.indexOf(id);
      const next = idx + dir;
      if (next < 0 || next >= arr.length) return arr;
      const copy = [...arr];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }

  const widgets = {
    work: (
      <div className="card" key="work">
        <div className="card-head"><Clock /><h3>오늘 근무</h3></div>
        <div className="work-body">
          <div className="work-timer">{working ? fmtHMSms(liveMs) : fmtHMS(Math.floor(myTodayMs / 1000))}</div>
          <div className="work-total">오늘 누적 <b>{fmtHM(myTodayMinutes)}</b>{working ? " · 측정 중" : ""}</div>
          <button className={`work-btn${working ? " stop" : ""}`} onClick={onToggleWork}>
            {working ? <><Square />업무 종료</> : <><Play />업무 시작</>}
          </button>

        </div>
      </div>
    ),
    schedule: (
      <div className="card" key="schedule">
        <div className="card-head"><CalendarIcon /><h3>오늘 일정</h3><span className="count">{todays.length}개</span></div>
        <div className="card-body">
          {todays.map((e) => (
            <button key={e.id} className="todo" onClick={() => onEvent(e)}>
              <span className={`bar${e.type === "personal" ? " gray" : ""}`} />
              <div style={{ flex: 1 }}>
                <div className="ttl">{e.title}</div>
                <div className="tm">{e.place || "장소 미정"}</div>
              </div>
              <span className="time-tag">{e.start}</span>
            </button>
          ))}
          {todays.length === 0 && <div style={{ padding: "10px 8px", fontSize: 13, color: "var(--text-3)" }}>오늘 등록된 일정이 없어요.</div>}
        </div>
      </div>
    ),
    compare: (() => {
      const myAll = issues.filter((i) => i.assignee === "주");
      const myDoneWeek = myAll.filter((i) => i.status === "done");
      const myActive = myAll.filter((i) => i.status !== "done");
      const myOverdue = myActive.filter((i) => i.due && i.due < todayIsoStr);
      const completionRate = myAll.length > 0 ? Math.round((myDoneWeek.length / myAll.length) * 100) : 0;
      const myIdeaCount = (ideas || []).filter((i) => i.me).length;
      // 나 제외 팀 평균 근무시간
      const othersMin = Object.entries(TEAM_TODAY).filter(([k]) => k !== "주").map(([, v]) => v.minutes || 0);
      const othersAvg = othersMin.length ? Math.round(othersMin.reduce((s, v) => s + v, 0) / othersMin.length) : 0;
      const diff = myTodayMinutes - othersAvg;
      return (
        <div className="card" key="compare">
          <div className="card-head"><TrendingUp /><h3>퍼포먼스</h3></div>
          <div className="perf-grid">
            <div className="perf-kpi">
              <span className="perf-kpi-label">완료율</span>
              <span className="perf-kpi-val" style={{ color: completionRate <= 30 ? "#e03e3e" : completionRate >= 70 ? "var(--key)" : "var(--text)" }}>{completionRate}%</span>
            </div>
            <div className="perf-kpi">
              <span className="perf-kpi-label">지연 작업</span>
              <span className="perf-kpi-val">{myOverdue.length}</span>
            </div>
            <div className="perf-kpi">
              <span className="perf-kpi-label">이번 주 아이디어</span>
              <span className="perf-kpi-val">{myIdeaCount}</span>
            </div>
          </div>
          <div style={{ margin: "0 12px 14px", padding: "11px 14px", borderRadius: 10, background: "var(--bg-subtle)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>팀 평균 업무시간</span>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{fmtHM(othersAvg)}</span>
              {myTodayMinutes > 0 && (
                <span style={{ fontSize: 11.5, fontWeight: 700, color: diff >= 0 ? "var(--key)" : "var(--text-3)", background: diff >= 0 ? "var(--key-soft)" : "var(--bg-hover)", padding: "2px 7px", borderRadius: 6 }}>
                  {diff >= 0 ? `+${fmtHM(diff)}` : `-${fmtHM(Math.abs(diff))}`}
                </span>
              )}
            </span>
          </div>
        </div>
      );
    })(),
    myissues: (
      <div className="card" key="myissues">
        <div className="card-head"><ListTodo /><h3>오늘 내 이슈</h3><span className="count">{myIssues.length}개</span></div>
        <div className="card-body">
          {myIssues.map((i) => (
            <button key={i.id} className="todo" onClick={() => onOpenIssue(i)}>
              <span className="bar" style={{ background: i.status === "progress" ? "var(--text-2)" : "var(--text-3)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ttl">{i.title}</div>
                <div className="tm">{STATUS_META[i.status].label}{i.due ? ` · 마감 ${i.due.slice(5).replace("-", "/")}` : ""}</div>
              </div>
              <PriorityIcon p={i.priority} />
            </button>
          ))}
          {myIssues.length === 0 && <div style={{ padding: "10px 8px", fontSize: 13, color: "var(--text-3)" }}>오늘 배정된 이슈가 없어요.</div>}
        </div>
      </div>
    ),
  };

  const chatTitle = selDM === null
    ? "팀 전체 대화"
    : dmPartner ? `${dmPartner.name}님과 대화` : "";

  return (
    <div className={`home-root${selDM !== undefined && selDM !== null || selDM === null && chat ? "" : ""}`}>
      <div className="home-scroll fade">
        <div className="greet-row">
          <div>
            <div className="greet">{greeting}</div>
            <div className="greet-sub">오늘 팀에서 일어나는 일을 한눈에 모았어요.</div>
          </div>
          <span style={{ position: "relative", display: "inline-flex" }}>
            <button className="iconbtn" title="알림" style={{ width: 36, height: 36, borderRadius: 10 }} onClick={() => setNotifOpen((v) => !v)}>
              <Bell style={{ width: 20, height: 20 }} />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            {notifOpen && (
              <>
                <div className="notif-scrim" onClick={() => setNotifOpen(false)} />
                <div className="notif-dropdown" style={{ right: 0, left: "auto", top: 40 }}>
                  <div className="notif-dropdown-head">
                    <span>알림</span>
                    {unreadCount > 0 && <button className="notif-markall" onClick={onMarkAllRead}>모두 읽음</button>}
                  </div>
                  <div className="notif-dropdown-list">
                    {(notifications || []).length === 0 && (
                      <div style={{ padding: "16px 14px", fontSize: 13, color: "var(--text-3)" }}>아직 알림이 없어요.</div>
                    )}
                    {(notifications || []).map((n) => (
                      <button key={n.id} className={`notif-dropdown-item${n.read ? "" : " unread"}`} onClick={() => { setNotifOpen(false); onOpenNotif(n); }}>
                        <UserAvatar ini={n.ini} size={26} radius={8} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ttl">
                            {n.kind === "issue-assigned" ? "새 이슈가 배정됐어요"
                              : n.kind === "event-added" ? "새 일정이 추가됐어요"
                              : n.kind === "idea-comment" ? "내 아이디어에 댓글이 달렸어요"
                              : "알림"}
                          </div>
                          <div className="tm">
                            {n.kind === "issue-assigned" ? `${n.issueId} · ${n.title}`
                              : n.kind === "event-added" ? `${n.title}${n.extra ? ` · ${n.extra}` : ""}`
                              : n.kind === "idea-comment" ? `${n.title}`
                              : n.title}
                          </div>
                        </div>
                        <span className="time-tag">{n.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </span>
        </div>

        {/* ── AI 데일리 브리핑 카드 ── */}
        <div className="ai-brief-card">
          <div className="ai-brief-blobs">
            <div className="ai-brief-blob b1" />
            <div className="ai-brief-blob b2" />
            <div className="ai-brief-blob b3" />
            <div className="ai-brief-blob b4" />
          </div>
          <div className="ai-brief-glass" />
          <div className="ai-brief-body">
            <div className="ai-brief-header">
              <span className="ai-brief-icon"><Sparkles /></span>
              <span className="ai-brief-label">오늘의 브리핑</span>
            </div>
            <div className="ai-brief-lines" key={briefingLines.join("|")}>
              {briefingLines.map((line, i) => (
                <p key={i} className="ai-brief-line" style={{ animationDelay: `${i * 0.12}s` }}>
                  {line}
                </p>
              ))}
            </div>
            <div className="ai-brief-chips">
              {nextEvent && (
                <button className="ai-brief-chip" onClick={() => !homeEdit && onEvent(nextEvent)}>
                  <CalendarIcon style={{ width: 13, height: 13 }} />{nextEvent.start} {nextEvent.title}
                </button>
              )}
              {progressIssue && (
                <button className="ai-brief-chip urgent" onClick={() => !homeEdit && onOpenIssue(progressIssue)}>
                  <ListTodo style={{ width: 13, height: 13 }} />{progressIssue.title}
                </button>
              )}
              {!progressIssue && highPriorityIssue && (
                <button className="ai-brief-chip" onClick={() => !homeEdit && onOpenIssue(highPriorityIssue)}>
                  <ListTodo style={{ width: 13, height: 13 }} />{highPriorityIssue.title}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="home-grid">
          {/* 왼쪽 열: 오늘 근무 + 오늘 일정 */}
          <div className="home-col">
            {["work", "schedule"].map((id) => (
              <div className="widget-wrap" key={id}>
                {widgets[id]}
              </div>
            ))}
          </div>
          {/* 오른쪽 열: 팀 근무시간 비교 + 오늘 내 이슈 */}
          <div className="home-col">
            {["compare", "myissues"].map((id) => (
              <div className="widget-wrap" key={id}>
                {widgets[id]}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 채팅 패널 — selDM이 정의된 경우(null=전체, string=DM) 표시 */}
      {selDM !== undefined && (
        <div className="home-chat-panel fade">
          <div className="home-chat-head">
            <span className="home-chat-title">
              {selDM === null
                ? <><Users style={{ width: 16, height: 16 }} />팀 전체 대화</>
                : dmPartner
                  ? <><UserSilhouette ini={dmPartner.ini} size={22} radius={7} />{dmPartner.name}</>
                  : null}
            </span>
            <div className="home-chat-actions">
              <button className="iconbtn" title="새 창으로 열기" onClick={onPopout}><ArrowUpRight /></button>
              <button className="iconbtn" title="닫기" onClick={onCloseChat}><X /></button>
            </div>
          </div>
          {selDM === null
            ? <ChatView chat={chat} draft={draft} setDraft={setDraft} focus={focus} setFocus={setFocus} onSend={onSend} scrollRef={scrollRef} onEvent={onEvent} onRef={onRef} placeholder="팀에 메시지 보내기" timePolls={timePolls} onVotePoll={onVotePoll} />
            : <ChatView chat={dms[selDM] || []} draft={dmDraft} setDraft={setDmDraft} focus={dmFocus} setFocus={setDmFocus} onSend={onSendDM} scrollRef={scrollRef} onEvent={onEvent} onRef={onRef} placeholder={dmPartner ? `${dmPartner.name}님에게 메시지 보내기` : "메시지 보내기"} timePolls={timePolls} onVotePoll={onVotePoll} />
          }
        </div>
      )}
    </div>
  );
}

/* ----------------------------- manage (멤버 관리) ----------------------------- */
function ListManage({ team, working, presenceOf }) {
  const [notif, setNotif] = useState(true);
  const [q, setQ] = useState("");
  const filtered = q.trim() ? team.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.role || "").toLowerCase().includes(q.toLowerCase())) : team;
  return (
    <>
      <div className="panel-head">
        <div className="ws-row">
          <div className="ws-name"><span className="ws-dot" />우리 워크스페이스</div>
          <button className="iconbtn" title={notif ? "알림 끄기" : "알림 켜기"} onClick={() => setNotif((v) => !v)}
            style={{ color: notif ? "var(--text)" : "var(--text-3)" }}>
            <Bell />
          </button>
        </div>
        <div className="searchbox"><Search /><input placeholder="멤버 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="panel-scroll">
        <div className="sec-label">멤버 {filtered.length}명{q ? ` · "${q}" 검색` : ""}</div>
        {filtered.map((p) => (
          <div className="row" key={p.id} style={{ cursor: "default" }}>
            <UserAvatar ini={p.ini} size={28} radius={8} presence={presenceOf(p)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row-title">{p.name}{p.me ? " (나)" : ""}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>{p.role}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: "12px 8px", fontSize: 13, color: "var(--text-3)" }}>검색 결과가 없어요.</div>}
      </div>
    </>
  );
}

function ManageView({ team, onBack, working, liveSeconds, onToggleWork, presenceOf }) {
  const PRESENCE_TXT = { on: "활동 중", away: "자리 비움", off: "오프라인" };
  return (
    <>
      <div className="topbar">
        <div className="top-title"><Users />멤버 관리</div>
        <span className="top-sub">멤버 {team.length}명</span>
        <div className="top-actions">
          <button className={`work-pill${working ? " on" : ""}`} onClick={onToggleWork}>
            {working ? <><Square />{fmtHMS(liveSeconds)}</> : <><Play />업무 시작</>}
          </button>
          <button className="iconbtn close-x" onClick={onBack}><X /></button>
        </div>
      </div>
      <div className="team-scroll fade">
        <div className="team-grid">
          {team.map((p) => {
            const pres = presenceOf(p);
            return (
            <div className="member self" key={p.name} style={{ cursor: "default" }}>
              <UserAvatar ini={p.ini} size={40} radius={12} presence={pres} presenceSize={13} />
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div className="nm">{p.name}{p.me ? " (나)" : ""}</div>
                <div className="rl">{p.role}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: pres === "on" ? "var(--key)" : pres === "away" ? "#e0a82f" : "var(--text-3)" }}>
                {PRESENCE_TXT[pres]}
              </span>
            </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ----------------------------- shared issue glyphs ----------------------------- */
const NAME = { 주: "주헌", 소: "소라", 민: "민우", 예: "예인" };
const fullName = (ini) => NAME[ini] || ini;

// 색상 라벨 칩 — 라벨 색이 있으면 그 파스텔 색으로 길게 채워서 검은 글씨로 표시
// briefLabels에 속한 라벨만 파스텔 색 표시 — 일반 라벨은 항상 회색
function LabelChip({ label, colors, briefLabels }) {
  const isBrief = briefLabels && (briefLabels instanceof Set ? briefLabels.has(label) : briefLabels[label]);
  const c = isBrief && colors && colors[label];
  if (c) return <span className="lbl filled" style={{ background: c }}>{label}</span>;
  return <span className="lbl">{label}</span>;
}

function StatusIcon({ status, size = 16 }) {
  const s = size, c = s / 2, r = c - 1.8;
  if (status === "backlog") {
    // 점선 원 — 아직 시작 안 함
    const circ = 2 * Math.PI * r;
    return (
      <svg className="sicon" width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ flex: "0 0 auto" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--text-3)" strokeWidth="1.7"
          strokeDasharray={`${circ * 0.25} ${circ * 0.08}`} strokeLinecap="round"
          strokeDashoffset={circ * 0.06} />
      </svg>
    );
  }
  if (status === "todo") {
    // 실선 빈 원 — 예정됨
    return (
      <svg className="sicon" width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ flex: "0 0 auto" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--text-2)" strokeWidth="1.7" />
      </svg>
    );
  }
  if (status === "progress") {
    // 반원 채움 — 진행 중 (Linear 스타일 절반 채워진 원)
    const d = `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${r} ${r} 0 0 0 ${c} ${c - r}`;
    return (
      <svg className="sicon" width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ flex: "0 0 auto" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--key)" strokeWidth="1.7" />
        <path d={d} fill="var(--key)" />
      </svg>
    );
  }
  if (status === "done") {
    // 체크 꽉 찬 원 — 완료
    return (
      <svg className="sicon" width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ flex: "0 0 auto" }}>
        <circle cx={c} cy={c} r={r + 0.3} fill="var(--text)" />
        <path d={`M${c - 2.8} ${c + 0.3} l2 2 l4 -4.2`} stroke="var(--bg)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // 취소/기타 — X 표시 원
  return (
    <svg className="sicon" width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ flex: "0 0 auto" }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--text-3)" strokeWidth="1.7" />
      <path d={`M${c-2.2} ${c-2.2} l4.4 4.4 M${c+2.2} ${c-2.2} l-4.4 4.4`} stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PriorityIcon({ p }) {
  if (p === 4) return <span className="prio urgent">!</span>;
  if (p === 0) return <span className="prio none" />;
  return (
    <span className="prio">
      <span className={`b1${p >= 1 ? " fill" : ""}`} />
      <span className={`b2${p >= 2 ? " fill" : ""}`} />
      <span className={`b3${p >= 3 ? " fill" : ""}`} />
    </span>
  );
}

function Avatar({ ini }) {
  return <UserSilhouette ini={ini} size={26} radius={8} title={ini ? fullName(ini) : "미지정"} />;
}

/* ----------------------------- list: issues ----------------------------- */
function ListIssues({ issues, cycle, onOpen, onNew, showArchive, onToggleArchive, statusFilter, onFilterStatus }) {
  const [q, setQ] = useState("");
  const filtered = q.trim() ? issues.filter((i) => i.title.includes(q) || i.id.includes(q)) : null;

  // 내 이슈: 상태별로 분류
  const myByStatus = {};
  STATUS_ORDER.forEach((s) => {
    myByStatus[s] = issues.filter((i) => i.assignee === "주" && i.status === s);
  });

  return (
    <>
      <div className="panel-head">
        <div className="ws-row">
          <div className="ws-name"><ListTodo style={{ width: 18, height: 18, color: "var(--icon)" }} />이슈</div>
          <button className="iconbtn" title="새 이슈" onClick={() => onNew("backlog")}><Plus /></button>
        </div>
        <div className="searchbox"><Search /><input placeholder="이슈 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="panel-scroll">
        <button className="addbtn" onClick={onToggleArchive}>아카이브</button>

        {filtered ? (
          <>
            <div className="sec-label">검색 결과 {filtered.length}개</div>
            {filtered.length === 0 && <div style={{ padding: "8px 10px", fontSize: 13, color: "var(--text-3)" }}>결과가 없어요.</div>}
            {filtered.map((i) => (
              <button key={i.id} className="row" onClick={() => onOpen(i)}>
                <span className="row-title">{i.title}</span>
              </button>
            ))}
          </>
        ) : (
          <>
            <div className="sec-label" style={{ paddingTop: 14 }}>내 이슈</div>
            {STATUS_ORDER.every((s) => myByStatus[s].length === 0) && (
              <div style={{ padding: "8px 10px", fontSize: 13, color: "var(--text-3)" }}>맡은 이슈가 없어요.</div>
            )}
            {STATUS_ORDER.map((s, idx) => {
              const items = myByStatus[s];
              if (items.length === 0) return null;
              return (
                <React.Fragment key={s}>
                  <div className="my-iss-divider" />
                  {items.map((i) => (
                    <button key={i.id} className="row" onClick={() => onOpen(i)}>
                      <span className="row-title">{i.title}</span>
                      <PriorityIcon p={i.priority} />
                    </button>
                  ))}
                </React.Fragment>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}

/* ----------------------------- 아카이브 (지난 사이클 업무 + 대시보드) ----------------------------- */
function ArchiveView({ issues, cycle, onBack, onOpen }) {
  // 현재 사이클의 완료 이슈도 아카이브 통계에 포함
  const currentDone = issues
    .filter((i) => i.status === "done" && i.cycle)
    .map((i) => ({ ...i, cycleNum: cycle.num }));
  const allDone = [...currentDone, ...ARCHIVE];

  // 사이클별 그룹
  const byCycle = {};
  allDone.forEach((i) => { (byCycle[i.cycleNum] = byCycle[i.cycleNum] || []).push(i); });
  const cycleNums = Object.keys(byCycle).map(Number).sort((a, b) => b - a);

  // ── 대시보드 통계 ──
  // 1) 사이클별 완료 업무 수
  const cycleCounts = cycleNums.map((n) => ({ num: n, count: byCycle[n].length })).sort((a, b) => a.num - b.num);
  const maxCycleCount = Math.max(...cycleCounts.map((c) => c.count), 1);

  // 2) 요일별 완료 분포
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  allDone.forEach((i) => { if (typeof i.completedDow === "number") dowCounts[i.completedDow]++; });
  const maxDow = Math.max(...dowCounts, 1);
  const busiestDow = dowCounts.indexOf(maxDow);

  // 3) 평균 완료 속도 (생성→완료 소요일)
  const leads = allDone.filter((i) => typeof i.leadDays === "number").map((i) => i.leadDays);
  const avgLead = leads.length ? (leads.reduce((s, d) => s + d, 0) / leads.length).toFixed(1) : "—";

  // 4) 담당자별 완료 수
  const byAssignee = {};
  allDone.forEach((i) => { if (i.assignee) byAssignee[i.assignee] = (byAssignee[i.assignee] || 0) + 1; });
  const assigneeRank = Object.entries(byAssignee).sort((a, b) => b[1] - a[1]);
  const maxAssignee = Math.max(...assigneeRank.map(([, n]) => n), 1);

  // 5) 라벨별 분포
  const byLabel = {};
  allDone.forEach((i) => (i.labels || []).forEach((l) => { byLabel[l] = (byLabel[l] || 0) + 1; }));
  const labelRank = Object.entries(byLabel).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const totalDone = allDone.length;

  return (
    <>
      <div className="iss-head">
        <div className="top-title"><Archive style={{ width: 18, height: 18 }} />아카이브</div>
        <span className="top-sub">완료된 업무 {totalDone}건 · {cycleNums.length}개 사이클</span>
        <div className="top-actions"><button className="iconbtn close-x" onClick={onBack}><X /></button></div>
      </div>

      <div className="archive-scroll fade">
        {/* ── 현재 사이클 진행 현황 배너 ── */}
        <div className="arch-cycle-banner">
          <div className="arch-cycle-left">
            <div className="arch-cycle-num">사이클 {cycle.num}</div>
            <div className="arch-cycle-range">{cycle.range}</div>
          </div>
          <div className="arch-cycle-right">
            <div className="arch-cycle-progress-label">
              <span>진행률</span>
              <span className="arch-cycle-fraction">{cycle.done} / {cycle.total}건 완료</span>
            </div>
            <div className="arch-cycle-bar-wrap">
              <div className="arch-cycle-bar" style={{ width: cycle.total > 0 ? `${Math.round(cycle.done / cycle.total * 100)}%` : "0%" }} />
            </div>
            <div className="arch-cycle-pct">{cycle.total > 0 ? Math.round(cycle.done / cycle.total * 100) : 0}%</div>
          </div>
        </div>

        {/* ── 상단 통계: 한 카드 안 3칸 분할 (이미지 레이아웃) ── */}
        <div className="arch-summary">
          <div className="arch-summary-col">
            <div className="arch-sum-label">총 완료 업무</div>
            <div className="arch-sum-value">{totalDone}<span>건</span></div>
            <div className="arch-sum-sub">{cycleNums.length}개 사이클 누적</div>
          </div>
          <div className="arch-summary-col">
            <div className="arch-sum-label">평균 완료 속도</div>
            <div className="arch-sum-value">{avgLead}<span>일</span>
              {Number(avgLead) <= 3 && <span className="arch-sum-badge">빠른 처리</span>}
            </div>
            <div className="arch-sum-sub">생성에서 완료까지</div>
          </div>
          <div className="arch-summary-col">
            <div className="arch-sum-label">가장 바쁜 요일</div>
            <div className="arch-sum-value">{DOW_KR[busiestDow]}<span>요일</span></div>
            <div className="arch-sum-sub">완료 {maxDow}건 · 사이클당 평균 {(totalDone / cycleNums.length).toFixed(1)}건</div>
          </div>
        </div>

        {/* ── 차트 2열 ── */}
        <div className="arch-charts">
          {/* 사이클별 업무량 */}
          <div className="arch-card">
            <div className="arch-card-title">사이클별 완료 업무</div>
            <div className="arch-card-sub">사이클 {cycleCounts[0]?.num} ~ {cycleCounts[cycleCounts.length - 1]?.num}</div>
            <div className="arch-bars">
              {cycleCounts.map((c) => (
                <div key={c.num} className="arch-bar-col">
                  <div className="arch-bar-wrap">
                    <div className="arch-bar-val">{c.count}</div>
                    <div className={`arch-bar${c.num === cycle.num ? " cur" : ""}`} style={{ height: `${(c.count / maxCycleCount) * 100}%` }} />
                  </div>
                  <div className="arch-bar-label">C{c.num}</div>
                </div>
              ))}
            </div>
            <div className="arch-card-foot"><b>{cycleCounts[cycleCounts.length - 1]?.count}건</b> 이번 사이클 완료</div>
          </div>

          {/* 요일별 분포 */}
          <div className="arch-card">
            <div className="arch-card-title">요일별 완료 분포</div>
            <div className="arch-card-sub">전체 사이클 누적</div>
            <div className="arch-bars">
              {dowCounts.map((cnt, dow) => (
                <div key={dow} className="arch-bar-col">
                  <div className="arch-bar-wrap">
                    <div className="arch-bar-val">{cnt || ""}</div>
                    <div className={`arch-bar${dow === busiestDow ? " cur" : ""}`} style={{ height: `${(cnt / maxDow) * 100}%` }} />
                  </div>
                  <div className="arch-bar-label">{DOW_KR[dow]}</div>
                </div>
              ))}
            </div>
            <div className="arch-card-foot"><b>{DOW_KR[busiestDow]}요일</b>에 가장 많이 완료했어요</div>
          </div>
        </div>

        {/* ── 담당자별 + 라벨별 ── */}
        <div className="arch-charts">
          <div className="arch-card">
            <div className="arch-card-title">담당자별 완료</div>
            <div className="arch-card-sub">전체 사이클 누적</div>
            <div className="arch-rank">
              {assigneeRank.map(([ini, n]) => (
                <div key={ini} className="arch-rank-row">
                  <UserSilhouette ini={ini} size={28} radius={8} title={fullName(ini)} />
                  <span className="arch-rank-name">{fullName(ini)}</span>
                  <div className="arch-rank-bar"><div className="arch-rank-fill" style={{ width: `${(n / maxAssignee) * 100}%` }} /></div>
                  <span className="arch-rank-n">{n}건</span>
                </div>
              ))}
            </div>
          </div>
          <div className="arch-card">
            <div className="arch-card-title">라벨별 분포</div>
            <div className="arch-card-sub">가장 많이 다룬 업무 유형</div>
            <div className="arch-labels">
              {labelRank.map(([label, n]) => (
                <div key={label} className="arch-label-chip">
                  {label}<span>{n}</span>
                </div>
              ))}
              {labelRank.length === 0 && <div style={{ fontSize: 13, color: "var(--text-3)" }}>데이터 없음</div>}
            </div>
          </div>
        </div>

        {/* ── 사이클별 완료 업무 목록 ── */}
        {cycleNums.map((n) => (
          <div className="arch-cycle" key={n}>
            <div className="arch-cycle-head">
              <span className="arch-cycle-name">사이클 {n}</span>
              <span className="arch-cycle-count">{byCycle[n].length}건 완료</span>
            </div>
            <div className="arch-list">
              {byCycle[n].sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || "")).map((i) => (
                <button className="arch-item" key={i.id} onClick={() => onOpen({ ...i, status: "done", priority: i.priority ?? 2, desc: i.desc || "", due: i.due || "", comments: i.comments || 0 })}>
                  <span className="arch-item-id">{i.id}</span>
                  <span className="arch-item-title">{i.title}</span>
                  <div className="arch-item-meta">
                    {(i.labels || []).map((l) => <span key={l} className="arch-item-label">{l}</span>)}
                    {i.assignee && <Avatar ini={i.assignee} />}
                    {i.completedAt && <span className="arch-item-date">{i.completedAt.slice(5).replace("-", "/")}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ----------------------------- issues main ----------------------------- */
function IssuesView({ issues, cycle, issView, setIssView, onOpen, onNew, onBack, showArchive, labelColors, briefLabels, highlightStatus }) {
  if (showArchive) return <ArchiveView issues={issues} cycle={cycle} onBack={onBack} onOpen={onOpen} />;
  const pct = cycle.done / cycle.total;
  const R = 11, CIRC = 2 * Math.PI * R;
  const cols = STATUS_ORDER;
  const groups = STATUS_ORDER.filter((s) => issues.some((i) => i.status === s));
  // 팀원별 이슈 분담 — 미완료 이슈 기준
  const activeIssues = issues.filter((i) => i.status !== "done" && i.assignee);
  const totalActive = activeIssues.length;
  const share = ALL_MEMBERS
    .map((ini) => ({ ini, name: fullName(ini), count: activeIssues.filter((i) => i.assignee === ini).length }))
    .filter((s) => s.count > 0);
  return (
    <>
      <div className="iss-head">
        <div className="cycle-pill">
          <div className="cycle-ring">
            <svg width="30" height="30" viewBox="0 0 30 30">
              <circle className="track" cx="15" cy="15" r={R} fill="none" strokeWidth="3.4" />
              <circle className="fill" cx="15" cy="15" r={R} fill="none" strokeWidth="3.4"
                strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} />
            </svg>
          </div>
        </div>

        {/* 팀원별 이슈 분담 바 */}
        <div className="share-wrap">
          <div className="share-bar">
            {totalActive === 0 ? (
              <span className="share-empty" />
            ) : share.map((s) => (
              <span
                key={s.ini}
                className="share-seg"
                style={{ width: `${(s.count / totalActive) * 100}%`, background: USER_COLORS[s.ini]?.fg || "var(--neutral-line)" }}
                title={`${s.name} ${s.count}건 (${Math.round((s.count / totalActive) * 100)}%)`}
              />
            ))}
          </div>
          <div className="share-legend">
            {share.map((s) => (
              <span key={s.ini} className="share-leg">
                <i style={{ background: USER_COLORS[s.ini]?.fg }} />{s.name} {s.count}
              </span>
            ))}
          </div>
        </div>

        <div className="iss-actions">
          <div className="viewseg">
            <button className={issView === "list" ? "on" : ""} onClick={() => setIssView("list")}><LayoutList />리스트</button>
            <button className={issView === "board" ? "on" : ""} onClick={() => setIssView("board")}><SquareKanban />보드</button>
          </div>
          <button className="newiss" onClick={onNew}><Plus />새 이슈</button>
          <button className="iconbtn close-x" onClick={onBack}><X /></button>
        </div>
      </div>

      {issView === "list" ? (
        <div className="iss-scroll fade" key="list">
          {groups.map((s) => {
            const rows = issues.filter((i) => i.status === s);
            const isHL = !highlightStatus || highlightStatus === s;
            return (
              <div className={`grp${highlightStatus && highlightStatus !== s ? " grp-dim" : ""}${highlightStatus === s ? " grp-highlight" : ""}`} key={s}
                style={{ transition: "opacity .2s ease" }}>
                <div className="grp-head">
                  <span className="nm">{STATUS_META[s].label}</span>
                  <span className="ct">{rows.length}</span>
                  <button className="add" onClick={() => onNew(s)}><Plus /></button>
                </div>
                {rows.map((i) => (
                  <button className="iss-row" key={i.id} onClick={() => onOpen(i)}>
                    <PriorityIcon p={i.priority} />
                    <span className="iid">{i.id}</span>
                    <span className="ttl">{i.title}</span>
                    {i.labels.map((l) => (
                      <LabelChip label={l} colors={labelColors} briefLabels={briefLabels} key={l} />
                    ))}
                    {i.due && <span className="iss-due">{i.due.slice(5).replace("-", "/")}</span>}
                    {i.comments > 0 && <span className="iss-cmt"><MessageSquare />{i.comments}</span>}
                    <Avatar ini={i.assignee} />
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="board fade" key="board">
          {cols.map((s) => {
            const cards = issues.filter((i) => i.status === s);
            return (
              <div className={`bcol${highlightStatus && highlightStatus !== s ? " grp-dim" : ""}${highlightStatus === s ? " grp-highlight" : ""}`}
                key={s} style={{ transition: "opacity .2s ease" }}>
                <div className="bcol-head">
                  <span className="nm">{STATUS_META[s].label}</span>
                  <span className="ct">{cards.length}</span>
                  <button className="add" style={{ marginLeft: "auto" }} onClick={() => onNew(s)}><Plus /></button>
                </div>
                <div className="bcol-body">
                  {cards.map((i) => (
                    <button className="bcard" key={i.id} onClick={() => onOpen(i)}>
                      <div className="top"><PriorityIcon p={i.priority} /><span className="iid">{i.id}</span></div>
                      <div className="bt">{i.title}</div>
                      <div className="bot">
                        {i.labels.map((l) => (<LabelChip label={l} colors={labelColors} briefLabels={briefLabels} key={l} />))}
                        <Avatar ini={i.assignee} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ----------------------------- issue detail ----------------------------- */
function IssueDetail({ iss, onClose, onStatus, onUpdate, onChat, onEvent, labelColors, briefLabels, team = [] }) {
  const statuses = ["backlog", "todo", "progress", "done"];
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(iss.title);
  const [labelInput, setLabelInput] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  function commitTitle() {
    if (titleDraft.trim() && titleDraft !== iss.title) onUpdate(iss.id, { title: titleDraft.trim() });
  }
  function addLabel(l) {
    const t = l.trim();
    if (!t || iss.labels.includes(t)) { setLabelInput(""); return; }
    onUpdate(iss.id, { labels: [...iss.labels, t] });
    setLabelInput("");
  }
  function removeLabel(l) { onUpdate(iss.id, { labels: iss.labels.filter((x) => x !== l) }); }
  function closeDropdowns() { setAssigneeOpen(false); setPriorityOpen(false); }

  return (
    <aside className="detail" onClick={closeDropdowns}>
      <div className="detail-head">
        <div className="detail-inner" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="tag gray">{iss.id}</span>
          <button className={`iconbtn${editing ? " on" : ""}`} title={editing ? "수정 완료" : "수정"}
            style={{ marginLeft: "auto", color: editing ? "var(--key)" : undefined, background: editing ? "var(--key-soft)" : undefined }}
            onClick={(e) => { e.stopPropagation(); if (editing) commitTitle(); setEditing((v) => !v); closeDropdowns(); }}>
            {editing ? <Check /> : <Pencil />}
          </button>
          <button className="iconbtn" onClick={onClose}><X /></button>
        </div>
      </div>
      <div className="detail-scroll">
        <div className="detail-inner">
          {editing
            ? <input autoFocus className="iss-title-input" value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { commitTitle(); setEditing(false); } if (e.key === "Escape") { setEditing(false); setTitleDraft(iss.title); } }} />
            : <h2>{iss.title}</h2>
          }
          <div className="det-prop" style={{ position: "relative" }}>
            <span className="pk">담당자</span>
            {editing ? (
              <>
                <button className="iss-field-btn" onClick={(e) => { e.stopPropagation(); setAssigneeOpen((v) => !v); setPriorityOpen(false); }}>
                  <Avatar ini={iss.assignee} />{iss.assignee ? fullName(iss.assignee) : "미지정"}<ChevronDown style={{ width: 13, height: 13, color: "var(--text-3)" }} />
                </button>
                {assigneeOpen && (
                  <div className="iss-dropdown" onClick={(e) => e.stopPropagation()}>
                    {[{ id: null, name: "미지정" }, ...team].map((m) => (
                      <button key={m.id ?? "none"} className={`iss-dropdown-item${iss.assignee === m.id ? " on" : ""}`}
                        onClick={() => { onUpdate(iss.id, { assignee: m.id }); setAssigneeOpen(false); }}>
                        {m.id ? <Avatar ini={m.id} /> : <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--bg-hover)", display: "inline-block" }} />}
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <span className="pv"><Avatar ini={iss.assignee} />{iss.assignee ? fullName(iss.assignee) : "미지정"}</span>
            )}
          </div>

          {/* 우선순위 */}
          <div className="det-prop" style={{ position: "relative" }}>
            <span className="pk">우선순위</span>
            {editing ? (
              <>
                <button className="iss-field-btn" onClick={(e) => { e.stopPropagation(); setPriorityOpen((v) => !v); setAssigneeOpen(false); }}>
                  <PriorityIcon p={iss.priority} />{PRIORITY[iss.priority]}<ChevronDown style={{ width: 13, height: 13, color: "var(--text-3)" }} />
                </button>
                {priorityOpen && (
                  <div className="iss-dropdown" onClick={(e) => e.stopPropagation()}>
                    {PRIORITY.map((label, idx) => (
                      <button key={idx} className={`iss-dropdown-item${iss.priority === idx ? " on" : ""}`}
                        onClick={() => { onUpdate(iss.id, { priority: idx }); setPriorityOpen(false); }}>
                        <PriorityIcon p={idx} />{label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <span className="pv"><PriorityIcon p={iss.priority} />{PRIORITY[iss.priority]}</span>
            )}
          </div>

          {/* 라벨 */}
          <div className="det-prop" style={{ alignItems: "flex-start" }}>
            <span className="pk" style={{ paddingTop: 3 }}>라벨</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, flex: 1 }}>
              {iss.labels.map((l) => (
                <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <LabelChip label={l} colors={labelColors} briefLabels={briefLabels} />
                  {editing && <button onClick={() => removeLabel(l)} style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1, cursor: "pointer", background: "none", border: "none", padding: "0 1px" }}>×</button>}
                </span>
              ))}
              {editing && (
                <input className="iss-label-input" placeholder="+ 라벨 추가" value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onBlur={() => { if (labelInput.trim()) addLabel(labelInput); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addLabel(labelInput); } }} />
              )}
              {!editing && iss.labels.length === 0 && <span style={{ fontSize: 13, color: "var(--text-3)" }}>없음</span>}
            </div>
          </div>

          {/* 마감 */}
          <div className="det-prop">
            <span className="pk">마감</span>
            {editing
              ? <input type="date" className="iss-date-input" value={iss.due || ""} onChange={(e) => onUpdate(iss.id, { due: e.target.value })} />
              : <span className="pv">{iss.due ? iss.due.replace(/-/g, ".") : <span style={{ color: "var(--text-3)" }}>없음</span>}</span>
            }
          </div>

          {/* 상태 */}
          <div className="det-sec-label">상태</div>
          <div className={`statuspick${editing ? "" : " readonly"}`}>
            {statuses.map((s) => (
              <button key={s} className={iss.status === s ? "on" : ""} disabled={!editing}
                onClick={() => { if (editing) { onStatus(iss.id, s); onUpdate(iss.id, { status: s }); } }}>
                {STATUS_META[s].label}
              </button>
            ))}
          </div>

          {/* 설명 */}
          <div className="det-sec-label">설명</div>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text)" }}>{iss.desc}</div>
        </div>
      </div>
      <div className="detail-foot">
        <div className="detail-inner" style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={() => onChat(iss)}><MessageSquare />대화로 논의</button>
          <button className="btn-ghost" title="회의 일정으로 캘린더에 추가" onClick={() => onEvent(iss)}><CalendarPlus /></button>
        </div>
      </div>
    </aside>
  );
}

/* ----------------------------- list: ideas ----------------------------- */
function ListIdea({ ideas, sort, setSort, onCompose, statusFilter, onFilterStatus, bookmarks = {}, bookmarkCount = 0, ideaQ, setIdeaQ }) {
  const cnt = (s) => ideas.filter((i) => i.status === s).length;
  const IDEA_STATUSES = [
    { key: "review", label: "검토중" },
    { key: "picked", label: "채택됨" },
    { key: "hold", label: "보류" },
  ];
  return (
    <>
      <div className="panel-head">
        <div className="ws-row">
          <div className="ws-name"><Lightbulb style={{ width: 18, height: 18, color: "var(--icon)" }} />아이디어</div>
        </div>
        <div className="searchbox"><Search /><input placeholder="아이디어 검색" value={ideaQ} onChange={(e) => setIdeaQ(e.target.value)} /></div>
      </div>
      <div className="panel-scroll">
        <button className="addbtn" onClick={onCompose}><Plus />새 아이디어</button>
        <div className="sec-label">정렬</div>
        <button className={`row${sort === "rec" ? " on" : ""}`} onClick={() => setSort("rec")}>
          <ThumbsUp className="lead" /><span className="row-title">인기순</span>
        </button>
        <button className={`row${sort === "new" ? " on" : ""}`} onClick={() => setSort("new")}>
          <Clock className="lead" /><span className="row-title">최신순</span>
        </button>
        <button className={`row${sort === "bookmark" ? " on" : ""}`} onClick={() => setSort(sort === "bookmark" ? "rec" : "bookmark")}>
          <Bookmark className="lead" /><span className="row-title">북마크</span>
          {bookmarkCount > 0 && <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 700, marginLeft: "auto" }}>{bookmarkCount}</span>}
        </button>
        <div className="sec-label" style={{ paddingTop: 22 }}>상태</div>
        {IDEA_STATUSES.map(({ key, label }) => (
          <button key={key} className={`row${statusFilter === key ? " on" : ""}`}
            onClick={() => onFilterStatus(statusFilter === key ? null : key)}>
            <span className="row-title">{label}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 700 }}>{cnt(key)}</span>
          </button>
        ))}
      </div>
    </>
  );
}

const STATUS_CLS = { review: "review", picked: "picked", hold: "hold" };
const STATUS_TXT = { review: "검토중", picked: "채택됨", hold: "보류" };

/* ----------------------------- ideas main ----------------------------- */
function IdeaView({ ideas, onOpen, onRec, onCompose, onBack, statusFilter, bookmarks = {}, setBookmarks, ideaQ }) {
  const visibleIdeas = statusFilter ? ideas.filter((i) => i.status === statusFilter) : ideas;
  return (
    <>
      <div className="topbar">
        <div className="top-title"><Lightbulb />아이디어 보드</div>
        <span className="top-sub">{ideaQ ? `"${ideaQ}" 검색 결과 ${visibleIdeas.length}개` : `${ideas.length}개`}</span>
        <div className="top-actions">
          <button className="newiss" onClick={onCompose}><Plus />새 아이디어</button>
          <button className="iconbtn close-x" onClick={onBack}><X /></button>
        </div>
      </div>
      <div className="idea-scroll fade">
        {visibleIdeas.length === 0 && (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-3)", fontSize: 14 }}>
            {ideaQ ? `"${ideaQ}"에 해당하는 아이디어가 없어요.` : "아이디어가 없어요."}
          </div>
        )}
        <div className="idea-grid">
          {visibleIdeas.map((i) => {
            const isHot = i.recs >= 10;
            const isPicked = i.status === "picked";
            const avg = i.ratingCount ? (i.ratingSum / i.ratingCount).toFixed(1) : "0.0";
            return (
              <div className={`idea-card${isPicked ? " picked" : ""}`} key={i.id} onClick={() => onOpen(i)}>
                {/* 북마크 버튼 */}
                <button className={`ic-bookmark${bookmarks[i.id] ? " saved" : ""}`} onClick={(e) => { e.stopPropagation(); setBookmarks((b) => ({ ...b, [i.id]: !b[i.id] })); }} title={bookmarks[i.id] ? "북마크 해제" : "북마크"}>
                  <Bookmark />
                </button>

                {/* 상단: 아바타 + 작성자 */}
                <div className="ic-header">
                  <UserSilhouette ini={i.ini} size={48} radius={14} title={i.author} />
                  <div className="ic-author-wrap">
                    <div className="ic-author">{i.author}</div>
                    <div className="ic-meta">
                      {STATUS_TXT[i.status]}<span className="sep">·</span>{i.time}
                    </div>
                  </div>
                </div>

                {/* 제목 */}
                <div className="ic-title">{i.title}</div>

                {/* 설명 */}
                {i.desc && <div className="ic-desc">{i.desc}</div>}

                {/* 첨부 이미지 썸네일 */}
                {i.images && i.images.length > 0 && (
                  <div className="ic-imgs">
                    {i.images.slice(0, 3).map((img, idx) => (
                      <div key={idx} className="ic-img-thumb" style={{ backgroundImage: `url(${img.url})` }}>
                        {idx === 2 && i.images.length > 3 && <span className="ic-img-more">+{i.images.length - 3}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* 배지 + 평가 */}
                <div className="ic-footer">
                  <div className="ic-badges">
                    {i.tags.slice(0, 2).map((t) => (
                      <span key={t} className="ic-badge neutral">{t}</span>
                    ))}
                    <span className={`ic-badge ${isPicked ? "new-pick" : "hot"}`}>
                      {i.recBy.length}/{ALL_MEMBERS.length} 채택
                    </span>
                  </div>
                  <div className="ic-stats">
                    {i.myEval && Object.values(i.myEval).some(Boolean) ? (
                      <span className="ic-stat">
                        <Star className="star-fill" />
                        {(Object.values(i.myEval).filter(Boolean).reduce((s,v)=>s+v,0)/Object.values(i.myEval).filter(Boolean).length).toFixed(1)}
                      </span>
                    ) : (
                      <span className="ic-stat" style={{ color: "var(--text-3)" }}><Star />미평가</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ----------------------------- idea detail ----------------------------- */
function IdeaDetail({ idea, onClose, onRec, onRate, onChat, onIssue, briefs = [], onUpdateBlock, onAddBlock, onDeleteBlock, onRename, onComment, onVerdict }) {
  const [comments, setComments] = useState(IDEA_COMMENTS[idea.id] || []);
  const [draft, setDraft] = useState("");
  const avg = idea.ratingCount ? (idea.ratingSum / idea.ratingCount).toFixed(1) : "0.0";

  const EVAL_CRITERIA = [
    { key: "freshness",   label: "신선도",       desc: "아이디어의 독창성·참신함" },
    { key: "brand",       label: "브랜드 적합도", desc: "브랜드/캠페인 방향과의 일치도" },
    { key: "feasibility", label: "실행 가능성",  desc: "현재 리소스로 실현 가능한가" },
    { key: "budget",      label: "예산 타당성",   desc: "예산 범위 내에서 조달 가능한가" },
  ];

  const myEval = idea.myEval || {};
  const evalVals = EVAL_CRITERIA.map((c) => myEval[c.key] || 0);
  const evalAvg = evalVals.filter(Boolean).length
    ? (evalVals.filter(Boolean).reduce((s, v) => s + v, 0) / evalVals.filter(Boolean).length).toFixed(1)
    : null;

  function addComment() {
    const t = draft.trim();
    if (!t) return;
    setComments((c) => [...c, { ini: "주", who: "주헌", tx: t }]);
    setDraft("");
  }
  // 이 아이디어가 전원 추천으로 채택되면 연결된 브리프가 생성됨 — 같은 화면 안에서 바로 작성
  const brief = briefs.find((b) => b.ideaId === idea.id);
  return (
    <aside className="detail">
      {/* 직행 팝업처럼: 상단 다크 히어로 배너 */}
      <div className="idea-detail-hero">
        <div className="idea-detail-hero-inner">
          <span className={`idea-detail-status-badge${idea.status === "picked" ? " picked" : ""}`} style={{ color: idea.status === "picked" ? "#05d560" : "rgba(255,255,255,0.80)" }}>{STATUS_TXT[idea.status]}</span>
          <button className="iconbtn idea-detail-close" onClick={onClose} style={{ color: "rgba(255,255,255,0.80)" }}><X /></button>
        </div>
        <div className="idea-detail-hero-content" style={{ color: "#fff" }}>
          <h2 className="idea-detail-title" style={{ color: "#fff" }}>{idea.title}</h2>
          <div className="idea-detail-meta">
            <UserSilhouette ini={idea.ini} size={20} radius={6} title={idea.author} />
            <span>{idea.author}</span>
            <span className="idea-detail-sep">·</span>
            <span>{idea.time}</span>
          </div>
        </div>
      </div>
      <div className="detail-scroll">
        <div className="detail-inner">
          {/* 본문 */}
          {idea.desc && <div className="idea-detail-desc">{idea.desc}</div>}
          {idea.tags.length > 0 && <div className="tags" style={{ marginTop: 14, marginBottom: 4 }}>{idea.tags.map((t) => <span className="tag-chip" key={t}>{t}</span>)}</div>}

          {/* 첨부 이미지 갤러리 */}
          {idea.images && idea.images.length > 0 && (
            <div className="idea-detail-imgs">
              {idea.images.map((img, idx) => (
                <img key={idx} src={img.url} alt={img.name} className="idea-detail-img"
                  onClick={() => window.open(img.url, "_blank")} />
              ))}
            </div>
          )}

          <div className="det-sec-label">평가</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
            <button className={`rec-btn${idea.recommended ? " on" : ""}`} onClick={() => onRec(idea.id)}><ThumbsUp />채택 {idea.recs}</button>
            {idea.myRating > 0 && (
              <span className="eval-score" style={{ fontSize: 14 }}>
                <Star style={{ color: "#f5b400", fill: "#f5b400" }} />{idea.myRating}점
                <span className="n">· 내 평가</span>
              </span>
            )}
          </div>
          <div className="rec-progress">
            <div className="rec-progress-bar"><div className="rec-progress-fill" style={{ width: `${(idea.recBy.length / ALL_MEMBERS.length) * 100}%` }} /></div>
            <span>{idea.recBy.length}/{ALL_MEMBERS.length}명 채택</span>
          </div>

          <div style={{ fontSize: 12.5, color: "var(--text-2)", margin: "16px 0 8px", fontWeight: 700 }}>별점</div>
          <div className="stars">
            {[1,2,3,4,5,6,7].map((n) => (
              <button key={n} onClick={() => onRate(idea.id, n)} title={`${n}점`}>
                <Star className={n <= idea.myRating ? "fill" : ""} />
              </button>
            ))}
          </div>

          {/* 전원 채택 시: 브리프 작성 섹션이 같은 화면 안에 바로 생성됨 */}
          {brief && (
            <InlineBrief
              brief={brief}
              onUpdateBlock={onUpdateBlock}
              onAddBlock={onAddBlock}
              onDeleteBlock={onDeleteBlock}
              onRename={onRename}
            />
          )}

          <div className="det-sec-label">의견 {comments.length}개</div>
          <div className="cmt-box">
            <input placeholder="의견을 남겨보세요" value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addComment(); }} />
            <button onClick={addComment}><Send /></button>
          </div>
          {/* 시뮬레이션: 내 아이디어에 팀원 댓글 달기 테스트 버튼 */}
          {idea.me && onComment && (
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {[{ini:"소",who:"소라"},{ini:"민",who:"민우"},{ini:"예",who:"예인"}].map((m) => (
                <button key={m.ini} style={{ fontSize: 11.5, color: "var(--text-3)", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 7, padding: "3px 9px", cursor: "pointer" }}
                  onClick={() => {
                    const tx = `${m.who}님이 아이디어에 댓글을 달았어요.`;
                    setComments((c) => [...c, { ini: m.ini, who: m.who, tx }]);
                    onComment({ ideaId: idea.id, title: idea.title, ini: m.ini });
                  }}>
                  {m.who} 댓글 시뮬
                </button>
              ))}
            </div>
          )}
          <div className="cmt-list">
            {comments.map((c, idx) => (
              <div className="cmt" key={idx}>
                <UserSilhouette ini={c.ini} size={28} radius={8} title={c.who} />
                <div className="b"><div className="nm">{c.who}</div><div className="tx">{c.tx}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="detail-foot">
        <div className="detail-inner" style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={() => onChat(idea)}><MessageSquare />대화로 논의</button>
        </div>
      </div>
    </aside>
  );
}

/* ----------------------------- 브리프 인라인 섹션 (아이디어 상세 화면 내부) -----------------------------
 * 전원 채택으로 브리프가 자동 생성되면, 별도 화면 없이 아이디어 상세 화면 안에서 바로 작성한다.
 * 섹션: Background | Insight | Idea | Effect — 각 섹션은 블록 단위로 추가/수정/삭제 가능 */
function InlineBrief({ brief, onUpdateBlock, onAddBlock, onDeleteBlock, onRename }) {
  const [activeSection, setActiveSection] = useState("background");
  const [editingBlock, setEditingBlock] = useState(null); // { section, blockId }
  const [titleDraft, setTitleDraft] = useState(brief.title || "");
  const [drafts, setDrafts] = useState({});

  function startEdit(section, blockId, text) {
    setEditingBlock({ section, blockId });
    setDrafts((d) => ({ ...d, [blockId]: text }));
  }
  function liveChange(section, blockId, text) {
    setDrafts((d) => ({ ...d, [blockId]: text }));
    onUpdateBlock(brief.id, section, blockId, text);
  }
  function commitEdit() {
    setEditingBlock(null);
  }
  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") { setEditingBlock(null); }
  }

  const lastEdit = brief.editLog.length > 0 ? brief.editLog[brief.editLog.length - 1] : null;

  return (
    <div className="inline-brief">
      {/* 섹션 헤더 */}
      <div className="inline-brief-header">
        <FileText style={{ width: 15, height: 15, color: "var(--text)", flex: "0 0 auto" }} />
        <span className="inline-brief-header-title">브리프</span>
        {lastEdit && <span className="inline-brief-header-sub">{lastEdit.name} · {lastEdit.at}</span>}
      </div>

      {/* 제목 */}
      <div style={{ padding: "12px 28px 0" }}>
        <input
          className="brief-title-input"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => onRename && onRename(brief.id, titleDraft)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } }}
          placeholder="브리프 제목"
        />
      </div>

      {/* 섹션 탭 */}
      <div className="inline-brief-tabs">
        {SECTION_ORDER.map((sec) => (
          <button key={sec} type="button" className={`inline-brief-tab${activeSection === sec ? " on" : ""}`} onClick={() => setActiveSection(sec)}>
            {SECTION_LABELS[sec]}
          </button>
        ))}
      </div>

      <div className="inline-brief-body">
        {/* 블록 목록 */}
        <div className="brief-blocks">
          {brief.sections[activeSection].map((block) => {
            const isEditing = editingBlock?.section === activeSection && editingBlock?.blockId === block.id;
            return (
              <div key={block.id} className={`brief-block${isEditing ? " editing" : ""}`}>
                <div className="brief-block-body">
                  {isEditing ? (
                    <textarea
                      autoFocus
                      className="brief-textarea"
                      value={drafts[block.id] ?? block.text}
                      onChange={(e) => liveChange(activeSection, block.id, e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKey}
                      placeholder={`${SECTION_LABELS[activeSection]}…`}
                    />
                  ) : (
                    <div
                      className={`brief-text${!block.text ? " empty" : ""}`}
                      onClick={() => startEdit(activeSection, block.id, block.text)}
                    >
                      {block.text || `작성하세요…`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <button className="brief-add-block" onClick={() => onAddBlock(brief.id, activeSection)}>
            <Plus style={{ width: 13, height: 13 }} />블록 추가
          </button>
        </div>
      </div>
    </div>
  );
}


/* ----------------------------- idea compose ----------------------------- */
function IdeaCompose({ onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState([]); // [{ name, url }]
  const fileRef = useRef(null);
  const ok = title.trim().length > 0;

  function handleFiles(files) {
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      if (images.length >= 4) return; // 최대 4장
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((arr) => arr.length < 4 ? [...arr, { name: f.name, url: e.target.result }] : arr);
      };
      reader.readAsDataURL(f);
    });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>새 아이디어</h3>
          <button className="iconbtn" style={{ marginLeft: "auto" }} onClick={onClose}><X /></button>
        </div>
        <div className="modal-body">
          <div className="field"><label>제목</label><input autoFocus placeholder="떠오른 아이디어를 한 줄로" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field"><label>설명</label><textarea rows={4} placeholder="아이디어를 자유롭게 풀어주세요" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="field"><label>태그</label><input placeholder="쉼표로 구분 (예: 공익, 설치)" value={tags} onChange={(e) => setTags(e.target.value)} /></div>

          {/* 이미지 첨부 */}
          <div className="field">
            <label>사진 첨부 <span style={{ fontWeight: 400, color: "var(--text-3)" }}>(선택 · 최대 4장)</span></label>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)} />
            <div className="idea-img-grid">
              {images.map((img, i) => (
                <div key={i} className="idea-img-thumb">
                  <img src={img.url} alt={img.name} />
                  <button className="idea-img-del" onClick={() => setImages((a) => a.filter((_, j) => j !== i))}><X /></button>
                </div>
              ))}
              {images.length < 4 && (
                <button className="idea-img-add" onClick={() => fileRef.current?.click()}>
                  <Plus style={{ width: 22, height: 22 }} />
                  <span>사진 추가</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-primary" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }}
            onClick={() => ok && onSubmit({ title: title.trim(), desc: desc.trim(), tags: tags.split(",").map((t) => t.trim()), images })}>
            <Plus />올리기
          </button>
          <button className="ghost" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- issue compose ----------------------------- */
function IssueCompose({ initialStatus, team, onClose, onSubmit, labelColors = {} }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState(STATUS_META[initialStatus] ? initialStatus : "backlog");
  const [priority, setPriority] = useState(2);
  const [assignee, setAssignee] = useState("");
  const [labels, setLabels] = useState([]);
  const [due, setDue] = useState("");
  const [open, setOpen] = useState(null); // "status"|"priority"|"assignee"|"label"|"due"
  const [newLabel, setNewLabel] = useState("");
  const [localColors, setLocalColors] = useState(labelColors);
  const ok = title.trim().length > 0;
  const available = Object.keys(localColors);
  function toggleLabel(l) { setLabels((a) => a.includes(l) ? a.filter((x) => x !== l) : [...a, l]); }
  function addCustomLabel() {
    const t = newLabel.trim();
    if (!t || localColors[t]) return;
    const color = randomLabelColor(Object.values(localColors));
    setLocalColors((m) => ({ ...m, [t]: color }));
    setLabels((a) => [...a, t]);
    setNewLabel("");
  }
  function submit() { if (ok) { onSubmit({ title: title.trim(), desc: desc.trim(), status, priority, assignee: assignee || null, labels, due, extraLabelColors: localColors }); } }
  function tog(k) { setOpen((v) => v === k ? null : k); }

  const statusM = STATUS_META[status] || STATUS_META["backlog"];
  const prioLabel = PRIORITY[priority];
  const assigneeName = assignee ? team.find((p) => p.id === assignee)?.name : null;
  const labelsSel = labels.length;

  return (
    <div className="modal-scrim" onClick={() => { if (open) setOpen(null); else onClose(); }}>
      <div className="iss-compose" onClick={(e) => e.stopPropagation()}>
        {/* 제목 */}
        <input
          className="iss-compose-title"
          autoFocus
          placeholder="이슈 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        />
        {/* 설명 */}
        <textarea
          className="iss-compose-desc"
          placeholder="업무 내용을 적어주세요."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
        />
        {/* 하단 툴바 */}
        <div className="iss-compose-toolbar">
          <div className="iss-compose-chips">
            {/* 상태 */}
            <div className="iss-chip-wrap">
              <button className="iss-chip" onClick={() => tog("status")}>
                {statusM.label}
              </button>
              {open === "status" && (
                <div className="iss-chip-drop">
                  {STATUS_ORDER.map((s) => (
                    <button key={s} className={`iss-drop-item${status === s ? " on" : ""}`}
                      onClick={() => { setStatus(s); setOpen(null); }}>
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* 우선순위 */}
            <div className="iss-chip-wrap">
              <button className="iss-chip" onClick={() => tog("priority")}>
                <PriorityIcon p={priority} />{prioLabel}
              </button>
              {open === "priority" && (
                <div className="iss-chip-drop">
                  {[0, 1, 2, 3, 4].map((p) => (
                    <button key={p} className={`iss-drop-item${priority === p ? " on" : ""}`}
                      onClick={() => { setPriority(p); setOpen(null); }}>
                      <PriorityIcon p={p} />{PRIORITY[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* 담당자 */}
            <div className="iss-chip-wrap">
              <button className="iss-chip" onClick={() => tog("assignee")}>
                <Users style={{ width: 13, height: 13 }} />
                {assigneeName || "담당자"}
              </button>
              {open === "assignee" && (
                <div className="iss-chip-drop">
                  <button className={`iss-drop-item${!assignee ? " on" : ""}`}
                    onClick={() => { setAssignee(""); setOpen(null); }}>
                    <span style={{ width: 16, height: 16, display: "inline-block" }} />미지정
                  </button>
                  {team.map((p) => (
                    <button key={p.id} className={`iss-drop-item${assignee === p.id ? " on" : ""}`}
                      onClick={() => { setAssignee(p.id); setOpen(null); }}>
                      <UserSilhouette ini={p.ini} size={18} radius={5} />{p.name}{p.me ? " (나)" : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* 라벨 */}
            <div className="iss-chip-wrap">
              <button className="iss-chip" onClick={() => tog("label")}>
                <Tag style={{ width: 13, height: 13 }} />
                {labelsSel ? labels.slice(0, 2).join(", ") + (labels.length > 2 ? ` +${labels.length - 2}` : "") : "라벨"}
              </button>
              {open === "label" && (
                <div className="iss-chip-drop iss-chip-drop-wide">
                  {available.map((l) => (
                    <button key={l} className={`iss-drop-item${labels.includes(l) ? " on" : ""}`}
                      onClick={() => { toggleLabel(l); setOpen(null); }}>
                      <span className="iss-drop-label-dot" style={{ background: localColors[l] }} />
                      {l}
                      {labels.includes(l) && <Check style={{ width: 13, height: 13, marginLeft: "auto" }} />}
                    </button>
                  ))}
                  <div className="iss-label-new">
                    <input
                      placeholder="새 라벨 추가…"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomLabel(); } }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); addCustomLabel(); }} disabled={!newLabel.trim()}>
                      <Plus style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* 마감일 */}
            <div className="iss-chip-wrap">
              <button className="iss-chip" onClick={() => tog("due")}>
                <CalendarIcon style={{ width: 13, height: 13 }} />
                {due || "마감일"}
              </button>
              {open === "due" && (
                <div className="iss-chip-drop iss-chip-drop-date">
                  <input type="date" value={due} onChange={(e) => { setDue(e.target.value); setOpen(null); }}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, border: "1px solid var(--border-2)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
              )}
            </div>
          </div>
          {/* 생성 버튼 */}
          <button className="btn-primary iss-compose-submit" disabled={!ok}
            style={{ opacity: ok ? 1 : 0.4 }} onClick={submit}>
            이슈 만들기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- event compose ----------------------------- */
const HOURS = Array.from({ length: 24 }, (_, h) => h);
function timeLabel(h, mn) {
  const period = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${h12}:${String(mn).padStart(2, "0")}`;
}
const TIME_OPTIONS = HOURS.flatMap((h) => [0, 30].map((mn) => timeLabel(h, mn)));

/* 회의 일정 조율 만들기 — 날짜 여러 개 + 시간 범위 선택 */
function TimePollCompose({ todayIso, onClose, onSubmit }) {
  const realToday = new Date().toISOString().slice(0, 10);
  const dayOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(realToday); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10);
  });
  const [title, setTitle] = useState("");
  const [selDates, setSelDates] = useState([realToday]);
  const HOUR_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const [fromH, setFromH] = useState("10:00");
  const [toH, setToH] = useState("17:00");
  const fmtDate = (iso) => { const dt = new Date(iso); return `${dt.getMonth() + 1}/${dt.getDate()}`; };
  const times = HOUR_SLOTS.filter((t) => t >= fromH && t < toH);
  const ok = title.trim().length > 0 && selDates.length > 0 && times.length > 0;
  function toggleDate(d) { setSelDates((arr) => arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort()); }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal poll-compose-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>회의 일정 조율</h3>
          <button className="iconbtn" style={{ marginLeft: "auto" }} onClick={onClose}><X /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>회의 제목</label>
            <input autoFocus placeholder="예: 6월 캠페인 킥오프" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>후보 날짜 <span style={{ fontWeight: 400, color: "var(--text-3)" }}>여러 개 선택 가능</span></label>
            <div className="poll-date-pick">
              {dayOptions.map((d) => (
                <button key={d} type="button" className={`poll-date-opt${selDates.includes(d) ? " on" : ""}`} onClick={() => toggleDate(d)}>
                  {fmtDate(d)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field"><label>시작</label>
              <select value={fromH} onChange={(e) => setFromH(e.target.value)}>
                {HOUR_SLOTS.slice(0, -1).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field"><label>종료</label>
              <select value={toH} onChange={(e) => setToH(e.target.value)}>
                {HOUR_SLOTS.slice(1).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

        </div>
        <div className="modal-foot">
          <button className="btn-primary" disabled={!ok} style={{ opacity: ok ? 1 : 0.45 }}
            onClick={() => ok && onSubmit({ title: title.trim(), dates: selDates, times })}>
            <Send style={{ width: 15, height: 15 }} />공유하고 조율 시작
          </button>
          <button className="ghost" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

function EventCompose({ initialDate, prefill, onClose, onSubmit }) {
  const [title, setTitle] = useState(prefill?.title || "");
  const [date, setDate] = useState(initialDate);
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState("오후 2:00");
  const [end, setEnd] = useState("오후 3:00");
  const [place, setPlace] = useState(prefill?.place || "");
  const [type, setType] = useState(prefill?.type || "team");
  const [color, setColor] = useState(EVENT_COLORS[0].key);
  const ok = title.trim().length > 0 && date;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>일정 추가</h3>
          <button className="iconbtn" style={{ marginLeft: "auto" }} onClick={onClose}><X /></button>
        </div>
        <div className="modal-body" style={{ gap: 10, padding: "14px 20px" }}>
          <div className="field"><label>제목</label><input autoFocus placeholder="일정 제목" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field"><label>날짜</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="field">
            <label>시간</label>
            <div className="timerow">
              <button type="button" className={`daypick${allDay ? " on" : ""}`} onClick={() => setAllDay((v) => !v)}>종일</button>
              {!allDay && (
                <>
                  <select value={start} onChange={(e) => setStart(e.target.value)}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="timerow-sep">~</span>
                  <select value={end} onChange={(e) => setEnd(e.target.value)}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>
          <div className="field"><label>장소</label><input placeholder="장소 (선택)" value={place} onChange={(e) => setPlace(e.target.value)} /></div>
          <div className="field">
            <label>색상</label>
            <div className="colorpick">
              {EVENT_COLORS.map((c) => (
                <button key={c.key} type="button" className={`color-dot${color === c.key ? " on" : ""}`}
                  style={{ background: c.val, "--c": c.val }} title={c.name} onClick={() => setColor(c.key)}>
                  {color === c.key && <Check />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-primary" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }}
            onClick={() => ok && onSubmit({
              title: title.trim(), date, type, place: place.trim(), color,
              start: allDay ? "종일" : start, end: allDay ? "" : end,
            })}>
            <Plus />추가
          </button>
          <button className="ghost" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- 내 프로필 편집 ----------------------------- */
function ProfileModal({ profile, working, myTodayMinutes, theme, onSetTheme, onSave, onClose }) {
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [status, setStatus] = useState(profile.status);
  const [email, setEmail] = useState(profile.email);
  const ok = name.trim().length > 0;
  const themes = [
    { id: "white", label: "화이트", icon: <Sun style={{ width: 16, height: 16 }} /> },
    { id: "glass", label: "기본", icon: <Sparkles style={{ width: 16, height: 16 }} /> },
    { id: "dark", label: "다크", icon: <Moon style={{ width: 16, height: 16 }} /> },
  ];
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* 상단 히어로 배너 — 직행 기업 페이지 스타일 */}
        <div className="profile-modal-hero">
          <button className="iconbtn profile-modal-close" onClick={onClose}><X /></button>
          <div className="profile-modal-avatar">
            <span style={{ position: "relative", display: "inline-flex" }}>
              <UserSilhouette ini="주" size={64} radius={18} title={name} />
              <span className={`presence ${working ? "on" : "off"}`} style={{ width: 14, height: 14, right: 0, bottom: 0 }} />
            </span>
          </div>
          <div className="profile-modal-hero-info">
            <div className="profile-modal-name">{name}</div>
            <div className="profile-modal-role">{role}</div>
          </div>
          <div className="profile-modal-stats">
            <div className="profile-modal-stat-item">
              <span className="profile-modal-stat-val">{working ? "근무 중" : "오프라인"}</span>
              <span className="profile-modal-stat-label">상태</span>
            </div>
            <div className="profile-modal-stat-divider" />
            <div className="profile-modal-stat-item">
              <span className="profile-modal-stat-val">{Math.floor(myTodayMinutes / 60)}h {myTodayMinutes % 60}m</span>
              <span className="profile-modal-stat-label">오늘 근무</span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="modal-body" style={{ paddingTop: 18 }}>
          <div className="field"><label>이름</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" /></div>
          <div className="field"><label>역할</label><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="역할 / 직함" /></div>
          <div className="field"><label>상태 메시지</label><input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="상태 메시지 (선택)" /></div>
          <div className="field"><label>이메일</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" /></div>

        </div>
        <div className="modal-body" style={{ paddingTop: 0, paddingBottom: 4 }}>
          <div className="field">
            <label>테마</label>
            <div className="theme-seg">
              {themes.map((t) => (
                <button key={t.id} type="button" className={`theme-opt${theme === t.id ? " on" : ""}`} onClick={() => onSetTheme(t.id)}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-primary" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }}
            onClick={() => ok && onSave({ name: name.trim(), role: role.trim(), status: status.trim(), email: email.trim() })}>
            <Check />저장
          </button>
          <button className="ghost" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- command menu (Cmd+K) ----------------------------- */
function CommandMenu({ commands, shortcuts, onSetShortcut, onClose, onRun }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [capturing, setCapturing] = useState(null); // 단축키 입력 대기 중인 command id
  const cmdIcon = {
    "go-home": <Home />, "go-calendar": <CalendarIcon />, "go-ideas": <Lightbulb />,
    "go-issues": <ListTodo />, "go-manage": <Users />, "new-issue": <ListTodo />,
    "new-event": <CalendarPlus />, "new-idea": <Lightbulb />, "new-poll": <Users />,
    "toggle-dark": <Moon />, "open-profile": <Settings />,
  };
  const list = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  const grps = [...new Set(list.map((c) => c.grp))];

  function onKey(e) {
    if (capturing) return; // 캡처 중엔 목록 탐색 비활성화
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); list[sel] && onRun(list[sel].id); }
  }
  // 단축키 캡처
  function captureKey(e, id) {
    e.preventDefault(); e.stopPropagation();
    if (e.key === "Escape") { setCapturing(null); return; }
    if (e.key === "Backspace" || e.key === "Delete") { onSetShortcut(id, null); setCapturing(null); return; }
    // 단일 문자/숫자 키만 허용
    if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
      onSetShortcut(id, e.key.toLowerCase());
      setCapturing(null);
    }
  }
  let flat = -1;
  return (
    <div className="cmd-scrim" onClick={onClose}>
      <div className="cmd" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input">
          <Search />
          <input autoFocus placeholder="명령 검색 또는 실행" value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} />
          <span className="kbd">ESC</span>
        </div>

        <div className="cmd-list">
          {list.length === 0 && <div className="cmd-empty">일치하는 명령이 없어요.</div>}
          {grps.map((g) => (
            <div key={g}>
              <div className="cmd-grp">{g}</div>
              {list.filter((c) => c.grp === g).map((c) => {
                flat += 1; const idx = flat;
                const sc = shortcuts[c.id];
                const isCap = capturing === c.id;
                return (
                  <div key={c.id} className={`cmd-item${idx === sel ? " sel" : ""}`}
                    onMouseEnter={() => !capturing && setSel(idx)}>
                    <button className="cmd-run" onClick={() => onRun(c.id)}>
                      {cmdIcon[c.id] || <Command />}<span className="cl">{c.label}</span>
                    </button>
                    <button
                      ref={(el) => { if (isCap && el) el.focus(); }}
                      className={`cmd-shortcut${isCap ? " capturing" : ""}${sc ? " set" : ""}`}
                      onClick={() => setCapturing(isCap ? null : c.id)}
                      onKeyDown={(e) => isCap && captureKey(e, c.id)}
                      onBlur={() => isCap && setCapturing(null)}
                      title={sc ? "클릭해서 변경 · Backspace로 삭제" : "클릭해서 단축키 지정"}>
                      {isCap ? "키 입력…" : sc ? <span className="kbd">{sc.toUpperCase()}</span> : <span className="cmd-shortcut-add">+ 단축키</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cmd-foot">
          <span className="ci"><span className="kbd">↑</span><span className="kbd">↓</span>이동</span>
          <span className="ci"><span className="kbd">↵</span>실행</span>
          <span className="ci"><Command style={{ width: 13, height: 13 }} /><span className="kbd">K</span>열기 닫기</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Workspace — props 기반 메인 컴포넌트 (Supabase 연동 버전)
   ========================================================================= */
export default function Workspace({
  myProfile, myIni, myName, userId, onSignOut, onUpdateProfile, todayIso,
  team, issues, onAddIssue, onUpdateIssue,
  ideas, ideaComments, onAddIdea, onUpdateIdea, onAddComment,
  events, onAddEvent, onUpdateEvent,
  briefs, onAddBrief, onUpdateBrief,
  chat, dmChat, selDM, setSelDM, onSendTeam, onSendDM,
  todayMinutes, onStartWork, onEndWork,
  notifications, unreadCount, onPushNotification, onMarkRead, onMarkAllRead,
}) {
  const [theme, setTheme] = useState(myProfile?.theme || "glass");
  const dark = theme === "dark";
  const glass = theme === "glass";
  const cycleTheme = () => setTheme((t) => (t === "white" ? "glass" : t === "glass" ? "dark" : "white"));
  const [view, setView] = useState("home");
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [calM, setCalM] = useState(new Date().getMonth());
  const [selEvent, setSelEvent] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [draft, setDraft] = useState("");
  const [focus, setFocus] = useState(false);
  const [dmDraft, setDmDraft] = useState("");
  const [dmFocus, setDmFocus] = useState(false);
  const [timePolls, setTimePolls] = useState([]);
  const [pollCompose, setPollCompose] = useState(false);
  const [popChat, setPopChat] = useState(null);
  const [shortcuts, setShortcuts] = useState({ "go-home": "h", "go-issues": "i", "new-issue": "c", "new-event": "e" });
  const [homeLayout, setHomeLayout] = useState(["work", "schedule", "compare", "myissues"]);
  const [homeEdit, setHomeEdit] = useState(false);
  const [issView, setIssView] = useState("list");
  const [selIssue, setSelIssue] = useState(null);
  const [issueStatusFilter, setIssueStatusFilter] = useState(null);
  const [composeIssue, setComposeIssue] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [ideaSort, setIdeaSort] = useState("rec");
  const [bookmarks, setBookmarks] = useState({});
  const [ideaQ, setIdeaQ] = useState("");
  const [ideaStatusFilter, setIdeaStatusFilter] = useState(null);
  const [selIdea, setSelIdea] = useState(null);
  const [composeIdea, setComposeIdea] = useState(false);
  const [labelColors, setLabelColors] = useState({});
  const [briefLabels, setBriefLabels] = useState(new Set());
  const [cmdOpen, setCmdOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profile, setProfile] = useState(myProfile);
  const [profileOpen, setProfileOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [todayMs, setTodayMs] = useState(todayMinutes * 60000);
  const [sessionStart, setSessionStart] = useState(null);
  const [liveMs, setLiveMs] = useState(0);
  const [composeEvent, setComposeEvent] = useState(null);
  const scrollRef = useRef(null);
  const [nowTick, setNowTick] = useState(new Date());

  useEffect(() => { const id = setInterval(() => setNowTick(new Date()), 30000); return () => clearInterval(id); }, []);
  const nowMin = nowTick.getHours() * 60 + nowTick.getMinutes();
  const presenceOf = (m) => computePresence(m, nowMin, working && m.me);

  const cycle = useMemo(() => {
    const info = getCycleInfo(todayIso);
    const cycleIssues = issues.filter((i) => i.cycle);
    const done = cycleIssues.filter((i) => i.status === "done").length;
    return { ...info, done, total: cycleIssues.length };
  }, [issues]);

  const weeks = useMemo(() => monthMatrix(calY, calM), [calY, calM]);
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  }, [events]);
  const upcoming = useMemo(
    () => events.filter((e) => e.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6),
    [events]
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [view, chat, dmChat, selDM]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen((v) => !v); return; }
      if (e.key === "Escape") { setCmdOpen(false); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;
      if (cmdOpen) return;
      const key = e.key.toLowerCase();
      const hit = Object.entries(shortcuts).find(([, k]) => k === key);
      if (hit) { e.preventDefault(); runCommand(hit[0]); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts, cmdOpen]);

  useEffect(() => {
    if (!working) return;
    const id = setInterval(() => setLiveMs(Date.now() - sessionStart), 100);
    return () => clearInterval(id);
  }, [working, sessionStart]);

  const myTodayMs = todayMs + (working ? liveMs : 0);
  const myTodayMinutes = Math.floor(myTodayMs / 60000);
  const liveSeconds = Math.floor(liveMs / 1000);

  const goView = (v) => {
    setView(v); setSelEvent(null); setSelIssue(null); setSelIdea(null);
    if (v !== "home") setSelDM(undefined);
    setMobileDetail(v === "home" || v === "issues" || v === "ideas" || v === "manage");
  };

  const COMMANDS = [
    { id: "go-home", grp: "이동", label: "홈으로 이동", run: () => goView("home") },
    { id: "go-calendar", grp: "이동", label: "캘린더로 이동", run: () => goView("calendar") },
    { id: "go-ideas", grp: "이동", label: "아이디어로 이동", run: () => goView("ideas") },
    { id: "go-issues", grp: "이동", label: "이슈로 이동", run: () => goView("issues") },
    { id: "go-manage", grp: "이동", label: "관리로 이동", run: () => goView("manage") },
    { id: "new-issue", grp: "만들기", label: "새 이슈", run: () => setComposeIssue({ status: "backlog" }) },
    { id: "new-event", grp: "만들기", label: "새 일정", run: () => openComposeEvent(todayIso) },
    { id: "new-idea", grp: "만들기", label: "새 아이디어", run: () => setComposeIdea(true) },
    { id: "new-poll", grp: "만들기", label: "회의 일정 조율", run: () => setPollCompose(true) },
    { id: "toggle-dark", grp: "설정", label: "다크/라이트 모드 전환", run: () => cycleTheme() },
    { id: "open-profile", grp: "설정", label: "내 프로필 열기", run: () => setProfileOpen(true) },
  ];
  function runCommand(id) { const c = COMMANDS.find((c) => c.id === id); if (c) c.run(); }
  function setShortcut(id, key) {
    setShortcuts((s) => {
      const next = { ...s };
      Object.keys(next).forEach((k) => { if (next[k] === key) delete next[k]; });
      if (key) next[id] = key; else delete next[id];
      return next;
    });
  }

  // 채팅
  async function send() {
    const t = draft.trim(); if (!t) return;
    await onSendTeam(t);
    setDraft("");
  }
  async function sendDM() {
    const t = dmDraft.trim(); if (!t || selDM === undefined) return;
    await onSendDM(t);
    setDmDraft("");
  }

  function selectMember(id) { setSelDM(id); setMobileDetail(true); }

  async function sendMention(targetId, ref) {
    const text = "이 내용 같이 논의해볼까요?";
    await onSendTeam(text, ref);
    setSelDM(null);
    setView("home");
    setMobileDetail(true);
  }

  function showToast(msg) { setToast({ msg }); setTimeout(() => setToast(null), 2800); }

  // 회의 조율
  async function createTimePoll({ title, dates, times }) {
    const id = "poll-" + Date.now();
    const allSlots = [];
    dates.forEach((d) => times.forEach((t) => allSlots.push(`${d}|${t}`)));
    const poll = { id, title, dates, times, votes: { [myIni]: [] }, createdAt: "지금" };
    setTimePolls((arr) => [...arr, poll]);
    setPollCompose(false);
    await onSendTeam("회의 일정을 조율해요. 가능한 시간을 표시해주세요!", { kind: "poll", pollId: id });
    setView("home"); setSelDM(null); setMobileDetail(true);
    showToast("일정 조율을 팀 대화에 공유했어요");
  }
  function votePollSlot(pollId, slotKey) {
    setTimePolls((arr) => arr.map((p) => {
      if (p.id !== pollId) return p;
      const cur = p.votes[myIni] || [];
      const next = cur.includes(slotKey) ? cur.filter((s) => s !== slotKey) : [...cur, slotKey];
      return { ...p, votes: { ...p.votes, [myIni]: next } };
    }));
  }

  // 이슈
  const INIT_LABEL_COLORS_local = {};
  async function addIssue(issue) {
    const nextId = `IMB-${String(issues.length + 1).padStart(2, "0")}`;
    const ni = { ...issue, id: nextId, comments: 0 };
    await onAddIssue(ni);
    if (ni.assignee === myIni) {
      await onPushNotification({ kind: "issue-assigned", issueId: ni.id, title: ni.title, ini: myIni });
      showToast(`이슈 ${ni.id}가 나에게 배정됐어요`);
    } else {
      showToast(`이슈 ${nextId} 생성됨`);
    }
  }
  function setIssueStatus(id, status) { onUpdateIssue(id, { status }); }
  function issueToChat(iss) { sendMention(iss.assignee, { kind: "issue", id: iss.id, title: iss.title, sub: `${STATUS_META[iss.status].label}${iss.due ? ` · 마감 ${iss.due}` : ""}` }); }
  function issueToEvent(iss) {
    setSelIssue(null);
    setComposeEvent({ date: iss.due || todayIso, prefill: { title: iss.title + " 논의", place: "회의실 A" } });
  }

  // 출퇴근
  async function toggleWork() {
    if (working) {
      const start = sessionStart;
      setWorking(false);
      setSessionStart(null);
      const elapsed = await onEndWork(start);
      setTodayMs((ms) => ms + elapsed * 60000);
      setLiveMs(0);
      showToast("업무를 종료했어요");
    } else {
      const startMs = await onStartWork();
      setSessionStart(startMs);
      setLiveMs(0);
      setWorking(true);
    }
  }

  // 아이디어
  function pushNotification(n) { onPushNotification(n); }

  async function toggleRec(id) {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;
    const already = idea.recBy.includes(myIni);
    const newRecBy = already ? idea.recBy.filter((m) => m !== myIni) : [...idea.recBy, myIni];
    const newRecs = idea.recs + (already ? -1 : 1);
    let newStatus = idea.status;
    let createdBrief = null;
    if (!already && newRecBy.length >= team.length && newStatus !== "picked") {
      newStatus = "picked";
      createdBrief = {
        id: "br-" + id, idea_id: id, idea_author_ini: idea.ini,
        title: idea.title, sections: {
          background: [mkBlock("", myIni, todayIso)],
          insight: [mkBlock("", myIni, todayIso)],
          idea: [mkBlock(idea.desc, idea.ini, todayIso)],
          effect: [mkBlock("", myIni, todayIso)],
        },
        edit_log: [{ ini: myIni, name: myName, action: "브리프 자동 생성", at: todayIso }],
      };
    }
    await onUpdateIdea(id, { rec_by: newRecBy, recs: newRecs, status: newStatus });
    if (createdBrief) {
      await onAddBrief(createdBrief);
      showToast(`'${idea.title.slice(0, 18)}' 브리프가 생성됐어요`);
    }
  }

  async function rateIdea(id, r) {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;
    const had = (idea.myRating || 0) > 0;
    await onUpdateIdea(id, {
      my_rating: r,
      rating_sum: idea.ratingSum - (had ? idea.myRating : 0) + r,
      rating_count: idea.ratingCount + (had ? 0 : 1),
    });
  }

  async function addIdea(idea) {
    const newIdea = {
      id: "i-" + Date.now(), ...idea, recs: 0, rec_by: [], rating_sum: 0, rating_count: 0, my_rating: 0,
    };
    await onAddIdea(newIdea);
    setComposeIdea(false);
    showToast("아이디어가 등록됐어요");
  }

  function setIdeaVerdict() {}

  function ideaToChat(idea) {
    setSelIdea(null);
    sendMention(idea.ini, { kind: "idea", id: idea.id, title: idea.title, sub: `${idea.author}님의 아이디어 · ${STATUS_TXT[idea.status]}` });
  }

  // 브리프
  const mkBlockLocal = (text, by = "", at = "") => ({ id: Math.random().toString(36).slice(2), text, editedBy: by, editedAt: at });

  async function updateBriefBlock(briefId, section, blockId, text) {
    const brief = briefs.find((b) => b.id === briefId);
    if (!brief) return;
    const sections = { ...brief.sections };
    sections[section] = (sections[section] || []).map((bl) => bl.id === blockId ? { ...bl, text, editedBy: myIni, editedAt: todayIso } : bl);
    await onUpdateBrief(briefId, { sections });
  }

  async function addBriefBlock(briefId, section) {
    const brief = briefs.find((b) => b.id === briefId);
    if (!brief) return;
    const sections = { ...brief.sections };
    sections[section] = [...(sections[section] || []), mkBlockLocal("", myIni, todayIso)];
    await onUpdateBrief(briefId, { sections });
  }

  async function deleteBriefBlock(briefId, section, blockId) {
    const brief = briefs.find((b) => b.id === briefId);
    if (!brief) return;
    const sections = { ...brief.sections };
    sections[section] = (sections[section] || []).filter((bl) => bl.id !== blockId);
    await onUpdateBrief(briefId, { sections });
  }

  async function renameBrief(briefId, title) {
    await onUpdateBrief(briefId, { title });
    const brief = briefs.find((b) => b.id === briefId);
    if (brief) {
      const newColor = randomLabelColor(Object.values(labelColors));
      setLabelColors((c) => ({ ...c, [title]: newColor }));
      setBriefLabels((s) => { const ns = new Set(s); if (brief.title) ns.delete(brief.title); ns.add(title); return ns; });
    }
  }

  // 일정
  function openEvent(ev) { setSelEvent(ev); setMobileDetail(true); }
  function openComposeEvent(dateOrObj) {
    if (typeof dateOrObj === "string") setComposeEvent({ date: dateOrObj });
    else setComposeEvent(dateOrObj);
    setMobileDetail(true);
  }

  async function addEvent({ title, date, start, end, place, color }) {
    const ev = { title, date, start_time: start, end_time: end, place, color, event_type: "team", attendees: [myIni], created_by: null };
    const newEv = await onAddEvent(ev);
    setComposeEvent(null);
    if (newEv) {
      await onPushNotification({ kind: "event-added", eventId: newEv.id, title, ini: myIni, extra: `${date} ${start}` });
    }
    showToast("일정이 캘린더에 추가됐어요");
  }

  function eventToChat(ev) { sendMention(null, { kind: "event", id: ev.id, title: ev.title, sub: `${ev.date} ${ev.start}` }); }

  function openRef(ref) {
    if (ref.kind === "idea") { const idea = ideas.find((i) => i.id === ref.id); if (idea) setSelIdea(idea); }
    else if (ref.kind === "issue") { const iss = issues.find((i) => i.id === ref.id); if (iss) setSelIssue(iss); }
    else if (ref.kind === "event") { const ev = events.find((e) => e.id === ref.id); if (ev) openEvent(ev); }
  }

  // 아이디어 정렬/필터
  const sortedIdeas = useMemo(() => {
    let arr = [...ideas];
    if (ideaQ.trim()) {
      const q = ideaQ.trim().toLowerCase();
      arr = arr.filter((i) => i.title.toLowerCase().includes(q) || (i.desc || "").toLowerCase().includes(q) || (i.author || "").toLowerCase().includes(q));
    }
    if (ideaSort === "bookmark") return arr.filter((i) => bookmarks[i.id]);
    if (ideaSort === "rec") arr.sort((x, y) => y.recs - x.recs);
    return arr;
  }, [ideas, ideaSort, bookmarks, ideaQ]);

  // ARCHIVE (빈 배열 — DB에서 추후 로드)
  const ARCHIVE = [];
  const INIT_LABEL_COLORS = labelColors;

  const TEAM_TODAY = {};
  team.forEach((p) => { TEAM_TODAY[p.id] = { minutes: p.id === myIni ? myTodayMinutes : 0 }; });

  // 채팅 DM 맵 형식
  const dms = {};
  if (selDM && selDM !== null) dms[selDM] = dmChat;

  // 테마 변경 시 DB 반영
  useEffect(() => {
    if (profile?.id) onUpdateProfile({ theme });
  }, [theme]);

  return (
    <div className={`teum theme-${theme}${dark ? " dark" : ""}${glass ? " glass" : ""}`}>
      <style>{CSS}</style>

      {/* rail */}
      <nav className="rail">
        <button className="brand" title={`내 프로필 · ${working ? "활동 중" : "휴식 중"}`} onClick={() => setProfileOpen(true)}>
          <UserSilhouette ini={myIni} size={40} radius={20} title={myName} />
          <span className={`presence ${working ? "on" : "away"} brand-presence`} />
        </button>
        <button className={`railbtn${view === "home" ? " on" : ""}`} onClick={() => goView("home")}><Home /><span>홈</span></button>
        <button className={`railbtn${view === "calendar" ? " on" : ""}`} onClick={() => goView("calendar")}><CalendarIcon /><span>캘린더</span></button>
        <button className={`railbtn${view === "ideas" ? " on" : ""}`} onClick={() => goView("ideas")}><Lightbulb /><span>아이디어</span></button>
        <button className={`railbtn${view === "issues" ? " on" : ""}`} onClick={() => goView("issues")}><ListTodo /><span>이슈</span></button>
        <button className={`railbtn${view === "manage" ? " on" : ""}`} onClick={() => goView("manage")}><Users /><span>관리</span></button>
        <div style={{ flex: 1 }} />
        <button className="railbtn" onClick={cycleTheme} title="테마 변경">{dark ? <Sun /> : glass ? <Moon /> : <Globe />}<span>테마</span></button>
        <button className="railbtn" onClick={() => setCmdOpen(true)} title="명령 메뉴 (⌘K)"><Command /><span>메뉴</span></button>
        <button className="railbtn" onClick={onSignOut} title="로그아웃" style={{ color: "var(--text-3)" }}><X /><span>로그아웃</span></button>
      </nav>

      {/* panel */}
      <aside className={`panel${mobileDetail ? " hide" : ""}`}>
        {view === "manage" && <ListManage team={team} working={working} presenceOf={presenceOf} />}
        {view === "calendar" && <ListCalendar upcoming={upcoming} onEvent={(e) => { openEvent(e); }} onAdd={() => openComposeEvent(todayIso)} onPoll={() => setPollCompose(true)} />}
        {view === "issues" && <ListIssues issues={issues} cycle={cycle} onOpen={(i) => { setSelIssue(i); }} onNew={() => setComposeIssue({ status: "backlog" })} showArchive={showArchive} onToggleArchive={() => { setShowArchive((v) => !v); setMobileDetail(true); }} statusFilter={issueStatusFilter} onFilterStatus={setIssueStatusFilter} />}
        {view === "ideas" && <ListIdea ideas={ideas} sort={ideaSort} setSort={setIdeaSort} onCompose={() => setComposeIdea(true)} statusFilter={ideaStatusFilter} onFilterStatus={setIdeaStatusFilter} bookmarks={bookmarks} bookmarkCount={Object.values(bookmarks).filter(Boolean).length} ideaQ={ideaQ} setIdeaQ={setIdeaQ} />}
        {view === "home" && (
          <ListTeam team={team} working={working} selDM={selDM} onSelect={selectMember} presenceOf={presenceOf}
            notifications={notifications} unreadCount={unreadCount} notifOpen={notifOpen} setNotifOpen={setNotifOpen}
            onOpenNotif={(n) => {
              setNotifOpen(false);
              onMarkRead(n.id);
              if (n.kind === "issue-assigned") { const iss = issues.find((i) => i.id === n.issue_id); if (iss) setSelIssue(iss); }
              else if (n.kind === "event-added") { const ev = events.find((e) => e.id === n.event_id); if (ev) openEvent(ev); }
              else if (n.kind === "idea-comment") { const idea = ideas.find((i) => i.id === n.idea_id); if (idea) setSelIdea(idea); }
            }}
            onMarkAllRead={onMarkAllRead}
          />
        )}
      </aside>

      {/* main */}
      <main className={`main${mobileDetail ? " show" : ""}`}>
        {view === "home" && (
          <HomeView
            upcoming={upcoming} onEvent={openEvent}
            team={team} working={working} myTodayMinutes={myTodayMinutes} myTodayMs={myTodayMs} liveSeconds={liveSeconds} liveMs={liveMs}
            onToggleWork={toggleWork} issues={issues} ideas={sortedIdeas}
            homeLayout={homeLayout} setHomeLayout={setHomeLayout} homeEdit={homeEdit} setHomeEdit={setHomeEdit}
            onOpenIssue={setSelIssue}
            selDM={selDM} dms={dms} chat={selDM === null ? chat : (dms[selDM] || [])}
            draft={draft} setDraft={setDraft} focus={focus} setFocus={setFocus} onSend={send}
            dmDraft={dmDraft} setDmDraft={setDmDraft} dmFocus={dmFocus} setDmFocus={setDmFocus} onSendDM={sendDM}
            scrollRef={scrollRef} onRef={openRef}
            timePolls={timePolls} onVotePoll={votePollSlot}
            onCloseChat={() => setSelDM(undefined)}
            onPopout={() => setPopChat(selDM === null ? "team" : selDM)}
            notifications={notifications}
            onOpenNotif={(n) => {
              onMarkRead(n.id);
              if (n.kind === "issue-assigned") { const iss = issues.find((i) => i.id === n.issue_id); if (iss) setSelIssue(iss); }
              else if (n.kind === "event-added") { const ev = events.find((e) => e.id === n.event_id); if (ev) openEvent(ev); }
              else if (n.kind === "idea-comment") { const idea = ideas.find((i) => i.id === n.idea_id); if (idea) setSelIdea(idea); }
            }}
            onMarkAllRead={onMarkAllRead}
          />
        )}
        {view === "calendar" && (
          <CalendarView
            y={calY} m={calM} weeks={weeks} eventsByDay={eventsByDay} todayIso={todayIso}
            onPrev={() => { const nm = calM - 1; if (nm < 0) { setCalM(11); setCalY((y) => y - 1); } else setCalM(nm); }}
            onNext={() => { const nm = calM + 1; if (nm > 11) { setCalM(0); setCalY((y) => y + 1); } else setCalM(nm); }}
            onToday={() => { const now = new Date(); setCalY(now.getFullYear()); setCalM(now.getMonth()); }}
            onEvent={openEvent} onAddDate={openComposeEvent} onBack={() => setMobileDetail(false)}
            issues={issues} onOpenIssue={(iss) => setSelIssue(iss)}
          />
        )}
        {view === "manage" && (
          <ManageView team={team} onBack={() => setMobileDetail(false)} working={working} liveSeconds={liveSeconds} onToggleWork={toggleWork} presenceOf={presenceOf} />
        )}
        {view === "issues" && (
          <IssuesView issues={issues} cycle={cycle} issView={issView} setIssView={setIssView}
            onOpen={(i) => { setSelIssue(i); setMobileDetail(true); }}
            onNew={(s) => setComposeIssue({ status: s })}
            onBack={() => setMobileDetail(false)}
            highlightStatus={issueStatusFilter}
            archive={ARCHIVE} showArchive={showArchive}
            labelColors={labelColors} briefLabels={briefLabels}
          />
        )}
        {view === "ideas" && (
          <IdeaView ideas={sortedIdeas} onOpen={setSelIdea} onRec={toggleRec}
            onCompose={() => setComposeIdea(true)} onBack={() => setMobileDetail(false)}
            statusFilter={ideaStatusFilter} bookmarks={bookmarks} setBookmarks={setBookmarks} ideaQ={ideaQ}
          />
        )}
      </main>

      {/* event detail */}
      {selEvent && (<><div className="scrim" onClick={() => setSelEvent(null)} /><EventDetail ev={selEvent} onClose={() => setSelEvent(null)} onChat={eventToChat} /></>)}

      {/* idea detail */}
      {selIdea && (
        <><div className="scrim" onClick={() => setSelIdea(null)} />
          <IdeaDetail idea={selIdea} onClose={() => setSelIdea(null)} onRec={toggleRec} onRate={rateIdea} onChat={ideaToChat} onIssue={() => {}}
            briefs={briefs} onUpdateBlock={updateBriefBlock} onAddBlock={addBriefBlock} onDeleteBlock={deleteBriefBlock} onRename={renameBrief}
            onComment={({ ideaId, title, ini }) => onPushNotification({ kind: "idea-comment", ideaId, title, ini })}
          />
        </>
      )}

      {composeIdea && <IdeaCompose onClose={() => setComposeIdea(false)} onSubmit={addIdea} />}
      {composeIssue && <IssueCompose initialStatus={composeIssue.status} team={team} onClose={() => setComposeIssue(null)} onSubmit={addIssue} labelColors={labelColors} />}
      {composeEvent && <EventCompose initialDate={composeEvent.date} prefill={composeEvent.prefill} onClose={() => setComposeEvent(null)} onSubmit={addEvent} />}
      {pollCompose && <TimePollCompose todayIso={todayIso} onClose={() => setPollCompose(false)} onSubmit={createTimePoll} />}

      {selIssue && (
        <><div className="scrim" onClick={() => setSelIssue(null)} />
          <IssueDetail iss={selIssue} onClose={() => setSelIssue(null)} onStatus={setIssueStatus}
            onUpdate={(id, patch) => { onUpdateIssue(id, patch); setSelIssue((s) => s && s.id === id ? { ...s, ...patch } : s); }}
            onChat={issueToChat} onEvent={issueToEvent} labelColors={labelColors} briefLabels={briefLabels} team={team} />
        </>
      )}

      {cmdOpen && <CommandMenu commands={COMMANDS} shortcuts={shortcuts} onSetShortcut={setShortcut} onClose={() => setCmdOpen(false)} />}
      {profileOpen && (
        <ProfileModal profile={profile} working={working} myTodayMinutes={myTodayMinutes} theme={theme} onSetTheme={setTheme}
          onSave={async (p) => { await onUpdateProfile(p); setProfile({ ...profile, ...p }); setProfileOpen(false); showToast("프로필이 저장됐어요"); }}
          onClose={() => setProfileOpen(false)} />
      )}

      {popChat && (
        <FloatingChat partner={popChat === "team" ? null : team.find((p) => p.id === popChat)}
          messages={popChat === "team" ? chat : (dms[popChat] || [])}
          onSend={async (t) => { if (popChat === "team") await onSendTeam(t); else await onSendDM(t); }}
          onClose={() => setPopChat(null)} />
      )}

      {toast && <div className="toast">{toast.msg}</div>}

      <nav className="tabbar">
        {[{ v: "home", icon: <Home />, label: "홈" }, { v: "calendar", icon: <CalendarIcon />, label: "캘린더" },
          { v: "ideas", icon: <Lightbulb />, label: "아이디어" }, { v: "issues", icon: <ListTodo />, label: "이슈" },
          { v: "manage", icon: <Users />, label: "관리" }].map((t) => (
          <button key={t.v} className={`tabbtn${view === t.v ? " on" : ""}`} onClick={() => goView(t.v)}>{t.icon}<span>{t.label}</span></button>
        ))}
      </nav>
    </div>
  );
}
