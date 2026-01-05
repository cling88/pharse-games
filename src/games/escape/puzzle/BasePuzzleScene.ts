import Phaser from "phaser";
import type { GameState } from "../type";

export interface PuzzleInitData {
    gameState: GameState;
    returnRoomId: string;
    returnRoomData: {
        roomId: string;
        playerX: number;
        playerY: number;
    };
    triggerObjectId: string;
}
//@INFO abstract class : 직접 만들 수는 없고, 상속해서만 쓰는 클래스
export default abstract class BasePuzzleScene extends Phaser.Scene {
    protected gameState!: GameState;
    protected returnRoomId!: string;
    protected returnRoomData!: {roomId: string; playerX: number; playerY: number;};
    protected triggerObjectId!: string;
    protected isCompleted: boolean = false;
    protected rewardNumber: number = 0; 

    constructor(sceneKey: string) {
        super(sceneKey);
    }

    init(data: PuzzleInitData) {
        this.gameState = data.gameState;
        this.returnRoomId = data.returnRoomId;
        this.returnRoomData = data.returnRoomData;
        this.triggerObjectId = data.triggerObjectId;
        // 이미 완료된 퍼즐인지 확인
        this.isCompleted = this.gameState.clearedPuzzles.has(this.triggerObjectId);
        // 완료된 경우 보상 숫자 저장 (나중에 사용)
        if(this.gameState.puzzleReward.get(this.triggerObjectId)) {
            this.rewardNumber = this.gameState.puzzleReward.get(this.triggerObjectId)!;
        } else {
            const assignedNumbers = Array.from(this.gameState.puzzleReward.values());
            const availableNumbers = this.gameState.password.filter(
                num => !assignedNumbers.includes(num)
            );
            const randomIndex = Phaser.Math.Between(0, availableNumbers.length - 1);
            this.rewardNumber = availableNumbers[randomIndex];
            this.gameState.puzzleReward.set(this.triggerObjectId, this.rewardNumber);
        }
    }

    create() {
        const {width, height} = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);
        if(this.isCompleted) {
            this.showCompletedScreen();
        } else {
            this.setupPuzzle();
        }
        // E키로 나가기
        this.input.keyboard!.on("keydown-E", () => {
            this.returnToRoom();
        })
    }

    protected showCompletedScreen() {
        const {width, height} = this.scale;
        // 완성된 퍼즐 표시
        this.add.text(width / 2, height / 2 - 100, "퍼즐 완료", {
            fontSize: "32px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // 보상 숫자 표시 
        const numberBox = this.add.rectangle(width / 2, height / 2, 80, 80, 0x4169E1);
        const numberText = this.add.text(width / 2, height / 2, this.rewardNumber.toString(), {
            fontSize: "48px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        numberBox.setScale(0);
        numberText.setScale(0);
        // 두 번 커지는 애니메이션
        this.tweens.add({
            targets: [numberBox, numberText],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            ease: 'Back.easeOut',
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                // 애니메이션 완료 후 1.2로 유지
                numberBox.setScale(1.2);
                numberText.setScale(1.2);
            }
        });

        // 나가기 버튼
        const exitButton = this.add.text(width / 2, height / 2 + 150, "나가기", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        exitButton.setInteractive({useHandCursor: true});
        exitButton.on('pointerdown', () => {
            this.returnToRoom();
        })
    }

    protected onPuzzleSuccess() {
        // 퍼즐 성공 처리 
        this.gameState.clearedPuzzles.add(this.triggerObjectId);
        if(!this.gameState.collectedNumbers.includes(this.rewardNumber)) {
            this.gameState.collectedNumbers.push(this.rewardNumber);
        } 
        this.isCompleted = true;
        // 성공 화면 표시
        this.scene.restart(); // 씬 재시작해서 성공화면 표시
    }

    protected onPuzzleFailure() {
        // 기존 오브젝트 제거 (간단한 방법으로는 씬 재시작)
        // TODO: 실패 메시지 UI 표시
        // TODO: 재시도 버튼
        // TODO: 나가기 버튼
    }

    protected returnToRoom() {
        this.scene.start(this.returnRoomId, {
            gameState: this.gameState,
            roomId: this.returnRoomData.roomId,
            playerPosition: {
                x: this.returnRoomData.playerX,
                y: this.returnRoomData.playerY
            }
        });
    }

    protected abstract setupPuzzle(): void;
    abstract update(time?: number, delta?: number): void;
    
 }