import Phaser from "phaser";
import type { GameState } from "../type";

export default class EndingScene extends Phaser.Scene {
    private gameState!: GameState;
    constructor() {
        super("EndingScene");
    }
    init(data: {gameState?: GameState}) {
        this.gameState = data.gameState || {
            password: [],
            puzzleReward: new Map(),
            collectedNumbers: [],
            hasKey: false,
            clearedPuzzles: new Set()
        }
    }

    create() {
        const {width, height} = this.scale;
        // 배경
        this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x1a1a1a
        );

        const titleText = this.add.text(
            width / 2,
            height / 2 - 100,
            "탈출 성공!",
            {
                fontSize: "48px",
                color: "#00ff00",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        // 재시작 버튼
        const restartButton = this.add.rectangle(
            width / 2 - 100,
            height / 2 + 100,
            200,
            60,
            0x3498db,
            0.9
        ).setInteractive({useHandCursor: true});
        const restartText = this.add.text(
            width / 2 - 100,
            height / 2 + 100,
            "재시작",
            {
                fontSize: "24px",
                color: "#fff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);
        restartButton.on('pointerdown', () =>{
            this.scene.start("MainHallScene", {});
        });
        restartButton.on("pointerover", () => {
            restartButton.setFillStyle(0xc0392b, 0.9);
        });
        restartButton.on("pointerout", () => {
            restartButton.setFillStyle(0xe74c3c, 0.9);
        });   

        // 게임 종료 버튼 
        const exitButton = this.add.rectangle(
            width / 2 + 100,
            height / 2 + 100,
            200,
            60,
            0xe74c3c,
            0.9
        ).setInteractive({useHandCursor: true});
        const exitText = this.add.text(
            width / 2 + 100,
            height / 2 + 100,
            "게임종료",
            {
                fontSize: "24px",
                color: "#fff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);
        exitButton.on('pointerdown', () =>{
            // this.events.emit("exitGame");
            window.location.href = "/";
        });
        exitButton.on("pointerover", () => {
            exitButton.setFillStyle(0x2980b9, 0.9);
        });
        exitButton.on("pointerout", () => {
            exitButton.setFillStyle(0x3498db, 0.9);
        });
    }
}