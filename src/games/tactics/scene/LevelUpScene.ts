import Phaser from "phaser";
import { Player } from "../entities/Player";
import { SKILLS } from "../data/skill";
import { Skill } from "../entities/Skill";
import type { StageId } from "../types";

export default class LevelUpScene extends Phaser.Scene {
    private player!: Player;
    private stageId!: StageId;
    private skillButtons: Phaser.GameObjects.Rectangle[] = [];
    private skillTexts: Phaser.GameObjects.Text[] = [];

    constructor() {
        super("LevelUpScene");
    }

    init(data: {player: Player; stageId: StageId}) {
        this.player = data.player;
        this.stageId = data.stageId;
    }
    create() {
        const {width, height} = this.scale;
        this.cameras.main.setBackgroundColor(0x2c3e50);
        // 레벨업 메세지
        this.add.text(
            width/2,
            height/2 - 150,
            `Level Up! Lv.${this.player.level}`,
            {
                fontSize: "48px",
                color: "#f39c12",
                align: "center"
            }
        ).setOrigin(0.5);

        // 스킬선택 안내
        this.add.text(
            width / 2,
            height / 2 - 100,
            "강화할 스킬을 선택하세요",
            {
                fontSize: "24px",
                color: "#fff",
                align: "center"
            }
        ).setOrigin(0.5);
        this.showSkillButtons()
    }

    showSkillButtons() {
        const {width, height} = this.scale;
        const buttonY = height / 2 + 80;
        const buttonWidth = 200;
        const buttonHeight = 60;
        const spacing = 20;
        const startX = width / 2 - ((this.player.skills.length - 1) * (buttonWidth + spacing)) / 2;
        this.player.skills.forEach((skill, index) => {
            const buttonX = startX + index * (buttonWidth + spacing);
            const skillData = SKILLS.find(s => s.id === skill.id);
            if(!skillData) return;
            const canLevelUp = skill.level < 3;
            const buttonColor = canLevelUp ? 0x3498db : 0x7f8c8d;
            const button = this.add.rectangle(
                buttonX,
                buttonY,
                buttonWidth,
                buttonHeight,
                buttonColor,
                0.8
            ).setInteractive({useHandCursor: canLevelUp});
            // 스킬이름
            const nameText = this.add.text(
                buttonX,
                buttonY - 15,
                skill.name,
                {
                    fontSize: "20px",
                    color: "#fff",
                    align: "center"
                }
            ).setOrigin(0.5);

            // 현재 레벨
            const levelText = this.add.text(
                buttonX,
                buttonY + 5,
                `Lv.${skill.level} → Lv.${skill.level + 1}`,
                {
                    fontSize: "16px",
                    color: canLevelUp ? "#ffd700" : "#ccc",
                    align: "center"
                }
            ).setOrigin(0.5);
            // 다음 레벨 효과 설명
            const nextLevelData = skillData.levels.find(l => l.level === skill.level + 1);
            const effectText = this.add.text(
                buttonX,
                buttonY + 25,
                nextLevelData?.effect || "MAX",
                {
                    fontSize: "12px",
                    color: "#fff",
                    align: "center"
                }
            ).setOrigin(0.5);

            if(canLevelUp) {
                button.on("pointerdown", () => {
                    this.selectSkill(skill);        
                });
                button.on('pointerover', () => {
                    button.setFillStyle(0x2980b9, 0.9);
                });

                button.on('pointerout', () => {
                    button.setFillStyle(0x3498db, 0.8);
                });
            }

            this.skillButtons.push(button);
            this.skillTexts.push(nameText, levelText, effectText);
        });
    }

    selectSkill(skill: Skill) {
        skill.levelUp();
        this.time.delayedCall(500, () => {
            this.scene.start('StoryScene', {
                stageId: this.stageId,
                player: this.player
            })
        })
    }
}