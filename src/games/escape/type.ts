
export type RoomId = "mainHall" | "meetingRoom" | "storageRoom" | "serverRoom";

export interface GameState {
    password: number[];
    puzzleReward: Map<string, number>;
    collectedNumbers: number[];
    hasKey: boolean;
    clearedPuzzles: Set<string>;
}

export type ObjectType = "door" | "chest" | "trigger";

export interface TriggerObject {
    id: string;
    type: ObjectType;
    x: number;
    y: number;
    roomId: RoomId;
    puzzleType?: "pattern" | "timing" | "sequence"; // trigger 타입일때만 사용
    connectedRoomId?: RoomId; // door 타입일때 연결된 방 id 
}

