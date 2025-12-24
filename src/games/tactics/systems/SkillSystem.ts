import type { Skill } from "../entities/Skill";

export class SkillSystem {
    // 스킬 사거리 계산
    getSkillRange(skill: Skill): number {
        if(skill.type === "ranged" && skill.range) {
            return skill.range + (skill.level >= 2 ? 1 : 0);
        }
        return 1; // 근접 스킬
    }
}
