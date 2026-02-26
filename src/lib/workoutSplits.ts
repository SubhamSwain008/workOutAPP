export type Split = {
  name: string
  splitType: string[]
}



export const WORKOUT_SPLITS: Split[] = [

  // FULL BODY
  { name: 'Full Body', splitType: ['full'] },
  { name: 'Alternating Full Body A/B', splitType: ['full'] },
  { name: 'Heavy Light Full Body', splitType: ['full'] },
  { name: 'Full Body + Accessories', splitType: ['full'] },
  { name: 'Full Body + Arms', splitType: ['full','arms'] },
  { name: 'Full Body + Conditioning', splitType: ['full'] },
  { name: 'High Frequency Full Body', splitType: ['full'] },
  { name: 'Bulgarian Method', splitType: ['full'] },
  { name: 'Minimalist Full Body', splitType: ['full'] },
  { name: 'Upper Emphasis Full Body', splitType: ['full'] },
  { name: 'Lower Emphasis Full Body', splitType: ['full'] },

  // UPPER LOWER
  { name: 'Upper Lower', splitType: ['upper','lower'] },
  { name: 'ULUL', splitType: ['upper','lower'] },
  { name: 'ULR', splitType: ['upper','lower'] },
  { name: 'Upper Lower Full Body', splitType: ['upper','lower','full'] },
  { name: 'Upper Lower Arms', splitType: ['upper','lower','arms'] },
  { name: 'Upper Lower Push Pull', splitType: ['upper','lower','push','pull'] },
  { name: 'UL Weakpoint', splitType: ['upper','lower'] },
  { name: 'PHUL', splitType: ['upper','lower'] },
  { name: 'DUP Upper Lower', splitType: ['upper','lower'] },
  { name: 'Conjugate Upper Lower', splitType: ['upper','lower'] },
  { name: 'Powerbuilding UL', splitType: ['upper','lower'] },
  { name: 'Athletic UL', splitType: ['upper','lower'] },

  // PUSH PULL LEGS
  { name: 'Push Pull Legs', splitType: ['push','pull','legs'] },
  { name: 'PPL', splitType: ['push','pull','legs'] },
  { name: 'PPLPPL', splitType: ['push','pull','legs'] },
  { name: 'PPLUL', splitType: ['push','pull','legs','upper','lower'] },
  { name: 'ULPPL', splitType: ['upper','lower','push','pull','legs'] },
  { name: 'PPL + Arms', splitType: ['push','pull','legs','arms'] },
  { name: 'PPL + Shoulders', splitType: ['push','pull','legs','shoulders'] },
  { name: 'PPL Weakpoint', splitType: ['push','pull','legs'] },
  { name: 'Push Pull', splitType: ['push','pull'] },
  { name: 'Push Pull Legs Core', splitType: ['push','pull','legs','core'] },
  { name: 'Push Pull Legs Conditioning', splitType: ['push','pull','legs'] },
  { name: 'Horizontal Push Pull Vertical', splitType: ['push','pull'] },
  { name: 'Squat Push Pull Hinge', splitType: ['squat','hinge','push','pull'] },
  { name: 'Movement Pattern Split', splitType: ['squat','hinge','push','pull','carry'] },

  // BODY PART
  { name: 'Bro Split', splitType: ['chest','back','shoulders','legs','arms'] },
  { name: '5 Day Bodybuilding', splitType: ['chest','back','shoulders','legs','arms'] },
  { name: '6 Day Bodybuilding', splitType: ['chest','back','shoulders','legs','arms'] },
  { name: '7 Day Rotation', splitType: ['chest','back','shoulders','legs','arms'] },
  { name: 'Weider Split', splitType: ['chest','back','shoulders','legs','arms'] },
  { name: 'Chest Back Shoulders Arms Legs', splitType: ['chest','back','shoulders','arms','legs'] },
  { name: 'Chest Back Legs Shoulders Arms', splitType: ['chest','back','legs','shoulders','arms'] },
  { name: 'Arms Priority Split', splitType: ['chest','back','shoulders','legs','arms'] },
  { name: 'Lagging Muscle Priority', splitType: ['chest','back','shoulders','legs','arms'] },
  { name: 'High Volume Body Part', splitType: ['chest','back','shoulders','legs','arms'] },

  // ARNOLD
  { name: 'Arnold Split', splitType: ['chest','back','shoulders','arms','legs'] },
  { name: 'Arnold + Arms', splitType: ['chest','back','shoulders','arms','legs'] },
  { name: 'Arnold + Power', splitType: ['chest','back','shoulders','arms','legs'] },
  { name: '3-1-3 Split', splitType: ['chest','back','shoulders','arms','legs'] },
  { name: 'Double Split', splitType: ['chest','back','shoulders','arms','legs'] },
  { name: 'Pump Split', splitType: ['chest','back','shoulders','arms','legs'] },
  { name: 'Antagonist Split', splitType: ['push','pull'] },

  // LIFT BASED
  { name: 'Squat Bench Deadlift', splitType: ['squat','bench','deadlift'] },
  { name: 'Bench Focus', splitType: ['bench'] },
  { name: 'Deadlift Focus', splitType: ['deadlift'] },
  { name: 'Squat Everyday', splitType: ['squat'] },

  // TORSO LIMBS
  { name: 'Torso Limbs', splitType: ['torso','limbs'] },
  { name: 'Torso Limbs Arms', splitType: ['torso','limbs','arms'] },
  { name: 'Torso Limbs Weakpoint', splitType: ['torso','limbs'] },
  { name: 'Upper Torso Lower Torso', splitType: ['upper torso','lower torso'] },
  { name: 'Aesthetic Split', splitType: ['shoulders','arms'] },

  // SPECIALIZATION
  { name: 'Arm Specialization', splitType: ['arms'] },
  { name: 'Shoulder Specialization', splitType: ['shoulders'] },
  { name: 'Chest Specialization', splitType: ['chest'] },
  { name: 'Back Specialization', splitType: ['back'] },
  { name: 'Leg Specialization', splitType: ['legs'] },
  { name: 'Calf Specialization', splitType: ['calves'] },
  { name: 'Weak Point Block', splitType: ['weakpoint'] },

  // ATHLETIC / SKILL
  { name: 'Skill Strength Split', splitType: ['skill','full'] },
  { name: 'Strength Conditioning Split', splitType: ['full'] },
  { name: 'Sport Practice Split', splitType: ['sport','full'] },
  { name: 'Plyo Strength Split', splitType: ['power','full'] },
  { name: 'Mobility Strength Split', splitType: ['mobility','full'] },
  { name: 'Calisthenics Push Pull', splitType: ['push','pull'] },
  { name: 'Gymnastics Split', splitType: ['push','pull','legs'] },

  // SPECIAL PROGRAMS (mapped to body division)
  { name: 'Smolov', splitType: ['squat'] },
  { name: 'Smolov Jr', splitType: ['lift'] },
  { name: 'German Volume Training', splitType: ['bodypart'] },
  { name: 'DoggCrapp', splitType: ['bodypart'] },
  { name: 'FST-7', splitType: ['bodypart'] },
  { name: 'Mountain Dog Split', splitType: ['bodypart'] },
  { name: 'Fortitude Training', splitType: ['bodypart'] },
  { name: 'High Frequency Bodybuilding', splitType: ['bodypart'] },
  { name: 'Feeder Workouts', splitType: ['bodypart'] },

]

export default WORKOUT_SPLITS;
