import Phaser from "phaser";
import type { EndingType } from "../types";
import { ENDINGS } from "../data/endings";

export default class EndingScene extends Phaser.Scene {
    private endingType!: EndingType;

    constructor() {
        super("EndingScene");
    }

    init(data: {endingType: EndingType}) {
        this.endingType = data.endingType || 'neutral';
    }

    create() {
        const {width, height} = this.scale;
        // 배경 (엔딩 타입에 따라 색상 변경)
        const bgColors: Record<EndingType, number>={
            happy: 0x2ecc71,  
            neutral: 0x95a5a6,
            bad: 0xe74c3c     
        }
        this.cameras.main.setBackgroundColor(bgColors[this.endingType]);

        const endings = ENDINGS[this.endingType];
        this.add.text(
            width/2,
            height/2,
            endings.text,
            {
                fontSize: "32px",
                color: "#fff",
                align: "center",
                wordWrap: { width: width - 100 }
            }
        ).setOrigin(0.5);

        // 재시작 메세지
        this.add.text(
            width/2,
            height/2 + 150,
            "Tap to Restart",
            {
                fontSize: "20px",
                color: "#ecf0f1",
                align: "center"
            }
        ).setOrigin(0.5);

        this.input.once("pointerdown", () => {
            this.scene.start("BootScene");
        })
    }
}