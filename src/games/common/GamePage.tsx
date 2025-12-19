import { useRef, useState } from "react";
import PhaserGame, {type PhaserGameHandle} from "../../pharser/PharserGame";
import ExitButton from "./ExitButton";
import ConfirmModal from "./ConfirmModal";


interface Props {
    scene: Phaser.Types.Scenes.SettingsConfig | Phaser.Scene | Function;
    onExit: () => void; 
}

export default function GamePage({
    scene,
    onExit
}: Props) {

    const gameRef = useRef<PhaserGameHandle>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleExitClick = () => {
        gameRef.current?.pause();
        setShowConfirm(true);
    }
    const handleCancel = () => {
        setShowConfirm(false);
        gameRef.current?.resume();
    }
    const handleConfirm = () => {
        onExit();
    }

    return(
        <div style={{ 
            position: "relative", 
            width: "100vw", 
            height: "100vh",
            overflow: "hidden"
        }}>
            <PhaserGame ref={gameRef} scene={scene} />
            <ExitButton onClick={handleExitClick} />
            <ConfirmModal
                open={showConfirm}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
            />
        </div>
    )

}