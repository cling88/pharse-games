import { useNavigate } from "react-router-dom";
import GamePage from "../common/GamePage";
import BootScene from "./scene/BootScene";
import StoryScene from "./scene/StoryScene";
import BattleScene from "./scene/BattleScene";
import EndingScene from "./scene/EndingScene";
import LevelUpScene from "./scene/LevelUpScene";

export default function TacticsPage() {
    const navigate = useNavigate();

    return(
        <>
            <GamePage
                scene={[BootScene, StoryScene, BattleScene, LevelUpScene, EndingScene]}
                onExit={() => navigate("/")}
            />
        </>
    )
    
}
