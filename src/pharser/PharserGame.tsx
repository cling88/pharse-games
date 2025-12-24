import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Phaser from 'phaser';
import { getPhaserConfig } from './config';

interface Props {
    scene: Phaser.Types.Scenes.SettingsConfig | Phaser.Scene | Function | Array<Phaser.Types.Scenes.SettingsConfig | Phaser.Scene | Function>;
}

export type PhaserGameHandle = {
    pause: () => void;
    resume: () => void;
}

const PhaserGame = forwardRef<PhaserGameHandle, Props>(({scene}, ref) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    useEffect(() => {
        if(!gameRef.current) {
            const container = document.getElementById('game-container');
            if (container) {
                container.style.pointerEvents = 'none';
            }
            
            // config.ts의 기본 설정을 사용하고, scene은 props로 받은 값 사용
            // width, height는 화면 크기에 맞게 동적으로 설정됨
            gameRef.current = new Phaser.Game({
                ...getPhaserConfig(),
                scene: Array.isArray(scene) ? scene : [scene],
            });
            
            // Canvas가 생성될 때까지 대기하고 포인터 이벤트 설정
            const setupCanvasPointerEvents = () => {
                const container = document.getElementById('game-container');
                if (container) {
                    const canvas = container.querySelector('canvas');
                    if (canvas) {
                        canvas.style.pointerEvents = 'auto';
                        // 추가: canvas에 직접 이벤트 리스너 추가하여 확인
                        canvas.style.cursor = 'default';
                        return true;
                    }
                }
                return false;
            };
            
            // 게임이 시작된 후 여러 번 시도
            const trySetup = () => {
                if (setupCanvasPointerEvents()) {
                    return true;
                }
                return false;
            };
            
            // 즉시 시도
            trySetup();
            
            // MutationObserver로 canvas 생성 감지
            const observer = new MutationObserver(() => {
                trySetup();
            });
            
            if (container) {
                observer.observe(container, {
                    childList: true,
                    subtree: true,
                });
            }
            
            // 폴백: 주기적으로 확인
            const interval = setInterval(() => {
                if (trySetup()) {
                    clearInterval(interval);
                    observer.disconnect();
                }
            }, 50);
            
            // 3초 후 정리
            setTimeout(() => {
                clearInterval(interval);
                observer.disconnect();
            }, 3000);
        }
    
        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        }
    }, [scene]);

    useImperativeHandle(ref, () => ({
        pause() {
            if(!gameRef.current) return;
            const currentScene = gameRef.current.scene.getAt(0);
            currentScene?.scene.pause();
        },
        resume() {
            if(!gameRef.current) return;
            const currentScene = gameRef.current.scene.getAt(0);
            currentScene?.scene.resume();
        }
    }))

    return (
        <div
            id="game-container"
            style={{
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
            pointerEvents: "none",
            }}
        />
    )
});

export default PhaserGame;

