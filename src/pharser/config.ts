import Phaser from 'phaser'

/**
 * Phaser 게임의 기본 설정을 생성하는 함수
 * scene은 PhaserGame 컴포넌트에서 props로 받아서 동적으로 설정됩니다.
 * width, height는 화면 크기에 맞게 동적으로 설정됩니다.
 */
export const getPhaserConfig = (): Omit<Phaser.Types.Core.GameConfig, 'scene'> => ({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
})