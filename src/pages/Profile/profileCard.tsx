import type { Profile } from "../../models/profile";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { calculateBMI, classifyBMI } from "./bmi";


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

    if (loading) return <div className="flex justify-center items-center h-40 text-lg text-primary">Loading...</div>;
    if (!profile) return <div className="flex justify-center items-center h-40 text-lg text-destructive">Unable to load profile</div>;

    return (
        <div className="max-w-md mx-auto bg-card text-card-foreground rounded-xl shadow-lg p-6 mt-8 border border-border">
            <h2 className="text-2xl font-bold mb-4 text-primary">Profile Information</h2>

            {/* NAME */}
            <div className="mb-4">
                <label className="block text-muted-foreground font-medium mb-1">Name:</label>
                <div className="flex items-center gap-2">
                    <span className="flex-1">{profile.name ?? "—"}</span>
                    {editingField === "name" ? (
                        <>
                            <input
                                className="input input-bordered input-sm w-32"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => saveField({ name: form.name })}>Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingField(null)}>Cancel</button>
                        </>
                    ) : (
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                                setForm({ ...form, name: profile.name ?? "" });
                                setEditingField("name");
                            }}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* AGE */}
            <div className="mb-4">
                <label className="block text-muted-foreground font-medium mb-1">Age:</label>
                <div className="flex items-center gap-2">
                    <span className="flex-1">{profile.age ?? "—"}</span>
                    {editingField === "age" ? (
                        <>
                            <input
                                type="number"
                                className="input input-bordered input-sm w-20"
                                value={form.age}
                                onChange={(e) => setForm({ ...form, age: e.target.value })}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => saveField({ age: Number(form.age) })}>
                                Save
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingField(null)}>Cancel</button>
                        </>
                    ) : (
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                                setForm({ ...form, age: String(profile.age ?? "") });
                                setEditingField("age");
                            }}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* HEIGHT */}
            <div className="mb-4">
                <label className="block text-muted-foreground font-medium mb-1">Height (cm):</label>
                <div className="flex items-center gap-2">
                    <span className="flex-1">{profile.height ?? "—"}</span>
                    {editingField === "height" ? (
                        <>
                            <input
                                type="number"
                                className="input input-bordered input-sm w-20"
                                value={form.height}
                                onChange={(e) => setForm({ ...form, height: e.target.value })}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => saveField({ height: Number(form.height) })}>
                                Save
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingField(null)}>Cancel</button>
                        </>
                    ) : (
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                                setForm({ ...form, height: String(profile.height ?? "") });
                                setEditingField("height");
                            }}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* WEIGHT */}
            <div className="mb-4">
                <label className="block text-muted-foreground font-medium mb-1">Weight (kg):</label>
                <div className="flex items-center gap-2">
                    <span className="flex-1">{profile.weight ?? "—"}</span>
                    {editingField === "weight" ? (
                        <>
                            <input
                                type="number"
                                className="input input-bordered input-sm w-20"
                                value={form.weight}
                                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => saveField({ weight: Number(form.weight) })}>
                                Save
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingField(null)}>Cancel</button>
                        </>
                    ) : (
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                                setForm({ ...form, weight: String(profile.weight ?? "") });
                                setEditingField("weight");
                            }}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* BMI */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-primary mb-2">BMI Information</h3>
                {bmi ? (
                    <div className="bg-secondary rounded-lg p-3 text-foreground">
                        <p>Your BMI: <span className="font-bold">{bmi.toFixed(2)}</span></p>
                        <p>Category: <span className="font-semibold">{bmiCategory}</span></p>
                    </div>
                ) : (
                    <p className="text-muted-foreground">Please enter your height and weight to calculate BMI.</p>
                )}
            </div>
        </div>
    );
}
