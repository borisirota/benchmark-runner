var isNode = require('detect-node')
var isWebWorker = require('detect-webworker')
var now = require('performance-now')

var NUM_OF_ITERATIONS = 5
var isRunning = false
var runs = []
var timeoutCanceler
var _onFinish = function () {}

function padRightWithSpaces (str) {
  return str + Array(10 - str.length + 1).join(' ')
}

function prettyAverage (average) {
  average = average.toString()
  return average.substr(0, average.indexOf('.') + 4)
}

function print (name, average) {
  var message = name ? `${padRightWithSpaces(prettyAverage(average))} ${name}` : 'DONE'
  if (isWebWorker) self.postMessage(message)
  else console.log(message)
}

function average (numbers) {
  var sum = 0
  for (var i = 0; i < numbers.length; i++) {
    sum += numbers[i]
  }
  return sum / numbers.length
}

function currentTime () {
  return isNode ? now() : performance.now()
}

function _run (name, fn, numOfRuns, done, results, iteration) {
  results = results || []
  iteration = iteration || 0
  if (numOfRuns === 0) return done(average(results))
  var t0 = currentTime()
  if (fn.length === 0) {
    fn()
    _run(name, fn, numOfRuns - 1, done, results.concat([currentTime() - t0]), iteration + 1)
  } else {
    fn(() => {
      _run(name, fn, numOfRuns - 1, done, results.concat([currentTime() - t0]), iteration + 1)
    }, iteration)
  }
}

function run () {
  isRunning = true
  if (runs.length === 0) {
    print()
    _onFinish()
    return
  }
  var name = runs[0][0]
  var fn = runs[0][1]
  _run(name, fn, NUM_OF_ITERATIONS, (average) => {
    print(name, average)
    runs = runs.slice(1)
    return run()
  })
}

var benchmark = function (name, fn) {
  runs.push([name, fn])
  if (isRunning) return
  clearTimeout(timeoutCanceler)
  timeoutCanceler = setTimeout(run, 1000)
}

benchmark.onFinish = function (fn) {
  _onFinish = fn
}

benchmark.iterations = function (_iterations) {
  NUM_OF_ITERATIONS = _iterations
}

module.exports = benchmark
