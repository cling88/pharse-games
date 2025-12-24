
export type RoomId = "mainHall" | "meetingRoom" | "storageRoom" | "serverRoom";

export interface GameState {
    collectedNumbers: number[];
    hasKey: boolean;
    clearedPuzzles: Set<RoomId>;
}

export type ObjectType = "door" | "chest" | "trigger";

export interface TriggerObject {
    id: string;
    type: ObjectType;
    x: number;
    y: number;
    roomId: RoomId;
    puzzleType?: "pattern" | "timing" | "sequence";
}

