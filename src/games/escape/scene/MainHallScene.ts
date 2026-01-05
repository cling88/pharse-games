import type { RoomId } from "../type";
import ExplorationScene from './ExplorationScene';

export default class MainHallScene extends ExplorationScene {
    constructor() {
        super("MainHallScene");
    }

    getRoomId(): RoomId {
        return 'mainHall';
    }

    onRoomCreate(): void {
       this.setupObjectInteraction();
    }
}