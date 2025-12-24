import Phaser from "phaser";

type LaneType = "left" | "right";
type JudgeResult = "PERFECT" | "GOOD" | "MISS";

interface Note {
    sprite: Phaser.GameObjects.Rectangle;
    lane: LaneType;
}

const PERFECT_RANGE = 10;
const GOOD_RANGE = 30;

type Stage = "STAGE1" | "STAGE2" | "STAGE3";

const STAGE_CONFIG: Record<Stage, {
    noteSpeed: number;
    spawnInterval: number;
    requiredScore: number; // 다음 스테이지로 넘어가기 위한 점수
}> = {
    STAGE1: { noteSpeed: 250, spawnInterval: 1200, requiredScore: 1000 },
    STAGE2: { noteSpeed: 320, spawnInterval: 900, requiredScore: 3000 },
    STAGE3: { noteSpeed: 400, spawnInterval: 650, requiredScore: 6000 } // 게임 클리어 점수
};

const STAGES: Stage[] = ["STAGE1", "STAGE2", "STAGE3"];

export default class TimingRhythmScene extends Phaser.Scene {
    // stage
    currentStage: Stage="STAGE1";
    noteSpawnTimer!: Phaser.Time.TimerEvent;

    // lane / judge
    laneX!: { left: number; right: number };
    judgeY!: number;
    judgeArea!: Phaser.GameObjects.Rectangle;

    // notes
    notes: Note[] = [];
    noteSpeed = 260;
    spawnInterval = 1200;

    // input buttons
    leftButton!: Phaser.GameObjects.Arc;
    rightButton!: Phaser.GameObjects.Arc;

    // score
    score = 0;
    miss = 0;
    maxMiss = 5;
    scoreText!: Phaser.GameObjects.Text;
    missText!: Phaser.GameObjects.Text;
    stageText!: Phaser.GameObjects.Text;

    isGameOver = false;
    isStageTransitioning = false;

    constructor() {
        super("TimingRhythmScene");
    }

