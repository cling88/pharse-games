import { useNavigate } from "react-router-dom";
import GamePage from "../common/GamePage";
import ShooterScene from "./ShooterScene";

export default function ShooterPage() {
    const navigate = useNavigate();

    return(
        <>
            <GamePage
                scene={ShooterScene}
                onExit={() => navigate("/")}
            />
        </>
    )
    
}
