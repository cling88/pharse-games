import Phaser from "phaser";
import type { StageId } from "../types";
import { DIALOGUES } from "../data/dialogue";
import { Player } from "../entities/Player";

export default class StoryScene extends Phaser.Scene {
    private stageId!: StageId;
    private currentDialogueIndex = 0; 
    private dialogues: typeof DIALOGUES[0]['dialogues'] = [];
    private dialogueText!: Phaser.GameObjects.Text;
    private speakerText!: Phaser.GameObjects.Text;
    private player?: Player;

    constructor() {
        super("StoryScene");
    }

    init(data: {stageId: StageId, player?: Player}) {
        this.stageId = data.stageId || 'stage1';
        this.player = data.player;
    }

    create() {
        const {width, height} = this.scale;
        this.cameras.main.setBackgroundColor(0x34495e);

        // 대화 인덱스 초기화
        this.currentDialogueIndex = 0;

        // 현재 스테이지의 대화 가져오기
        const stageDialogue = DIALOGUES.find(d => d.stageId === this.stageId);
        if(stageDialogue) {
            this.dialogues = stageDialogue.dialogues;
        } else {
            // 대화가 없으면 빈 배열로 설정
            this.dialogues = [];
        }

        // 화자 텍스트 (upper)
        this.speakerText = this.add.text(
            width/2,
            height/2 - 100,
            "",
            {
                fontSize: "28px",
                color: "#f39c12",
                align: "center"
            }
        ).setOrigin(0.5);

        // 대화 텍스트 (middle)
        this.dialogueText = this.add.text(
            width/2,
            height/2,
            "",
            {
                fontSize: "24px",
                color: "#fff",
                align: "center",
                wordWrap: {width: width - 100}
            }
        ).setOrigin(0.5);

        this.showNextDialogue();
        this.input.once("pointerdown", () => {
            this.showNextDialogue();
        })
    }

    showNextDialogue() {
        if(this.currentDialogueIndex >= this.dialogues.length) {
            // 대화가 끝나면 전투씬으로 이동
            this.scene.start("BattleScene", {stageId: this.stageId, player: this.player});
            return;
        }
        const dialogue = this.dialogues[this.currentDialogueIndex];
        this.speakerText.setText(dialogue.speaker);
        this.dialogueText.setText(dialogue.text);
        this.currentDialogueIndex++;
        // 다음 클릭을 위해 이벤트 재등록
        this.input.once("pointerdown", () => {
            this.showNextDialogue();
        })

    }
}