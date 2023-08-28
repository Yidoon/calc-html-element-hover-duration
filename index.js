let startTime = 0
let intervalTimer
let isEnter = false
const containerEl = document.querySelector("#container")
containerEl.addEventListener("mouseover", (event) => {
  const elPaths = event.composedPath() || []
  for (let i = 0; i < elPaths.length; i++) {
    if (
      elPaths[i] &&
      elPaths[i].classList &&
      elPaths[i].classList.contains("item")
    ) {
      if (isEnter) {
        return
      }
      const t = new Date().getTime()
      isEnter = true
      if (intervalTimer) {
        clearInterval(intervalTimer)
      }
      intervalTimer = setInterval(() => {
        const diff = new Date().getTime() - t
        if (diff > 3000) {
          console.log("You have been hovered here for more than 3 seconds.")
          clearInterval(intervalTimer)
        }
      }, 10)
      startTime = t
    }
  }
})
const isDescendant = (parent, target) => {
  if (target === parent) {
    return true
  }
  let currentEl = target.parentNode
  while (currentEl) {
    if (currentEl === parent) {
      return true
    }
    currentEl = currentEl.parentNode
  }
  return false
}
containerEl.addEventListener("mouseout", (event) => {
  const elPaths = event.composedPath() || []
  if (
    elPaths[0].classList.contains("item") &&
    !isDescendant(elPaths[0], event.toElement)
  ) {
    const diff = new Date().getTime() - startTime
    console.log(`You spent ${diff} millsecond on element`, elPaths[0])
    clearInterval(intervalTimer)
    startTime = undefined
    isEnter = false
  }
})
