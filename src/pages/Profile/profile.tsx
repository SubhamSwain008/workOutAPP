import { useAuth } from "../../auth/AuthProvider";
import ProfileCard from "./profileCard";
import Navbar from "../../components/navbar/navbar";

export default function Profile() {
    const { user } = useAuth();

    return (
        <div>
            <Navbar />
            <h1>Profile</h1>
            <ProfileCard />
            <p>Email: {user?.email}</p>
        </div>
    );
}
