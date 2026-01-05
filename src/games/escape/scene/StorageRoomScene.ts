import type { RoomId } from "../type";
import ExplorationScene from "./ExplorationScene";

export default class StorageRoomScene extends ExplorationScene {
    constructor() {
        super("StorageRoomScene");
    }   
    
    getRoomId():RoomId {
        return 'storageRoom';
    }

    onRoomCreate(): void {
        this.setupObjectInteraction();
    }
}