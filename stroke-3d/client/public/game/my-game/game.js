const scenes = [
  {
    type: "video",
    src: "videos/scene1.mp4",
    text: "ข้อความซีน 1",
    next: 1
  },
  {
    type: "minigame",
    text: "แตะปุ่ม 5 ครั้ง!",
    goal: 5,
    next: 2
  },
  {
    type: "video",
    src: "videos/scene2.mp4",
    text: "ข้อความซีน 2",
    next: 3
  },
  {
    type: "minigame",
    text: "แตะปุ่ม 10 ครั้ง!",
    goal: 10,
    next: 4
  },
  {
    type: "video",
    src: "videos/scene3.mp4",
    text: "จบเกม!",
    next: null
  }
]

let current = 0
let tapCount = 0

const video = document.getElementById("video")
const dialogBox = document.getElementById("dialog-box")
const dialogText = document.getElementById("dialog-text")
const nextBtn = document.getElementById("next-btn")
const minigameBox = document.getElementById("minigame-box")
const mgText = document.getElementById("mg-text")
const mgResult = document.getElementById("mg-result")
const mgNext = document.getElementById("mg-next")

function showScene(index) {
  const scene = scenes[index]
  current = index

  if (scene.type === "video") {
    minigameBox.style.display = "none"
    dialogBox.style.display = "block"
    video.src = scene.src
    video.play()
    dialogText.textContent = scene.text
    nextBtn.onclick = () => showScene(scene.next)
    nextBtn.style.display = scene.next !== null ? "inline-block" : "none"
  }

  if (scene.type === "minigame") {
    dialogBox.style.display = "none"
    minigameBox.style.display = "block"
    video.src = ""
    tapCount = 0
    mgText.textContent = scene.text
    mgResult.textContent = "0 / " + scene.goal
    mgNext.style.display = "none"
  }
}

function doTap() {
  const scene = scenes[current]
  if (scene.type !== "minigame") return
  tapCount++
  mgResult.textContent = tapCount + " / " + scene.goal
  if (tapCount >= scene.goal) {
    mgNext.style.display = "inline-block"
    mgNext.onclick = () => showScene(scene.next)
  }
}

showScene(0)