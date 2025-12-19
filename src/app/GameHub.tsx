import {Link} from 'react-router-dom';
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
                <li><Link to="/dodge" style={{color: "#fff"}}>Dodge</Link></li>
                <li><Link to="/jump" style={{color: "#fff"}}>One-Tap Jump</Link></li>
                <li><Link to="/shooter" style={{color: "#fff"}}>Minimal Shooter</Link></li>
            </ul>
        </div>
    );
}