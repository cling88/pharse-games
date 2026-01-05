import BasePuzzleScene from "./BasePuzzleScene";
import Phaser from "phaser";

export default class TimingPuzzleScene extends BasePuzzleScene {

    private currentStage = 1; 
    private barSpeeds = [200, 300, 400];
    private successZoneSizes=[0.3, 0.2, 0.1];
    // UI
    private bar!: Phaser.GameObjects.Rectangle;
    private successZone!: Phaser.GameObjects.Rectangle;
    private pointer!: Phaser.GameObjects.Rectangle;
    private backButton!: Phaser.GameObjects.Text;

    // 상태
    private barWidth = 0; 
    private barHeight = 60;
    private barX = 0; 
    private barY = 0; 
    private pointerSpeed = 0; 
    private pointerDirection = 1; // 포인터 방향 1=right, -1=left
    private isPointerMoving = false;
    private isWaitingInput = false;
    private successZoneLeft = 0; 
    private successZoneRight = 0; 

    constructor() {
        super("TimingPuzzleScene");
    }

    protected setupPuzzle () {
        const {width, height} = this.scale;
        this.add.text(width / 2, 50, "타이밍 퍼즐", {
            fontSize: "32px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // 초기화
        this.currentStage = 1;
        this.isPointerMoving = false;
        this.isWaitingInput = false;

        // 나가기 버튼
        this.backButton = this.add.text(width / 2, height / 2 - 50, "나가기", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({useHandCursor: true});

        this.backButton.on('pointerdown', () => {
            this.returnToRoom();
        })

        this.startStage(this.currentStage);
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if(this.isWaitingInput && !this.backButton.getBounds().contains(pointer.x, pointer.y)) {
                this.handleClick();
            }
        })
    }

    private startStage(stage: number) {
        const {width, height} = this.scale;
        // 기존 요소 제거 
        if(this.bar) this.bar.destroy();
        if(this.successZone) this.successZone.destroy();
        if(this.pointer) this.pointer.destroy();

        // 가로 바 설정
        this.barWidth = width * 0.8;
        this.barX = width / 2;
        this.barY = height / 2;

        // 가로 바 생성
        this.bar = this.add.rectangle(
            this.barX,
            this.barY,
            this.barWidth,
            this.barHeight,
            0x808080
        )
        // 성공 영역 생성
        const successZoneSize = this.barWidth * this.successZoneSizes[stage - 1];
        const maxLeft = this.barX - this.barWidth / 2;
        const maxRight = this.barX + this.barWidth / 2 - successZoneSize;
        const successZoneLeft = Phaser.Math.Between(maxLeft, maxRight);
        const successZoneCenterX = successZoneLeft + successZoneSize / 2;
        this.successZoneLeft = successZoneLeft;
        this.successZoneRight = successZoneLeft + successZoneSize;
        this.successZone = this.add.rectangle(
            successZoneCenterX,
            this.barY,
            successZoneSize,
            this.barHeight,
            0xffff00
        );
        this.successZone.setDepth(1);
        
        // 포인터 생성 
        const pointerWidth = this.barWidth * 0.05;
        const pointerX = this.barX - this.barWidth / 2; // 왼쪽 끝에서 시작
        this.pointer = this.add.rectangle(
            pointerX,
            this.barY,
            pointerWidth,
            this.barHeight,
            0xff0000
        );
        this.pointer.setDepth(2);
        // 포인터 속도 설정
        this.pointerSpeed = this.barSpeeds[stage - 1];
        // 포인터 이동 시작
        this.pointerDirection = 1; // 오른쪽에서 시작 
        this.isPointerMoving = true; 
        this.isWaitingInput = true; 
    }
    
    private handleClick() {
        if(!this.isWaitingInput || !this.isPointerMoving) return;
        // 포인터 정지
        this.isPointerMoving = false;
        this.isWaitingInput = false;
        // 포인터 위치 확인
        const pointerLeft = this.pointer.x - this.pointer.width / 2;
        const pointerRight = this.pointer.x + this.pointer.width / 2;
        // 성공 영역 안에 있는지 체크 
        // const isSuccess = (pointerLeft >= this.successZoneLeft && pointerRight <= this.successZoneRight) ||
        //                   (pointerLeft <= this.successZoneLeft && pointerRight >= this.successZoneRight) ||
        //                   (pointerLeft >= this.successZoneLeft && pointerLeft <= this.successZoneRight) ||
        //                   (pointerRight >= this.successZoneLeft && pointerRight <= this.successZoneRight);
        const isSuccess = pointerLeft  >= this.successZoneLeft && pointerRight <= this.successZoneRight;
        if(isSuccess) {
            // success
            if(this.currentStage >= 3) {
                this.onPuzzleSuccess();
            } else {
                const {width, height} = this.scale;
                const successText = this.add.text(width / 2, height / 2, "Success!", {
                    fontSize: "64px",
                    color: "#00ff00",
                    fontStyle: "bold"
                }).setOrigin(0.5);
                // next stage
                this.currentStage++;
                this.time.delayedCall(800, () => {
                    successText.destroy();
                    this.showCountdown();
                });
            }
        } else {
            // fail
            this.onPuzzleFailure();
        }
    }

    private showCountdown() {
        const {width, height} = this.scale;
        let countdown = 3;
        const countdownText = this.add.text(width / 2, height / 2, countdown.toString(), {
            fontSize: "72px",
            color: "#ffff00",
            fontStyle: "bold"
        }).setOrigin(0.5);
        const updateCountdown = () => {
            countdown--;
            if(countdown > 0) {
                countdownText.setText(countdown.toString());
                this.time.delayedCall(500, updateCountdown);
            } else {
                countdownText.setText("START");
                this.time.delayedCall(400, () => {
                    countdownText.destroy();
                    this.startStage(this.currentStage);
                })
            }
        }
        this.time.delayedCall(500, updateCountdown);
    }

    // @override
    protected onPuzzleFailure(): void {
        const {width, height} = this.scale;
        // 실패 메세지 
        this.add.text(width / 2, height / 2 - 100, "Fail!", {
            fontSize: "48px",
            color: "#ff0000",
            fontStyle: "bold"
        }).setOrigin(0.5);
        // 재시도 버튼
        const retryButton = this.add.text(width / 2-100, height / 2+100, "Retry", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({useHandCursor: true});
        retryButton.on('pointerdown', () => {
            this.scene.restart()
        });
        // 나가기 버튼
        const exitButton = this.add.text(width / 2+100, height / 2+100, "Exit", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({useHandCursor: true});
        exitButton.on('pointerdown', () => {
            this.returnToRoom();
        });
    }

    update(_time: number, delta: number) {
        if(!this.isPointerMoving || !this.pointer) return;
        // 포인터 이동
        const deltaSeconds = delta / 1000;
        const moveDistance = this.pointerSpeed * deltaSeconds * this.pointerDirection;
        this.pointer.x += moveDistance;

        // 가로바 경계 체크
        const barLeft = this.barX - this.barWidth / 2;
        const barRight = this.barX + this.barWidth / 2;
        const pointerHalfWidth = this.pointer.width / 2;
        if(this.pointer.x - pointerHalfWidth <= barLeft) {
            // 왼쪽 끝 도달
            this.pointer.x = barLeft + pointerHalfWidth;
            this.pointerDirection = 1; // 오른쪽으로 전환
        } else if(this.pointer.x + pointerHalfWidth >= barRight) {
            // 오른쪽 끝 도달
            this.pointer.x = barRight - pointerHalfWidth;
            this.pointerDirection = -1; // 왼쪽으로 전환 
        }
    }
}
