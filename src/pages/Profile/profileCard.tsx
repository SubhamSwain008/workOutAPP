import type { Profile } from "../../models/profile";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { calculateBMI, classifyBMI } from "./bmi";
import { 
    Dumbbell, Target, TrendingUp, Heart, Zap, Shield, 
    Activity, Flame, Edit2, Save, X, User, Calendar, 
    Ruler, Weight, VenusAndMars, Award, CheckCircle2
} from "lucide-react";

const FITNESS_GOALS = [
    { id: "muscle_gain", label: "Muscle Gain", icon: Dumbbell, color: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/30" },
    { id: "weight_loss", label: "Weight Loss", icon: TrendingUp, color: "text-chart-1", bg: "bg-chart-1/10", border: "border-chart-1/30" },
    { id: "cardio", label: "Cardio", icon: Heart, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
    { id: "strength", label: "Strength", icon: Shield, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
    { id: "endurance", label: "Endurance", icon: Zap, color: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2/30" },
    { id: "flexibility", label: "Flexibility", icon: Activity, color: "text-chart-4", bg: "bg-chart-4/10", border: "border-chart-4/30" },
    { id: "body_recomp", label: "Body Recomp", icon: Target, color: "text-chart-5", bg: "bg-chart-5/10", border: "border-chart-5/30" },
    { id: "athletic", label: "Athletic Performance", icon: Award, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
    { id: "general", label: "General Fitness", icon: Flame, color: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/30" },
    { id: "powerlifting", label: "Powerlifting", icon: Dumbbell, color: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2/30" },
];

const GENDER_OPTIONS = [
    { value: "male", label: "Male", icon: "♂" },
    { value: "female", label: "Female", icon: "♀" },
    { value: "other", label: "Other", icon: "⚧" },
    { value: "prefer_not_to_say", label: "Prefer not to say", icon: "—" },
];

export default function ProfileCard() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const bmi = profile?.height && profile?.weight ? calculateBMI(profile.height, profile.weight) : null;
    const bmiCategory = bmi ? classifyBMI(bmi) : null;

    const [editingField, setEditingField] = useState<
        "name" | "age" | "height" | "weight" | "gender" | "current_goal" | null
    >(null);

    const [form, setForm] = useState({
        name: "",
        age: "",
        height: "",
        weight: "",
        gender: "",
        current_goal: "",
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

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="p-4 rounded-xl bg-primary/10">
                    <Dumbbell className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <span className="text-sm text-muted-foreground">Loading profile...</span>
            </div>
        );
    }
    
    if (!profile) {
        return (
            <div className="flex justify-center items-center h-40 text-lg text-destructive">
                Unable to load profile
            </div>
        );
    }

    const selectedGoal = FITNESS_GOALS.find(g => g.id === profile.current_goal);
    const selectedGender = GENDER_OPTIONS.find(g => g.value === profile.gender);

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-[env(safe-area-inset-bottom)]">
            {/* Header */}
            <div className="mb-4 sm:mb-6 animate-[workout-fade-in_0.4s_ease-out_both]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary" strokeWidth={2} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">My Profile</h2>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground ml-[52px] sm:ml-[60px]">
                    Manage your personal information and fitness goals
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* Left Column - Personal Info */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-5">
                    {/* Personal Information Card */}
                    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden animate-[workout-scale-in_0.4s_ease-out_0.1s_both]">
                        <div className="bg-linear-to-r from-primary/15 via-primary/5 to-transparent px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50">
                            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Personal Information
                            </h3>
                        </div>
                        <div className="p-4 sm:p-6 space-y-4">
                            {/* Name */}
                            <ProfileField
                                label="Name"
                                icon={User}
                                value={profile.name ?? "—"}
                                editing={editingField === "name"}
                                onEdit={() => {
                                    setForm({ ...form, name: profile.name ?? "" });
                                    setEditingField("name");
                                }}
                                onSave={() => saveField({ name: form.name || null })}
                                onCancel={() => setEditingField(null)}
                                input={
                                    <input
                                        type="text"
                                        className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Enter your name"
                                    />
                                }
                            />

                            {/* Age */}
                            <ProfileField
                                label="Age"
                                icon={Calendar}
                                value={profile.age ? `${profile.age} years` : "—"}
                                editing={editingField === "age"}
                                onEdit={() => {
                                    setForm({ ...form, age: String(profile.age ?? "") });
                                    setEditingField("age");
                                }}
                                onSave={() => saveField({ age: form.age ? Number(form.age) : null })}
                                onCancel={() => setEditingField(null)}
                                input={
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.age}
                                        onChange={(e) => setForm({ ...form, age: e.target.value })}
                                        placeholder="Enter your age"
                                    />
                                }
                            />

                            {/* Gender */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <VenusAndMars className="w-4 h-4 text-primary" />
                                    Gender
                                </label>
                                {editingField === "gender" ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {GENDER_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setForm({ ...form, gender: option.value });
                                                        saveField({ gender: option.value });
                                                    }}
                                                    className={`
                                                        p-3 rounded-lg border-2 transition-all
                                                        ${form.gender === option.value || profile.gender === option.value
                                                            ? "bg-primary/20 border-primary text-primary"
                                                            : "bg-background border-border hover:border-primary/50"
                                                        }
                                                    `}
                                                >
                                                    <div className="text-lg mb-1">{option.icon}</div>
                                                    <div className="text-xs font-medium">{option.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="flex-1 h-9 rounded-lg bg-background border border-border text-sm font-medium hover:bg-muted/50 transition"
                                                onClick={() => setEditingField(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                                        <span className="text-sm text-foreground">
                                            {selectedGender ? `${selectedGender.icon} ${selectedGender.label}` : "Not set"}
                                        </span>
                                        <button
                                            className="p-1.5 rounded hover:bg-muted transition"
                                            onClick={() => {
                                                setForm({ ...form, gender: profile.gender ?? "" });
                                                setEditingField("gender");
                                            }}
                                        >
                                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Height & Weight Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ProfileField
                                    label="Height"
                                    icon={Ruler}
                                    value={profile.height ? `${profile.height} cm` : "—"}
                                    editing={editingField === "height"}
                                    onEdit={() => {
                                        setForm({ ...form, height: String(profile.height ?? "") });
                                        setEditingField("height");
                                    }}
                                    onSave={() => saveField({ height: form.height ? Number(form.height) : null })}
                                    onCancel={() => setEditingField(null)}
                                    input={
                                        <input
                                            type="number"
                                            min="50"
                                            max="250"
                                            className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            value={form.height}
                                            onChange={(e) => setForm({ ...form, height: e.target.value })}
                                            placeholder="cm"
                                        />
                                    }
                                />

                                <ProfileField
                                    label="Weight"
                                    icon={Weight}
                                    value={profile.weight ? `${profile.weight} kg` : "—"}
                                    editing={editingField === "weight"}
                                    onEdit={() => {
                                        setForm({ ...form, weight: String(profile.weight ?? "") });
                                        setEditingField("weight");
                                    }}
                                    onSave={() => saveField({ weight: form.weight ? Number(form.weight) : null })}
                                    onCancel={() => setEditingField(null)}
                                    input={
                                        <input
                                            type="number"
                                            min="20"
                                            max="300"
                                            step="0.1"
                                            className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            value={form.weight}
                                            onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                            placeholder="kg"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fitness Goal Selection Card */}
                    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden animate-[workout-scale-in_0.4s_ease-out_0.2s_both]">
                        <div className="bg-linear-to-r from-chart-1/15 via-chart-1/5 to-transparent px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50">
                            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                <Target className="w-5 h-5 text-chart-1" />
                                Current Fitness Goal
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">Select your primary fitness objective</p>
                        </div>
                        <div className="p-4 sm:p-6">
                            {editingField === "current_goal" ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {FITNESS_GOALS.map((goal) => {
                                            const Icon = goal.icon;
                                            const isSelected = form.current_goal === goal.id || profile.current_goal === goal.id;
                                            return (
                                                <button
                                                    key={goal.id}
                                                    onClick={() => {
                                                        setForm({ ...form, current_goal: goal.id });
                                                        saveField({ current_goal: goal.id });
                                                    }}
                                                    className={`
                                                        p-4 rounded-xl border-2 transition-all duration-200
                                                        flex flex-col items-center gap-2
                                                        ${isSelected
                                                            ? `${goal.bg} ${goal.border} border-2 scale-105 shadow-lg`
                                                            : "bg-background border-border hover:border-primary/50 hover:scale-102"
                                                        }
                                                        touch-manipulation
                                                    `}
                                                >
                                                    <Icon className={`w-6 h-6 ${isSelected ? goal.color : "text-muted-foreground"}`} strokeWidth={2} />
                                                    <span className={`text-xs font-semibold text-center ${isSelected ? goal.color : "text-muted-foreground"}`}>
                                                        {goal.label}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckCircle2 className={`w-4 h-4 ${goal.color} animate-[workout-scale-in_0.2s_ease-out_both]`} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        className="w-full h-10 rounded-lg bg-background border border-border text-sm font-medium hover:bg-muted/50 transition"
                                        onClick={() => setEditingField(null)}
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedGoal ? (
                                        <div className={`
                                            p-4 rounded-xl border-2 ${selectedGoal.bg} ${selectedGoal.border}
                                            flex items-center gap-3
                                        `}>
                                            <div className="p-2.5 rounded-lg bg-background/50">
                                                <selectedGoal.icon className={`w-6 h-6 ${selectedGoal.color}`} strokeWidth={2} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-foreground">Current Goal</p>
                                                <p className={`text-base font-bold ${selectedGoal.color}`}>{selectedGoal.label}</p>
                                            </div>
                                            <button
                                                className="p-2 rounded-lg hover:bg-background/50 transition"
                                                onClick={() => {
                                                    setForm({ ...form, current_goal: profile.current_goal ?? "" });
                                                    setEditingField("current_goal");
                                                }}
                                            >
                                                <Edit2 className="w-5 h-5 text-muted-foreground" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl border-2 border-dashed border-border bg-muted/30 text-center">
                                            <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground mb-3">No goal selected</p>
                                            <button
                                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                                                onClick={() => {
                                                    setForm({ ...form, current_goal: "" });
                                                    setEditingField("current_goal");
                                                }}
                                            >
                                                Set Your Goal
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - BMI & Stats */}
                <div className="space-y-4 sm:space-y-5">
                    {/* BMI Card */}
                    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden animate-[workout-scale-in_0.4s_ease-out_0.3s_both]">
                        <div className="bg-linear-to-r from-chart-4/15 via-chart-4/5 to-transparent px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50">
                            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                <Activity className="w-5 h-5 text-chart-4" />
                                BMI Information
                            </h3>
                        </div>
                        <div className="p-4 sm:p-6">
                            {bmi ? (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="text-4xl sm:text-5xl font-bold text-foreground mb-1">{bmi.toFixed(1)}</div>
                                        <div className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${
                                            bmiCategory === "Underweight" ? "bg-blue-500/20 text-blue-500" :
                                            bmiCategory === "Normal weight" ? "bg-chart-1/20 text-chart-1" :
                                            bmiCategory === "Overweight" ? "bg-chart-3/20 text-chart-3" :
                                            "bg-destructive/20 text-destructive"
                                        }`}>
                                            {bmiCategory}
                                        </div>
                                    </div>
                                    {/* BMI Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Underweight</span>
                                            <span>Normal</span>
                                            <span>Overweight</span>
                                        </div>
                                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-linear-to-r from-blue-500 via-chart-1 to-chart-3 transition-all duration-500"
                                                style={{ width: `${Math.min(Math.max(((bmi - 15) / 15) * 100, 0), 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                                    <p className="text-xs text-muted-foreground">Enter height & weight to calculate BMI</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    {profile.height && profile.weight && (
                        <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden animate-[workout-scale-in_0.4s_ease-out_0.4s_both]">
                            <div className="p-4 sm:p-6 space-y-3">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Quick Stats
                                </h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Height</span>
                                        <span className="font-semibold">{profile.height} cm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Weight</span>
                                        <span className="font-semibold">{profile.weight} kg</span>
                                    </div>
                                    {profile.age && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Age</span>
                                            <span className="font-semibold">{profile.age} years</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProfileField({
    label,
    icon: Icon,
    value,
    editing,
    onEdit,
    onSave,
    onCancel,
    input,
}: {
    label: string;
    icon: any;
    value: string;
    editing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    input: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                {label}
            </label>
            {editing ? (
                <div className="space-y-2">
                    {input}
                    <div className="flex gap-2">
                        <button
                            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5"
                            onClick={onSave}
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                        <button
                            className="flex-1 h-9 rounded-lg bg-background border border-border text-sm font-medium hover:bg-muted/50 transition flex items-center justify-center gap-1.5"
                            onClick={onCancel}
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                    <span className="text-sm text-foreground">{value}</span>
                    <button
                        className="p-1.5 rounded hover:bg-muted transition"
                        onClick={onEdit}
                    >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            )}
        </div>
    );
}