    init(data: {stage?: Stage}) {
        if(data.stage) {
            this.currentStage = data.stage;
        } else {
            this.currentStage = data.stage ?? "STAGE1";
        }
        
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor(0xf0f9ff);
        // lane positions
        this.laneX = {
            left: width * 0.3,
            right: width * 0.7,
        };

        // judge line
        this.judgeY = height - 160;

        this.drawLanes();
        this.drawJudgeArea();

        // UI
        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "24px",
            color: "#000",
        });

        this.missText = this.add.text(20, 50, "Miss: 0", {
            fontSize: "24px",
            color: "#000",
        });

        this.stageText = this.add.text(
            width / 2,
            30,
            this.currentStage,
            {
                fontSize: "28px",
                color: "#000",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        // spawn notes
        this.applyStageConfig();

        // buttons
        const buttonY = height - 60;

        this.leftButton = this.createButton(this.laneX.left, buttonY, "L");
        this.rightButton = this.createButton(this.laneX.right, buttonY, "R");

        this.leftButton.setInteractive().on("pointerdown", () => {
            if(this.isGameOver || this.isStageTransitioning) return;
            this.playButtonEffect(this.leftButton);
            this.checkHit("left");
        });

        this.rightButton.setInteractive().on("pointerdown", () => {
            if(this.isGameOver || this.isStageTransitioning) return;
            this.playButtonEffect(this.rightButton);
            this.checkHit("right");
        });

        // PC mouse support
        this.input.mouse?.disableContextMenu();
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if(this.isGameOver || this.isStageTransitioning) return;
            if (pointer.leftButtonDown()) this.checkHit("left");
            if (pointer.rightButtonDown()) this.checkHit("right");
        });
    }

    update(_: number, delta: number) {
        if (this.isGameOver || this.isStageTransitioning) return;

        const dt = delta / 1000;

        this.notes.forEach((note) => {
            note.sprite.y += this.noteSpeed * dt;

            if (note.sprite.y > this.judgeY + GOOD_RANGE) {
                this.handleMiss(note);
            }
        });

        this.notes = this.notes.filter((n) => n.sprite.active);
        this.checkStageByScore();
    }

    // =====================
    // Core Logic
    // =====================
    private handleMiss(note: Note) {
        if (!note.sprite.active) return;
        note.sprite.destroy();
        this.applyJudgeResult("MISS", this.laneX[note.lane]);
        this.addMiss();
    }

    private addMiss() {
        this.miss++;
        this.missText.setText(`Miss: ${this.miss}`);

        if (this.miss >= this.maxMiss) {
            this.triggerGameOver();
        }
    }

    // =====================
    // Visual / Effects
    // =====================

    private applyJudgeResult(result: JudgeResult, x: number) {
        this.showJudgeText(result, x, this.judgeY);
        this.flashJudgeArea(result);
    }

    private showJudgeText(result: JudgeResult, x: number, y: number) {
        const colorMap = {
            PERFECT: "#22c55e",
            GOOD: "#3b82f6",
            MISS: "#ef4444",
        };

        const text = this.add
            .text(x, y - 40, result, {
                fontSize: "32px",
                fontStyle: "bold",
                color: colorMap[result],
            })
            .setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 80,
            alpha: 0,
            duration: 600,
            onComplete: () => text.destroy(),
        });
    }

    private flashJudgeArea(result: JudgeResult) {
        const colorMap = {
            PERFECT: 0x86efac,
            GOOD: 0x93c5fd,
            MISS: 0xfca5a5,
        };

        this.judgeArea.setFillStyle(colorMap[result], 0.8);

        this.time.delayedCall(120, () => {
            this.judgeArea.setFillStyle(0xe5e7eb, 0.4);
        });
    }

    private playButtonEffect(button: Phaser.GameObjects.Arc) {
        const ripple = this.add.circle(
            button.x,
            button.y,
            button.radius,
            0xffffff,
            0.4
        );

        this.tweens.add({
            targets: ripple,
            scale: 1.6,
            alpha: 0,
            duration: 300,
            onComplete: () => ripple.destroy(),
        });
    }

    // =====================
    // Spawning / Drawing
    // =====================
    private applyStageConfig() {
        const config = STAGE_CONFIG[this.currentStage];
        this.noteSpeed = config.noteSpeed;
        this.spawnInterval = config.spawnInterval;
        this.noteSpawnTimer?.remove(false);
        this.noteSpawnTimer = this.time.addEvent({
            delay: this.spawnInterval,
            loop: true,
            callback: () => this.spawnNote()
        })
    }

    private changeStage(nextStage: Stage) {
        // 게인 일시 정지
        this.isStageTransitioning = true;
        this.noteSpawnTimer.remove(false);
        // 모든 노트 제거 
        this.notes.forEach(note => note.sprite.destroy());
        this.notes = [];

        // 스테이지 전환 메세지 표시 
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "Congrats! Tap to next Stage",
            {
                fontSize: "36px",
                color: "#000",
                align: "center"
            }
        ).setOrigin(0.5);

        // 탭하면 다음 스테이지로 전환
        this.input.once("pointerdown", () => {
            this.isStageTransitioning = false;
            if(this.stageText) this.stageText.setText(nextStage);
            this.scene.restart({stage: nextStage});
        })
    }

    private checkStageByScore() {
        if(this.isStageTransitioning) return;
        const currentConfig = STAGE_CONFIG[this.currentStage];
        const currentIndex = STAGES.indexOf(this.currentStage);
        
        // 마지막 스테이지에서 게임 클리어 체크
        if (currentIndex === STAGES.length - 1 && this.score >= currentConfig.requiredScore) {
            this.gameClear();
            return;
        }
        
        // 다음 스테이지로 넘어갈 조건 확인
        if (this.score >= currentConfig.requiredScore && currentIndex < STAGES.length - 1) {
            const nextStage = STAGES[currentIndex + 1];
            this.changeStage(nextStage);
        }
    }
    private gameClear() {
        this.isGameOver = true;
        this.noteSpawnTimer.remove(false);
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "GAME CLEAR 🎉\nTap to Restart",
            {
                fontSize: "38px",
                color: "#000",
                align: "center"
            }
        ).setOrigin(0.5);
        this.input.once("pointerdown", () => this.scene.restart());
    }

    private spawnNote() {
        // 이전 코드 - 1개만 생성
        // const lane: LaneType = Phaser.Math.Between(0, 1) === 0 ? "left" : "right";
        // const rect = this.add.rectangle(
        //     this.laneX[lane],
        //     -20,
        //     56,
        //     18,
        //     0x2563eb
        // );
        // this.notes.push({ sprite: rect, lane });

        const spawnCount = 
            this.currentStage === "STAGE1" ? 1 :
            this.currentStage === "STAGE2" ? Phaser.Math.Between(1, 2) : 
            Phaser.Math.Between(2, 3);
        for(let i = 0; i<spawnCount;i++) {
            const lane: LaneType = Phaser.Math.Between(0, 1) === 0 ? "left" : "right";
            const rect = this.add.rectangle(
                this.laneX[lane],
                -20 - i * 40,
                60,
                20,
                0x2563eb
            );
            this.notes.push({sprite: rect, lane});
        }
    }

    private checkHit(lane: LaneType) {
        const note = this.notes.find(n => n.lane === lane && Math.abs(n.sprite.y - this.judgeY) <= GOOD_RANGE);
        if(!note) {
            this.addMiss();
            this.showJudgeText("MISS", this.laneX[lane], this.judgeY);
            return;
        }
        const diff = Math.abs(note.sprite.y - this.judgeY);
        const result: JudgeResult = diff <= PERFECT_RANGE ? "PERFECT": "GOOD";
        note.sprite.destroy();

        this.score += result === "PERFECT" ? 200: 100;
        this.scoreText.setText(`Score: ${this.score}`);
        this.showJudgeText(result, this.laneX[lane], this.judgeY);
        if(!this.isStageTransitioning) this.checkStageByScore();
    }

    private drawLanes() {
        const { height } = this.scale;
        this.add.rectangle(this.laneX.left, height / 2, 4, height, 0xcbd5e1);
        this.add.rectangle(this.laneX.right, height / 2, 4, height, 0xcbd5e1);
    }

    private drawJudgeArea() {
        const { width } = this.scale;
        this.judgeArea = this.add.rectangle(
            width / 2,
            this.judgeY,
            width,
            GOOD_RANGE * 2,
            0xe5e7eb,
            0.4
        );
    }

    private createButton(x: number, y: number, label: string) {
        const circle = this.add.circle(x, y, 48, 0x94a3b8, 0.4);
        this.add.text(x, y, label, {
            fontSize: "18px",
            color: "#000",
        }).setOrigin(0.5);
        return circle;
    }

    

    // =====================
    // Game Over
    // =====================

    private triggerGameOver() {
        this.isGameOver = true;
        this.noteSpawnTimer.remove(false);

        this.add
            .text(
                this.scale.width / 2,
                this.scale.height / 2,
                "GAME OVER\nTap to Restart\nStarting from first stage",
                {
                    fontSize: "36px",
                    color: "#000",
                    align: "center",
                }
            )
            .setOrigin(0.5);

        this.input.once("pointerdown", () => {
            this.scene.restart({stage: "STAGE1"});
        });
    }
}
