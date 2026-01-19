import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    return (
        <nav>
            <ul>
                <li onClick={() => navigate("/home")}>Home</li>
                <li onClick={() => navigate("/profile")}>Profile</li>
                <li onClick={handleLogout}>Logout</li>
                <li onClick={() => navigate("/Volume_Load-analytics")}>Volume Load Analytics</li>
            </ul>
        </nav>
    );
}