import {Link} from 'react-router-dom';
export default function GameHub() {
    return (
        <div style={{padding: 20}}>
            <h2>Game Hub</h2>
            <ul>
                <li><Link to="/dodge">Dodge</Link></li>
                <li><Link to="/jump">One-Tap Jump</Link></li>
                <li><Link to="/shooter">Minimal Shooter</Link></li>
            </ul>
        </div>
    );
}