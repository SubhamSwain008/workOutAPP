import { useNavigate } from "react-router-dom";
export default function Navbar() {
    const navigate = useNavigate();
    return (
        <nav>
            <ul>
                <li onClick={() => navigate("/home")}>Home</li>
                <li onClick={() => navigate("/profile")}>Profile</li>
                <li onClick={() => navigate("/login")}>Logout</li>
                <li onClick={() => navigate("/Volume_Load-analytics")}>Volume_Load Analytics</li>

            </ul>

        </nav>
    );
}