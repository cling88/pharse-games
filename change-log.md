# 변경 로그 (Change Log)

## 게임 화면에 나가기 버튼 추가 및 포인터 이벤트 수정

### 문제점
1. 게임 화면에 나가기 버튼이 표시되지 않음
2. 게임 플레이 시 플레이어 오브젝트가 마우스/터치로 움직이지 않음
3. 라우터에서 `PhaserGame`을 직접 사용하여 `DodgePage`와 `GamePage`가 렌더링되지 않음

### 변경된 파일 및 내용

#### 1. `src/app/router.tsx`
**변경 전:**
```tsx
import PharserGame from '../pharser/PharserGame'
import DodgeScene from '../games/dodge/DodgeScene'

{
    path: '/dodge',
    element: <PharserGame scene={DodgeScene} />,
}
```

**변경 후:**
```tsx
import DodgePage from '../games/dodge/DodgePage'

{
    path: '/dodge',
    element: <DodgePage />,
}
```

**이유:** `DodgePage`를 통해 `GamePage`와 `ExitButton`이 렌더링되도록 수정

---

#### 2. `src/games/common/GamePage.tsx`
**주요 변경사항:**
- Fragment(`<>`)를 `div`로 변경하여 레이아웃 명확화
- 사용하지 않는 `useNavigate` import 제거
- 게임 컨테이너를 감싸는 래퍼 div 추가

**변경 후 구조:**
```tsx
return(
    <div style={{ 
        position: "relative", 
        width: "100vw", 
        height: "100vh",
        overflow: "hidden"
    }}>
        <PhaserGame ref={gameRef} scene={scene} />
        <ExitButton onClick={handleExitClick} />
        <ConfirmModal ... />
    </div>
)
```

---

#### 3. `src/pharser/PharserGame.tsx`
**주요 변경사항:**
- 게임 컨테이너에 `pointerEvents: "none"` 설정
- Canvas에만 `pointerEvents: "auto"` 설정하여 게임 입력은 작동하고 버튼 클릭도 가능하도록 함
- Canvas 생성 감지를 위한 MutationObserver 및 주기적 확인 로직 추가
- z-index 설정: 게임 컨테이너 `zIndex: 1`

**핵심 로직:**
```tsx
// 게임 컨테이너는 포인터 이벤트 차단
container.style.pointerEvents = 'none';

// Canvas만 포인터 이벤트 허용
canvas.style.pointerEvents = 'auto';
```

---

#### 4. `src/games/dodge/DodgeScene.ts`
**변경 전:**
```tsx
this.player.x = Phaser.Math.Clamp(
    pointer.worldX,
    25,
    this.scale.width - 25
)
```

**변경 후:**
```tsx
const x = pointer.x;
this.player.x = Phaser.Math.Clamp(
    x,
    25,
    this.scale.width - 25
);
```

**이유:** Phaser Scale.FIT 모드에서는 `pointer.x`(화면 좌표)가 `pointer.worldX`(월드 좌표)보다 더 안정적으로 작동

---

#### 5. `src/games/common/ExitButton.tsx`
**주요 변경사항:**
- z-index를 `99999`로 증가
- 스타일 개선:
  - 패딩 증가: `10px 20px`
  - 배경색: `rgba(0, 0, 0, 0.9)`
  - 테두리: `2px solid #fff`
  - 그림자 효과 추가
  - 호버 효과 추가 (마우스 오버 시 빨간색으로 변경)
- `pointerEvents: "auto"` 명시적 설정

---

#### 6. `src/games/common/ConfirmModal.tsx`
**주요 변경사항:**
- z-index를 `100000`으로 증가 (ExitButton보다 위에 표시)
- `pointerEvents: "auto"` 명시적 설정

---

### 해결된 문제
1. ✅ 게임 화면 상단 우측에 EXIT 버튼이 정상적으로 표시됨
2. ✅ 버튼 클릭 시 확인 모달이 정상적으로 표시됨
3. ✅ 게임 플레이 시 플레이어 오브젝트가 마우스/터치로 정상적으로 움직임
4. ✅ 게임 입력과 버튼 클릭이 동시에 정상 작동

