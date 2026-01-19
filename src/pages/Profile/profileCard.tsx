import type { Profile } from "../../models/profile";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { calculateBMI,classifyBMI } from "./bmi";


export default function ProfileCard() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const bmi = profile?.height && profile?.weight ? calculateBMI(profile.height, profile.weight) : null;
    const bmiCategory = bmi ? classifyBMI(bmi) : null;

    const [editingField, setEditingField] = useState<
        "name" | "age" | "height" | "weight" | null
    >(null);

    const [form, setForm] = useState({
        name: "",
        age: "",
        height: "",
        weight: "",
    });

    // 🔹 Fetch OR create profile
    useEffect(() => {
        const initProfile = async () => {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // 1️⃣ Try fetching profile
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            // 2️⃣ If not exists → create empty profile
            if (!data) {
                const { data: created, error: insertError } = await supabase
                    .from("profiles")
                    .insert({ id: user.id })
                    .select()
                    .single();

                if (insertError) {
                    console.error("Profile creation failed:", insertError);
                } else {
                    setProfile(created);
                }
            } else {
                setProfile(data);
            }

            setLoading(false);
        };

        initProfile();
    }, []);

    // 🔹 UPSERT = insert if missing, update if exists
    const saveField = async (values: Partial<Profile>) => {
        if (!profile) return;

        const { data, error } = await supabase
            .from("profiles")
            .upsert(
                {
                    id: profile.id,
                    ...values,
                },
                { onConflict: "id" }
            )
            .select()
            .single();

        if (error) {
            console.error("Save failed:", error);
            return;
        }

        setProfile(data);
        setEditingField(null);
    };

    if (loading) return <p>Loading...</p>;
    if (!profile) return <p>Unable to load profile</p>;

    return (
        <div>
            <h2>Profile Information</h2>

            {/* NAME */}
            <p>Name: {profile.name ?? "—"}</p>
            {editingField === "name" ? (
                <>
                    <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <button onClick={() => saveField({ name: form.name })}>Save</button>
                    <button onClick={() => setEditingField(null)}>Cancel</button>
                </>
            ) : (
                <button
                    onClick={() => {
                        setForm({ ...form, name: profile.name ?? "" });
                        setEditingField("name");
                    }}
                >
                    Edit
                </button>
            )}

            <br />

            {/* AGE */}
            <p>Age: {profile.age ?? "—"}</p>
            {editingField === "age" ? (
                <>
                    <input
                        type="number"
                        value={form.age}
                        onChange={(e) => setForm({ ...form, age: e.target.value })}
                    />
                    <button onClick={() => saveField({ age: Number(form.age) })}>
                        Save
                    </button>
                    <button onClick={() => setEditingField(null)}>Cancel</button>
                </>
            ) : (
                <button
                    onClick={() => {
                        setForm({ ...form, age: String(profile.age ?? "") });
                        setEditingField("age");
                    }}
                >
                    Edit
                </button>
            )}

            <br />

            {/* HEIGHT */}
            <p>Height: {profile.height ?? "—"} cm</p>
            {editingField === "height" ? (
                <>
                    <input
                        type="number"
                        value={form.height}
                        onChange={(e) => setForm({ ...form, height: e.target.value })}
                    />
                    <button onClick={() => saveField({ height: Number(form.height) })}>
                        Save
                    </button>
                    <button onClick={() => setEditingField(null)}>Cancel</button>
                </>
            ) : (
                <button
                    onClick={() => {
                        setForm({ ...form, height: String(profile.height ?? "") });
                        setEditingField("height");
                    }}
                >
                    Edit
                </button>
            )}

            <br />

            {/* WEIGHT */}
            <p>Weight: {profile.weight ?? "—"} kg</p>
            {editingField === "weight" ? (
                <>
                    <input
                        type="number"
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    />
                    <button onClick={() => saveField({ weight: Number(form.weight) })}>
                        Save
                    </button>
                    <button onClick={() => setEditingField(null)}>Cancel</button>
                </>
            ) : (
                <button
                    onClick={() => {
                        setForm({ ...form, weight: String(profile.weight ?? "") });
                        setEditingField("weight");
                    }}
                >
                    Edit
                </button>
            )}

            <br />

            {/* BMI */}
            <h3>BMI Information</h3>
            {bmi ? (
                <div>
                    <p>Your BMI: {bmi.toFixed(2)}</p>
                    <p>Category: {bmiCategory}</p>
                </div>
            ) : (
                <p>Please enter your height and weight to calculate BMI.</p>
            )}
        </div>
    );
}
