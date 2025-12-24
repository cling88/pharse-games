import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    create() {
        const {width, height} = this.scale;
        // backgorund
        this.cameras.main.setBackgroundColor(0x2c3e50);
        // Start Message
        // title
        this.add.text(
            width/2,
            height/2 - 50,
            'Find Yeong hee',
            {
                fontSize: "48px",
                color: "#fff",
                align: "center"
            }
        ).setOrigin(0.5);
        this.add.text(
            width/2,
            height/2,
            'Tap to Game Start',
            {
                fontSize: "24px",
                color: "#ecf0f1",
                align: "center"
            }
        ).setOrigin(0.5);
        // click to move Scene
        this.input.once("pointerdown", () => {
            this.scene.start('StoryScene', {stageId: 'stage1'})
        });
    }
}