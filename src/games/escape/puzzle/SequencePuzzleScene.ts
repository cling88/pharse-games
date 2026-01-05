
import BasePuzzleScene from "./BasePuzzleScene";


export default class SequencePuzzleScene extends BasePuzzleScene {

    constructor() {
        super("SequencePuzzleScene");
    }

    protected setupPuzzle () {
        const {width, height} = this.scale;
        this.add.text(width / 2, 50, "순서 추론 퍼즐", {
            fontSize: "32px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // TODO: 3×3 패널 생성
        // TODO: 패턴 점등 로직 (1초간 표시)
        // TODO: 플레이어 입력 처리
        // TODO: 성공/실패 판정

        // 임시: 나가기 버튼
        const backButton = this.add.text(width / 2, height / 2 + 150, "나가기", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({useHandCursor: true});

        backButton.on('pointerdown', () => {
            this.returnToRoom();
        })
    }

    update() {
        // TODO: 게임 로직 업데이트
    }
}
