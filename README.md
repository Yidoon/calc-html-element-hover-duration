# 如何计算在一个元素上的停留时间

## 前言

最近在写数据埋点的需求，有一个数据埋点需要上报用户 hover 过的元素的 id，用于统计用户对哪些内容感兴趣。最简单粗暴的方法是在每个元素上监听 mouseover 事件，当这个事件触发后立马就上报。这样写明显存在两个问题。

1. 给每个元素都绑定了事件，效率上多少有点浪费。
2. 鼠标 hove 过元素后立马就上报，不够准确，有可能用户只是鼠标移动的时候划过了元素，不能表示用户对划过的内容感兴趣，最起码也要有一定的停留时间。
   这两个问题的解决方案细想一下好像也简单，一是使用事件委托，代理所有元素的鼠标事件。二是计算元素的 hover 时间然后超过某个时间后再执行上报动作。[Github 代码地址](https://github.com/Yidoon/html-element-hover-duration)

## 如何计算在元素上的停留时间

**浏览器中是没有 hover 事件的，常用的方法是通过鼠标事件去模拟 hover**。这里我们可以借助 **mouseover**和 **mouseout**事件。
当把鼠标移动到元素上时我们记录一个时间 A，然后开启一个定时器。定时器中不断的去计算当前时间和时间 A 的差值，这个时间就是实时停留时间。当鼠标移出元素时，我们清除这个定时器，记录一个时间 B，使用 B 减去 A 得到的差值就是在元素上的停留时间。第一个差值是实时计算的，我们可以根据这个差值去做一些特定的动作，比如停留时间大于 2s 就发送一个请求，不影响定时器继续运作。第二个差值时间是用户离开元素时停留的时间，不是实时的，比如停留时间大于 2s 也发送一个上报。大致的代码如下

```javascript
let startTime
let intervalId
const targetEl = document.getQuerySelector("#target")
target.addEventListener("mouseover", (e) => {
  startTime = new Date().getTime()
  intervalId = setInterval(() => {
    const diff = new Data().getTime() - startTime
    if (diff > 2000) {
      // Send request
    }
  }, 10)
})
targetEl.addEventListener("mouseout", (e) => {
  const diff = new Date().getTime() - startTime
  if (diff > 2000) {
    // Send request
  }
  console.log(diff)
  clearInterval(intervalId)
})
```

这种方法需要在每一个目标元素上进行绑定，如果你有一个列表，列表上有几百个甚至更多的元素，那么使用这种方法就会造成比较大的性能浪费。因此我们借助事件委托去解决这个问题。不过在讨论事件委托之前，我们先来讨论一下为什么要使用 mouseover 和 mouseout 进行搭配，而不是使用 mouseenter 和 mouseleave\*\*，或者其他的搭配。我们先来看一下这几个事件的区别。

- **mouseenter**： 鼠标进入指定元素范围内触发，经过元素的子元素时，不会触发该事件，因此此事件**不会冒泡**。**且从子元素的范围进入到父元素的范围时，不会触发父元素的事件。**
- **mouseover**: 鼠标经过指定元素或者元素的子元素时触发，**会冒泡**。**并且从子元素范围进入父元素范围时，会再次触发父元素的事件。**
- **mousemove**: 鼠标在元素范围内移动，**会冒泡**
- **mouseleave**: 鼠标离开元素范围内，**不会冒泡**。
- **mouseout**: 鼠标离开元素范围内，离开子元素时也会触发，**会冒泡**。**并且从子元素离开时，也会触发父元素的事件**。**从父元素进入子元素区域也会触发，因为此时父亲元素会被子元素**

以上的几个鼠标事件分为三大块，**移入元素事件**，**移出元素事件**，**元素内移动事件**。其中移入和移出事件分别有冒泡和不冒泡的，为什么要区分是否冒泡，因为这个很关键，**如果不能冒泡的话，那么将无法利用事件委托这个方法去做优化。** 所以这就是为什么要选择 mouseover 和 mouseout 进行搭配。

## 如何使用事件委托

**如果要利用事件委托，有一个大前提就是元素是可以冒泡的。** 事件委托的原理也很简单，就是将事件绑定在元素的父元素上，获取到 event.target 对象，判断这个对象是不是你要处理的元素发出的。这样就无需给所有的元素绑定事件，只需要绑定在父元素上。

## 实现细节

计算的原理就是之前提到的，但是这里我们要使用事件委托的方式去实现，而不是在每一个元素上去绑定。假设我们现在有一个 index.html 它的页面结构如下：

```html
<!DOCTYPE html>

<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Document</title>

    <style>
      .container {
        display: flex;

        gap: 20px;

        background-color: #eee;
      }

      .item {
        width: 200px;

        height: 200px;

        border: 1px solid red;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="item">item1</div>

      <div class="item">item2</div>

      <div class="item">item3</div>

      <div class="item">item4</div>
    </div>

    <script src="./index.js"></script>
  </body>
</html>
```

有一个 index.js 文件

```javascript
let startTime
let intervalTimer

const containerEl = document.querySelector("#container")
containerEl.addEventListener("mouseover", (event) => {
  if (event.target.classList.contains("item")) {
    startTime = new Date().getTime()
    setInterval(() => {
      const diff = new Date().getTime() - startTime
      console.log(diff, "diff")
      if (diff > 2000) {
        // Send request or do something
      }
    }, 10)
  }
})

containerEl.addEventListener("mouseout", (event) => {
  if (event.target.classList.contains("item")) {
    const diff = new Date().getTime() - startTime
    console.log("mouseout", diff)
    clearInterval(intervalTimer)
    startTime = undefined
  }
})
```

当 item 元素内没有其他子元素的时候，这种方法确实可行，但是当 item 元素内有其他的元素的时候，这种方法就不行了。我们改动一下 index.html 的结构，给 item 添加子元素, index.js 文件内容保持不变。

```html
<!DOCTYPE html>

<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Document</title>

    <style>
      #container {
        display: flex;

        gap: 20px;

        background-color: #eee;
      }

      .item {
        width: 200px;

        height: 200px;

        border: 1px solid red;
      }

      .item-child {
        width: 140px;

        height: 140px;

        border: 1px solid green;

        margin: 0 auto;
      }
    </style>
  </head>

  <body>
    <div id="container">
      <div class="item">
        item1

        <div class="item-child">item1-child</div>
      </div>

      <div class="item">
        item2

        <div class="item-child">item2-child</div>
      </div>

      <div class="item">
        item3

        <div class="item-child">item3-child</div>
      </div>

      <div class="item">
        item4

        <div class="item-child">item4-child</div>
      </div>
    </div>

    <script src="./index2.js"></script>
  </body>
</html>
```

但是这个时候会有如下几个问题：

- 当从 item 元素进入到 item-child 元素时，item 元素会触发 mouseout 事件，明明还在 item 元素内部，却误认为离开了元素，导致停留时间计算不准确。
- 当从 item-child 元素进入到 item 元素时，会再次出发 item 元素的 mouseover 事件，明明还在 item 元素内部，之前已经触发过了 mouseover 事件，但还是会再触发一次，导致重新计时。
  导致这两个问题的罪魁祸首还是**事件冒泡机制**，其二是 event.target.classList.contains('item')这个判断条件不够。那么该如何避免这个问题呢？第一个问题通过加一个状态 isEnter 去处理。第二个问题通过 composedPath 方法和 toElement 属性做更加细致的判断。详细的过程如下：

composedPath 这个方法会返回事件流中的对象元素，**说直白一点就是它会把冒泡这一路上的元素记录下来然后返回给你**。而 toElement 这个属性可以得知事件的目标对象，就是鼠标从哪个元素渠到了哪个元素。我们根据 composedPath 方法返回的第一个元素去判断是不是 item 元素发出的，如果不是说明是 item 的子元素发出的，那么就不去处理，以及根据 toElement 这个属性判断去到的下一个元素是内部的子元素还是外部元素，如果是子元素那么就不做处理。这就解决了第二个问题。第一个问题呢，我们可以在外部存一个变量 isEnter,用于记录是否进入过 item 元素，如果元素 item 触发过 mouseover 事件将 isEnter 置为 true，那么后续从 item-child 元素进入 item 触发 item 的 mouseover 时，如果 isEnter 为 true，则不做处理。直到离开 item 元素则重新置为 false，这样就形成了一个闭环。
改进后的 index.js 文件代码如下：

```javascript
let startTime
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
      if (isLeave) {
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
    }
  }
  if (event.target.classList.contains("item")) {
    startTime = new Date().getTime()
    setInterval(() => {
      const diff = new Date().getTime() - startTime
      console.log(diff, "diff")
      if (diff > 2000) {
        // Send request or do something
      }
    }, 10)
  }
})

containerEl.addEventListener("mouseout", (event) => {
  if (event.target.classList.contains("item")) {
    const diff = new Date().getTime() - startTime
    console.log(`You spent ${diff} millsecond on element`, elPaths[0])
    clearInterval(intervalTimer)
    startTime = undefined
    isEnter = false
  }
})
```

## 总结

以上的代码实现了两个功能：1. 实时获取在元素上的 hover（停留）时长。2.离开元素后，获取在元素上的 hover（停留）时间。需要注意的点是 mouseover 和 mouseout 的冒泡事件有点特殊，需要做一些额外的处理。以及利用事件委托去处理性能问题。
