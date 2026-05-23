export type TargetedMuscle = {
  key: string;          // stored in DB
  label: string;        // shown to user
  group: string;        // UI grouping
};

export const TARGETED_MUSCLES: TargetedMuscle[] = [
  /* ---------- CHEST ---------- */
  {
    key: "pectoralis_major_upper",
    label: "Upper Chest",
    group: "Chest"
  },
  {
    key: "pectoralis_major_middle",
    label: "Mid Chest",
    group: "Chest"
  },
  {
    key: "pectoralis_major_lower",
    label: "Lower Chest",
    group: "Chest"
  },
  {
    key: "pectoralis_minor",
    label: "Chest Stabilizers",
    group: "Chest"
  },

  /* ---------- SHOULDERS ---------- */
  {
    key: "shoulder_deltoid_anterior",
    label: "Front Delts",
    group: "Shoulders"
  },
  {
    key: "shoulder_deltoid_lateral",
    label: "Side Delts",
    group: "Shoulders"
  },
  {
    key: "shoulder_deltoid_posterior",
    label: "Rear Delts",
    group: "Shoulders"
  },

  /* ---------- BACK ---------- */
  {
    key: "latissimus_dorsi_upper",
    label: "Upper Lats",
    group: "Back"
  },
  {
    key: "latissimus_dorsi_lower",
    label: "Lower Lats",
    group: "Back"
  },
  {
    key: "teres_major",
    label: "Teres Major",
    group: "Back"
  },
  {
    key: "teres_minor",
    label: "Teres Minor",
    group: "Back"
  },
  {
    key: "rhomboid_major",
    label: "Rhomboids (Major)",
    group: "Back"
  },
  {
    key: "rhomboid_minor",
    label: "Rhomboids (Minor)",
    group: "Back"
  },
  {
    key: "trapezius_upper",
    label: "Upper Traps",
    group: "Back"
  },
  {
    key: "trapezius_middle",
    label: "Mid Traps",
    group: "Back"
  },
  {
    key: "trapezius_lower",
    label: "Lower Traps",
    group: "Back"
  },
  {
    key: "erector_spinae",
    label: "Lower Back (Erectors)",
    group: "Back"
  },
  {
    key: "quadratus_lumborum",
    label: "Core Stabilizers (QL)",
    group: "Back"
  },

  /* ---------- BICEPS ---------- */
  {
    key: "biceps_long_head",
    label: "Biceps (Long Head)",
    group: "Biceps"
  },
  {
    key: "biceps_short_head",
    label: "Biceps (Short Head)",
    group: "Biceps"
  },
  {
    key: "brachialis",
    label: "Brachialis",
    group: "Biceps"
  },
  {
    key: "brachioradialis",
    label: "Forearm Biceps",
    group: "Biceps"
  },

  /* ---------- TRICEPS ---------- */
  {
    key: "triceps_long_head",
    label: "Triceps (Long Head)",
    group: "Triceps"
  },
  {
    key: "triceps_lateral_head",
    label: "Triceps (Lateral Head)",
    group: "Triceps"
  },
  {
    key: "triceps_medial_head",
    label: "Triceps (Medial Head)",
    group: "Triceps"
  },

  /* ---------- QUADS ---------- */
  {
    key: "quadriceps_vastus_lateralis",
    label: "Quads (Outer)",
    group: "Quadriceps"
  },
  {
    key: "quadriceps_vastus_medialis",
    label: "Quads (Inner / Teardrop)",
    group: "Quadriceps"
  },
  {
    key: "quadriceps_vastus_intermedius",
    label: "Quads (Deep)",
    group: "Quadriceps"
  },
  {
    key: "quadriceps_rectus_femoris",
    label: "Quads (Front Thigh)",
    group: "Quadriceps"
  },

  /* ---------- HAMSTRINGS ---------- */
  {
    key: "hamstring_biceps_femoris",
    label: "Hamstrings (Outer)",
    group: "Hamstrings"
  },
  {
    key: "hamstring_semitendinosus",
    label: "Hamstrings (Inner)",
    group: "Hamstrings"
  },
  {
    key: "hamstring_semimembranosus",
    label: "Hamstrings (Deep)",
    group: "Hamstrings"
  },

  /* ---------- GLUTES ---------- */
  {
    key: "gluteus_maximus",
    label: "Glutes (Main)",
    group: "Glutes"
  },
  {
    key: "gluteus_medius",
    label: "Glutes (Side)",
    group: "Glutes"
  },
  {
    key: "gluteus_minimus",
    label: "Glutes (Stability)",
    group: "Glutes"
  },

  /* ---------- CALVES ---------- */
  {
    key: "gastrocnemius_medial",
    label: "Calves (Inner)",
    group: "Calves"
  },
  {
    key: "gastrocnemius_lateral",
    label: "Calves (Outer)",
    group: "Calves"
  },
  {
    key: "soleus",
    label: "Calves (Deep)",
    group: "Calves"
  },
  {
    key: "tibialis_anterior",
    label: "Shins",
    group: "Calves"
  },

  /* ---------- CORE / ABS ---------- */
  {
    key: "rectus_abdominis_upper",
    label: "Upper Abs",
    group: "Core"
  },
  {
    key: "rectus_abdominis_lower",
    label: "Lower Abs",
    group: "Core"
  },
  {
    key: "external_obliques",
    label: "Side Abs (External)",
    group: "Core"
  },
  {
    key: "internal_obliques",
    label: "Side Abs (Internal)",
    group: "Core"
  },
  {
    key: "transversus_abdominis",
    label: "Deep Core",
    group: "Core"
  },

  /* ---------- FOREARMS / GRIP ---------- */
  {
    key: "grip_flexors",
    label: "Grip (Flexors)",
    group: "Forearms"
  },
  {
    key: "grip_extensors",
    label: "Grip (Extensors)",
    group: "Forearms"
  },

  /* ---------- SPECIAL ---------- */
  {
    key: "full_body",
    label: "Full Body",
    group: "Special"
  },
  {
    key: "cardio_metabolic",
    label: "Cardio / Conditioning",
    group: "Special"
  }
];
