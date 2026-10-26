/* ================================================================
   Tazkiyah: configuration
   Edit this file to change classes, the term end date, or the plan.
   ================================================================ */
window.TZ_CONFIG = {
  appName: 'Tazkiyah',
  ownerName: 'Danial',
  tagline: 'He has succeeded who purifies it. (Ash-Shams 91:9)',

  // Weight plan (from the 195 lb dumbbell plan)
  planStart: '2026-10-21',
  startWeight: 221.4,
  goalWeight: 195,
  goalDate: '2027-03-18',
  techniqueWeeks: 2, // weeks 1-2: only 2 working sets per exercise

  // Default location for prayer times (Scarborough, ON)
  location: { lat: 43.7764, lng: -79.2318, label: 'Scarborough, ON' },

  // Fall 2026 timetable. day: 0=Sun ... 6=Sat
  termEnd: '2026-12-04',
  classes: [
    { id: 'mon-es-lec', day: 1, course: 'Embedded Systems', kind: 'Lecture', room: 'SIR2060', start: '08:10', end: '09:30' },
    { id: 'tue-dl-lec', day: 2, course: 'Deep Learning Arch and Alg', kind: 'Lecture', room: 'SCI1120', start: '08:10', end: '09:30' },
    { id: 'tue-ds-lec', day: 2, course: 'Distributed Systems', kind: 'Lecture', room: 'SCI1120', start: '15:40', end: '17:00' },
    { id: 'wed-es-lec', day: 3, course: 'Embedded Systems', kind: 'Lecture', room: 'PAV1501', start: '08:10', end: '09:30' },
    { id: 'thu-es-lab', day: 4, course: 'Embedded Systems', kind: 'Lab', room: 'SIR2010', start: '11:10', end: '14:00' },
    { id: 'thu-ds-lec', day: 4, course: 'Distributed Systems', kind: 'Lecture', room: 'SCI1120', start: '15:40', end: '17:00' },
    { id: 'thu-ds-lab', day: 4, course: 'Distributed Systems', kind: 'Lab', room: 'SIR2010', start: '17:10', end: '20:00' },
    { id: 'fri-dl-lec', day: 5, course: 'Deep Learning Arch and Alg', kind: 'Lecture', room: 'SHA133', start: '08:10', end: '09:30' },
    { id: 'fri-cap-lab', day: 5, course: 'Capstone Systems Design I', kind: 'Lab', room: 'Synchronous', start: '14:10', end: '17:00' }
  ],

  // Weekly training schedule
  schedule: { 0: 'rest', 1: 'upperA', 2: 'lowerA', 3: 'walkWed', 4: 'upperB', 5: 'lowerB', 6: 'walkSat' },

  sessions: {
    upperA: {
      name: 'Upper A', type: 'lift', focus: 'Pressing, rowing, shoulder width', time: '50-65 min',
      exercises: [
        { id: 'ua1', name: 'DB floor press', sets: 4, reps: '6-10', rest: '90-120 s', target: 'Chest + triceps', cue: 'Lie on the floor, knees bent, elbows 30-45° from your ribs. Press straight up; lower until upper arms touch the floor. Do not bounce.' },
        { id: 'ua2', name: 'One-arm DB row', sets: 4, reps: '8-12 / side', rest: '90 s', target: 'Lats + mid-back', cue: 'Hinge with a flat back, free hand on your thigh. Pull your elbow toward your rear pocket. Do not twist.' },
        { id: 'ua3', name: 'Standing DB overhead press', sets: 3, reps: '6-10', rest: '90 s', target: 'Shoulders', cue: 'Stand tall, brace abs and glutes, press up without leaning back. Use a pain-free range if needed.' },
        { id: 'ua4', name: 'Push-up', sets: 3, reps: '6-15', rest: '75 s', target: 'Chest + triceps', bodyweight: true, cue: 'Body in one line, chest between hands, push the floor away. Knees or a counter for an easier version.' },
        { id: 'ua5', name: 'DB lateral raise', sets: 3, reps: '12-20', rest: '45-60 s', target: 'Side delts', cue: 'Lead with upper arms, raise to shoulder height, lower slowly. Light enough to avoid swinging.' },
        { id: 'ua6', name: 'Alternating DB curl', sets: 2, reps: '10-15', rest: '60 s', target: 'Biceps', cue: 'Elbows still. Control the lowering instead of throwing the weight.' },
        { id: 'ua7', name: 'Single-DB overhead triceps extension', sets: 2, reps: '10-15', rest: '60 s', target: 'Triceps', cue: 'Elbows reasonably still, control the way down.' }
      ]
    },
    lowerA: {
      name: 'Lower A + abs', type: 'lift', focus: 'Quads, hamstrings, core', time: '45-60 min',
      exercises: [
        { id: 'la1', name: 'Goblet squat', sets: 4, reps: '8-12', rest: '90-120 s', target: 'Quads + glutes', cue: 'One dumbbell at chest. Sit down between hips, whole feet planted; stand by pushing through midfoot.' },
        { id: 'la2', name: 'DB Romanian deadlift', sets: 4, reps: '8-12', rest: '90-120 s', target: 'Hamstrings + glutes', cue: 'Soft knees, send hips back until hamstrings stretch, then stand tall. Dumbbells close to legs.' },
        { id: 'la3', name: 'DB reverse lunge', sets: 3, reps: '8-12 / leg', rest: '75-90 s', target: 'Quads + glutes', cue: 'Step back, lower under control, push through the front leg. Hold a wall if needed.' },
        { id: 'la4', name: 'DB standing calf raise', sets: 3, reps: '12-20', rest: '45-60 s', target: 'Calves', cue: 'Rise high on toes, pause at the top, lower slowly. No bouncing.' },
        { id: 'la5', name: 'Reverse crunch', sets: 3, reps: '10-15', rest: '45 s', target: 'Abs', bodyweight: true, cue: 'Curl the pelvis toward the ribs. Move the pelvis, do not throw the legs.' },
        { id: 'la6', name: 'Side plank', sets: 3, reps: '20-45 sec / side', rest: '45 s', target: 'Obliques', bodyweight: true, timed: true, cue: 'Elbow under shoulder, hips up, straight line from shoulder to ankle.' }
      ]
    },
    upperB: {
      name: 'Upper B', type: 'lift', focus: 'Chest, lats, rear delts, arms', time: '50-65 min',
      exercises: [
        { id: 'ub1', name: 'One-arm DB row (elbow toward hip)', sets: 4, reps: '10-15 / side', rest: '90 s', target: 'Lats', cue: 'Elbow close to your body, pull toward your hip. Drive the upper arm back.' },
        { id: 'ub2', name: 'Neutral-grip DB floor press', sets: 3, reps: '8-12', rest: '90 s', target: 'Chest + triceps', cue: 'Palms face each other. Lower until upper arms touch the floor, press back up.' },
        { id: 'ub3', name: 'Bent-over rear-delt fly', sets: 3, reps: '12-20', rest: '60 s', target: 'Rear delts', cue: 'Hinge, flat back, slight elbow bend, open arms out. Light weight, no momentum.' },
        { id: 'ub4', name: 'Close-grip push-up', sets: 2, reps: '6-15', rest: '75 s', target: 'Chest + triceps', bodyweight: true, cue: 'Hands a little narrower, elbows close. Knees if you cannot do six clean reps.' },
        { id: 'ub5', name: 'DB lateral raise', sets: 3, reps: '12-20', rest: '45-60 s', target: 'Side delts', cue: 'Control both directions, stop at shoulder height.' },
        { id: 'ub6', name: 'DB hammer curl', sets: 3, reps: '10-15', rest: '60 s', target: 'Biceps + forearms', cue: 'Palms face inward, upper arms steady.' },
        { id: 'ub7', name: 'Lying DB triceps extension, on floor', sets: 2, reps: '10-15', rest: '60 s', target: 'Triceps', cue: 'Elbows pointed up, lower weights toward your head, straighten without flaring.' }
      ]
    },
    lowerB: {
      name: 'Lower B + abs', type: 'lift', focus: 'Single-leg strength, glutes, core', time: '45-60 min',
      exercises: [
        { id: 'lb1', name: 'DB stationary split squat', sets: 4, reps: '8-12 / leg', rest: '90 s', target: 'Legs + glutes', cue: 'One foot forward, one back; descend vertically, front foot flat, torso upright.' },
        { id: 'lb2', name: 'DB sumo squat', sets: 3, reps: '10-15', rest: '90 s', target: 'Quads + adductors', cue: 'Feet wide, toes slightly out, one heavy dumbbell between thighs, neutral spine.' },
        { id: 'lb3', name: 'Kickstand DB Romanian deadlift', sets: 3, reps: '10-12 / leg', rest: '90 s', target: 'Hamstrings + glutes', cue: 'Most weight on the front leg, rear foot for balance. Hinge and feel the front hamstring.' },
        { id: 'lb4', name: 'DB glute bridge on floor', sets: 3, reps: '12-20', rest: '60-75 s', target: 'Glutes', cue: 'Face up, knees bent, dumbbell across hips on a towel. Drive hips up and squeeze.' },
        { id: 'lb5', name: 'Single-leg calf raise, DB in hand', sets: 3, reps: '12-20 / leg', rest: '60 s', target: 'Calves', cue: 'Dumbbell in one hand, touch a wall with the other. Full controlled range.' },
        { id: 'lb6', name: 'Dead bug', sets: 3, reps: '8-12 / side', rest: '45 s', target: 'Core control', bodyweight: true, cue: 'Low back gently on the floor. Reach opposite arm and leg without arching.' },
        { id: 'lb7', name: 'Front plank', sets: 3, reps: '30-60 sec', rest: '45 s', target: 'Core', bodyweight: true, timed: true, cue: 'Tighten abs and glutes; stop when you cannot hold a straight line.' }
      ]
    },
    walkWed: { name: 'Walk + recovery', type: 'walk', focus: 'Brisk walk 25-40 min, easy mobility', time: '25-40 min', minutes: 25 },
    walkSat: {
      name: 'Brisk walk + optional core', type: 'walk', focus: 'Brisk walk 30-45 min, optional 8-min abs', time: '30-45 min', minutes: 30,
      optional: [
        { id: 'sc1', name: 'Reverse crunch', reps: '12-15' },
        { id: 'sc2', name: 'Dead bug', reps: '8-10 / side' },
        { id: 'sc3', name: 'Front plank', reps: '30-45 sec' }
      ]
    },
    rest: { name: 'Rest day', type: 'rest', focus: 'Meal prep, sleep, recovery', time: '' }
  },

  roadmap: [
    { from: '2026-10-21', to: '2026-11-03', name: 'Weeks 1-2: technique', text: 'Two sets per exercise, slow reps, build consistency.' },
    { from: '2026-11-04', to: '2026-12-15', name: 'Weeks 3-8: foundation', text: 'Full sets, add reps most weeks, walk consistently.' },
    { from: '2026-12-16', to: '2027-01-26', name: 'Weeks 9-14: building', text: 'Push progressive overload on presses, rows and split squats.' },
    { from: '2027-01-27', to: '2027-03-17', name: 'Weeks 15-21: refine', text: 'Hold strength as weight drops; recovery, walking, form.' },
    { from: '2027-03-18', to: '2027-03-31', name: 'Check-in', text: 'Compare photos, strength, waist and 7-day average with your start.' }
  ],

  // Job search shortcuts built from your resume
  jobSearches: [
    'Junior Software Developer',
    'Full Stack Developer',
    'Web Developer',
    'React Developer',
    '.NET Developer',
    'WordPress Developer',
    'Software Engineer New Grad'
  ]
};
