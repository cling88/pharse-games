


import { useNavigate } from "react-router-dom";
import GamePage from "../common/GamePage";
import TimingRhythmScene from "./TimingRhythmScene";

export default function RhythmPage() {
    const navigate = useNavigate();

    return(
        <>
            <GamePage
                scene={TimingRhythmScene}
                onExit={() => navigate("/")}
            />
        </>
    )
    
}
