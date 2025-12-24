import type { SkillTyp } from "../types";

export interface SkillData {
    id: string;
    name: string;
    type: SkillTyp;
    description: string;
    range?: number;
    levels: {
        level: number;
        effect: string;
    }[]
}

export const SKILLS: SkillData[] = [
    {
        id: 'quick_strike',
        name: '빠른 일격',
        type: 'melee',
        description: '근접 공격',
        levels: [
            { level: 1, effect: '기본 공격' },
            { level: 2, effect: '데미지 +20%' },
            { level: 3, effect: '추가 1회 타격' }
        ]
    },
    {
        id: 'throwing_dagger',
        name: '투척 단검',
        type: 'ranged',
        description: '원거리 공격',
        range: 3,
        levels: [
            { level: 1, effect: '기본' },
            { level: 2, effect: '사거리 +1' },
            { level: 3, effect: '방어 무시' }
        ]
    },
    {
        id: 'focus',
        name: '집중',
        type: 'buffer',
        description: '버프',
        levels: [
            { level: 1, effect: '다음 공격 +30%' },
            { level: 2, effect: '2턴 지속' },
            { level: 3, effect: '크리티컬 확률 증가' }
        ]
    }
]