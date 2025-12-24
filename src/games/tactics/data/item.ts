import type { ItemType } from "../types";


export interface ItemData {
    id: string;
    type: ItemType;
    name: string;
}

export const ITEMS: Record<ItemType, ItemData> = {
    potion: {
        id: 'potion',
        type: "potion",
        name: "회복 물약"
    },
    skill_reset: {
        id: 'skill_reset',
        type: "skill_reset",
        name: "스킬 초기화 아이템"
    }
}