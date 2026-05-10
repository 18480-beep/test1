export interface Session {
  date: string;              // "2025-04-21"
  strokeGameDone: boolean;   // ดูครบ 7 scene ไหม
  scenesViewed: number;      // ดูไปกี่ scene
  timeSpent: number;         // วินาทีที่ใช้ในเกม
  armReps: number;           // ครั้งที่ทำ arm exercise
  armScore: number;          // คะแนน 0-100
  faceScore: number;         // คะแนน face exercise 0-100
  exercisesDone: string[];   // เช่น ["smile", "purse", "open"]
}

export const PATIENT = {
  name: "สมชาย ใจดี",
  id: "PT-2025-001",
  diagnosis: "Ischemic Stroke",
  startDate: "2025-04-01",
};

export const SESSIONS: Session[] = [
  { date: "2025-04-21", strokeGameDone: true,  scenesViewed: 7, timeSpent: 420, armReps: 12, armScore: 68, faceScore: 72, exercisesDone: ["smile","purse","open"] },
  { date: "2025-04-22", strokeGameDone: true,  scenesViewed: 7, timeSpent: 380, armReps: 15, armScore: 74, faceScore: 78, exercisesDone: ["smile","purse","open","eyebrow"] },
  { date: "2025-04-23", strokeGameDone: false, scenesViewed: 4, timeSpent: 180, armReps: 10, armScore: 70, faceScore: 75, exercisesDone: ["smile","open"] },
  { date: "2025-04-24", strokeGameDone: true,  scenesViewed: 7, timeSpent: 410, armReps: 18, armScore: 80, faceScore: 82, exercisesDone: ["smile","purse","open","eyebrow","eyes"] },
  { date: "2025-04-25", strokeGameDone: true,  scenesViewed: 7, timeSpent: 395, armReps: 20, armScore: 85, faceScore: 86, exercisesDone: ["smile","purse","open","eyebrow","eyes"] },
  { date: "2025-04-26", strokeGameDone: false, scenesViewed: 2, timeSpent: 90,  armReps: 8,  armScore: 77, faceScore: 80, exercisesDone: ["smile"] },
  { date: "2025-04-27", strokeGameDone: true,  scenesViewed: 7, timeSpent: 430, armReps: 22, armScore: 88, faceScore: 90, exercisesDone: ["smile","purse","open","eyebrow","eyes"] },
];