### 기술적 핵심
- **포인터 이벤트 분리:** 게임 컨테이너는 `pointer-events: none`, Canvas만 `pointer-events: auto`로 설정하여 게임 입력과 UI 클릭을 분리
- **z-index 계층 구조:** 게임(1) < ExitButton(99999) < ConfirmModal(100000)
- **Canvas 생성 감지:** MutationObserver와 주기적 확인을 통해 동적으로 생성되는 Canvas에 포인터 이벤트 설정

---

## 추가 수정 - 1

### 개선 사항
1. Phaser 설정 중앙화 및 범용화
2. 게임 해상도를 화면 크기에 맞게 동적 설정

### 변경된 파일 및 내용

#### 1. `src/pharser/config.ts`
**변경 전:**
```tsx
import Phaser from 'phaser'
import DodgeScene from '../games/dodge/DodgeScene'

export const phaserConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
    backgroundColor: '#000',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [DodgeScene],  // 특정 Scene에 하드코딩됨
}
```

**변경 후:**
```tsx
import Phaser from 'phaser'

/**
 * Phaser 게임의 기본 설정을 생성하는 함수
 * scene은 PhaserGame 컴포넌트에서 props로 받아서 동적으로 설정됩니다.
 * width, height는 화면 크기에 맞게 동적으로 설정됩니다.
 */
export const getPhaserConfig = (): Omit<Phaser.Types.Core.GameConfig, 'scene'> => ({
    type: Phaser.AUTO,
    width: window.innerWidth,      // 화면 너비에 맞게 동적 설정
    height: window.innerHeight,    // 화면 높이에 맞게 동적 설정
    backgroundColor: '#000',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
})
```

**주요 변경사항:**
- `phaserConfig` 상수를 `getPhaserConfig()` 함수로 변경
- `scene` 속성 제거 (동적으로 주입되도록)
- `DodgeScene` import 제거 (범용 설정으로 변경)
- `width`, `height`를 고정값(360, 640)에서 `window.innerWidth`, `window.innerHeight`로 변경
- 타입을 `Omit<Phaser.Types.Core.GameConfig, 'scene'>`로 변경하여 scene 제외

**이유:**
- 설정 중앙화: 게임 설정을 한 곳에서 관리
- 범용성: 어떤 Scene이든 사용 가능하도록 개선
- 반응형: 화면 크기에 맞게 게임 해상도 자동 조절

---

#### 2. `src/pharser/PharserGame.tsx`
**변경 전:**
```tsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Phaser from 'phaser';

// ... 중략 ...

gameRef.current = new Phaser.Game({
    type: Phaser.AUTO,
    width: 360,              // 하드코딩된 고정값
    height: 640,             // 하드코딩된 고정값
    backgroundColor: '#000',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [scene],
});
```

**변경 후:**
```tsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Phaser from 'phaser';
import { getPhaserConfig } from './config';

// ... 중략 ...

// config.ts의 기본 설정을 사용하고, scene은 props로 받은 값 사용
// width, height는 화면 크기에 맞게 동적으로 설정됨
gameRef.current = new Phaser.Game({
    ...getPhaserConfig(),
    scene: [scene],
});
```

**주요 변경사항:**
- `getPhaserConfig` import 추가
- 하드코딩된 설정 제거, `getPhaserConfig()` 사용
- 설정 중복 제거

**이유:**
- 코드 중복 제거: 설정을 한 곳에서 관리
- 유지보수성 향상: 설정 변경 시 `config.ts`만 수정하면 됨
- 일관성: 모든 게임이 동일한 기본 설정 사용

---

### 개선 효과
1. ✅ **설정 중앙화**: 게임 설정을 `config.ts`에서 일원화하여 관리
2. ✅ **범용성 향상**: `PhaserGame` 컴포넌트가 어떤 Scene이든 받을 수 있도록 개선
3. ✅ **반응형 지원**: 화면 크기에 맞게 게임 해상도가 자동으로 설정됨
4. ✅ **유지보수성 향상**: 설정 변경 시 한 곳만 수정하면 됨
5. ✅ **코드 중복 제거**: 하드코딩된 설정 제거

### 기술적 핵심
- **동적 해상도**: `window.innerWidth/innerHeight`를 사용하여 화면 크기에 맞게 게임 해상도 설정
- **설정 함수화**: 상수 대신 함수로 변경하여 매번 최신 화면 크기 사용
- **타입 안전성**: `Omit<Phaser.Types.Core.GameConfig, 'scene'>`로 scene을 제외한 타입 정의

