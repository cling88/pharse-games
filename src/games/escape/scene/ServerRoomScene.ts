import ExplorationScene from "./ExplorationScene";
import type { RoomId } from "../type";

export default class ServerRoomScene extends ExplorationScene {
    constructor() {
        super("ServerRoomScene");
    }   

    getRoomId(): RoomId {
        return 'serverRoom';
    }

    onRoomCreate(): void {
        this.setupObjectInteraction();
    }
}