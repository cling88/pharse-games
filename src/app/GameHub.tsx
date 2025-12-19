import {Link} from 'react-router-dom';
import {gameRoutes} from './router';

export default function GameHub() {
    return (
        <div style={{
            padding: 20,
            width: '100vw',
            height: '100vh',
            overflow: 'auto'
        }}>
            <h2>Game Hub</h2>
            <ul>
                {gameRoutes.map((game) => (
                    <li key={game.path} style={{marginBottom: "6px"}}>
                        <Link to={game.path} style={{color: "#fff"}}>
                            {game.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}