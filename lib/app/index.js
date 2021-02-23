/**
dice-roll-check

Copyright (c) 2021 Yumemi Nakamura

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/


module.exports.roll = function (text = '', options) {
  // setOptions
  const isOptionsSet = isObject(options)
  DEFAULT_DICE_MIN = isOptionsSet && typeof options.defaultDiceMin === 'number' ? options.defaultDiceMin : 1
  DEFAULT_DICE_MAX = isOptionsSet && typeof options.defaultDiceMax === 'number' ? options.defaultDiceMax : 6
  SORT_ROLL_RESULTS = isOptionsSet && typeof options.sortRollResults === 'boolean' ? options.sortRollResults : true
  ROLL_SUCCEED_TEXT = isOptionsSet && typeof options.rollSucceedText === 'string' ? options.rollSucceedText : 'Success!'
  ROLL_FAILED_TEXT = isOptionsSet && typeof options.rollFailedText === 'string' ? options.rollFailedText : 'Fail...'
  GET_RANDOM_METHOD = isOptionsSet && typeof options.customRandomMethod === 'function' ? options.customRandomMethod : defaultGetRandomInt

  return rollText(text, options)
}


function isObject (sample) {
  return Object.prototype.toString.call(sample) === '[object Object]'
}

function defaultGetRandomInt (min, max) {
  const limit = max - min
  return min + Math.floor(Math.random() * limit)
}


let DEFAULT_DICE_MIN = 1
let DEFAULT_DICE_MAX = 6
let SORT_ROLL_RESULTS = true
let ROLL_SUCCEED_TEXT = 'Success!'
let ROLL_FAILED_TEXT = 'Fail...'
let GET_RANDOM_METHOD = defaultGetRandomInt


// String text to a result object
function rollText (text) {
  const result = {
    info: { input: text },
    resultText: '',
    processed: null,
    error: null
  }
  
  try {
    text = String(text)
    const whenCancel = () => {
      result.processed = false
      result.resultText = text
      result.info = { input: text }
    }
    
    const spaceIndex = text.search(/\s|　/)
    const partIndex = spaceIndex > 0 ? spaceIndex : 0
    const firstPart = text.substr(0, partIndex)
    const secondPart = text.substr(partIndex)
    
    let targetText = firstPart ? firstPart : secondPart
    targetText = targetText
    .replace(/[０-９ｄＤ＝＜＞＋ー＊・／]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
    })
    .replace(/D/g, 'd')
    
    if (!targetText || targetText.match(/[^0-9d\+\-\*\/\<\>\=]/)) {
      whenCancel()
    } else {
      result.info = Object.assign(
        result.info,
        {
          firstPart,
          secondPart,
          mark: null,
          rollLeftSidePart: null,
          rollRightSidePart: null
        }
      )

      let marks = targetText.match(/[\<\>\=]/g)
      if (!Array.isArray(marks)) marks = []
      if (marks.length > 3) {
        whenCancel()
      } else {
        switch (marks.length) {
          case 0: {
            const leftPart = breakDownFromString(targetText)
            result.info.rollResultText = `${ leftPart.str } => ${ leftPart.sum }`
            result.info.rollSucceed = null
            result.info.rollLeftSidePart = leftPart

            result.resultText = `${ result.info.rollResultText }${ secondPart }`
            result.processed = true
            break
          }
          case 1: {
            const apartIndex = targetText.search(marks[0])
            const leftPart = breakDownFromString(targetText.substr(0, apartIndex))
            const rightPart = breakDownFromString(targetText.substr(apartIndex + 1))
            const [isRollSucceed, rollResult] = checkRolledResults (marks[0], leftPart, rightPart)
            result.info.rollResultText = rollResult
            result.info.rollSucceed = isRollSucceed
            result.info.mark = marks[0]
            result.info.rollLeftSidePart = leftPart
            result.info.rollRightSidePart = rightPart

            result.resultText = `${ result.info.rollResultText }${ secondPart }`
            result.processed = true
            break
          }
          case 2: {
            // Only lessor <= =< greater >= => equal == are acceptable
            const matchedMark = targetText.match(/<=|=<|>=|=>|==/)
            if (matchedMark) {
              const mark = matchedMark[0].replace('=<', '<=').replace('=>', '>=')

              const apartIndex = targetText.search(mark)
              const leftPart = breakDownFromString(targetText.substr(0, apartIndex))
              const rightPart = breakDownFromString(targetText.substr(apartIndex + 2))
              const [isRollSucceed, rollResult] = checkRolledResults (mark, leftPart, rightPart)
              result.info.rollResultText = rollResult
              result.info.rollSucceed = isRollSucceed
              result.info.mark = mark
              result.info.rollLeftSidePart = leftPart
              result.info.rollRightSidePart = rightPart
  
              result.resultText = `${ result.info.rollResultText }${ secondPart }`
              result.processed = true
            } else {
              whenCancel()
            }
            break
          }
        }
      }
    }
  } catch (err) {
    console.error(err)
    result.processed = null
    result.error = err
  }
  
  return result
}


// Check rolled results
function checkRolledResults (mark, leftPart, rightPart) {
  let isRollSucceed = null

  switch (mark) {
    case '<': {
      isRollSucceed = leftPart.sum < rightPart.sum
      break
    }
    case '>': {
      isRollSucceed = leftPart.sum > rightPart.sum
      break
    }
    case '=':
    case '==': {
      isRollSucceed = leftPart.sum === rightPart.sum
      break
    }
    case '<=': {
      isRollSucceed = leftPart.sum <= rightPart.sum
      break
    }
    case '>=': {
      isRollSucceed = leftPart.sum >= rightPart.sum
      break
    }
  }

  const rollResult = `${ leftPart.str }${ mark }${ rightPart.str } => ${ leftPart.sum }${ mark }${ rightPart.sum } => ${ isRollSucceed ? ROLL_SUCCEED_TEXT : ROLL_FAILED_TEXT }`
  return [isRollSucceed, rollResult]
}


// String text to a roll result object
function breakDownFromString (str) {
  const blocks = ['']
  for (let char of str) {
    if (char.match(/[\+\-\/\*]/)) {
      blocks.push(char)
      blocks.push('')
    } else {
      addStringToArrayLastIndex(blocks, char)
    }
  }
  if (blocks[blocks.length - 1] === '') delete blocks[blocks.length - 1]
  
  // Roll dice for each of the blocks
  const blockResults = []
  blocks.forEach((block, i) => {
    // Marks
    if (block.match(/[\+\-\/\*]/)) {
      blockResults.push({
        type: 'mark',
        str: block
      })
      return
    }

    // Number
    if (!block.match('d')) {
      blockResults.push({
        type: 'number',
        str: block,
        sum: Number(block)
      })
      return
    }

    // Dice Roll 
    const expressions = ['']
    for (let char of block) {
      if (char.match('d')) {
        expressions.push(char)
        expressions.push('')
      } else {
        addStringToArrayLastIndex(expressions, char)
      }
    }
    
    let diceSum = null
    let rollDiceFlag = false
    const rollResults = []
    const execRoll = (max) => {
      // Single d means to 1d ※ allows 0
      if (typeof diceSum !== 'number') diceSum = 1

      let diceRollResults = []
      for (let c = 0; c < diceSum; c++) {
        const randResult = GET_RANDOM_METHOD(DEFAULT_DICE_MIN, max)
        diceRollResults.push(randResult)
      }
      rollResults.push({
        diceRollInfo: { type: max, result: diceRollResults },
        diceRollResults,
        sum: diceRollResults.reduce((previous, current) => {
          return previous + current
        }, 0),
        str: `${ String(diceSum) }d${ max }`
      })
      diceSum = null
      rollDiceFlag = false
    }

    for (let expression of expressions) {
      const isDice = expression.match('d') ? true : false
      
      if (rollDiceFlag) {
        if (isDice) {
          // Doubled d means to estimate the first d is the default dice type
          execRoll(DEFAULT_DICE_MAX)
          rollDiceFlag = true
        } else {
          // Right side of the d
          execRoll(expression ? Number(expression) : DEFAULT_DICE_MAX)
        }
      } else {
        if (isDice) {
          // Turn the roll flag true
          rollDiceFlag = true
        } else {
          // Left side of the d
          diceSum = Number(expression)
        }
      }
    }
    if (rollDiceFlag) {
      execRoll(DEFAULT_DICE_MAX)
    }
    
    blockResults.push(rollResults.reduce((previous, rollResult) => {
        if (!isNaN(rollResult.sum)) previous.sum += rollResult.sum
        previous.str = `${ previous.str }${ rollResult.str }[${
          (
            SORT_ROLL_RESULTS
              ? rollResult.diceRollResults.sort((a, b) => a === b ? 0 : (a < b ? -1 : 1))
              : rollResult.diceRollResults
          )
          .join(',')
        }]`
        previous.dice.push(rollResult.diceRollInfo)
        return previous
      }, { type: 'roll', str: '', sum: 0, dice: [] })
    )
  })

  // Concatenate blocks ※ blocks are supposed to be composed with roll, number and mark alternately
  const result = blockResults.reduce((previous, blockResult) => {
    if (blockResult.type === 'roll' || blockResult.type === 'number') {
      switch (previous.prevStr) {
        case '-': {
          previous.sum = previous.sum - blockResult.sum
          break
        }
        case '*': {
          previous.sum = previous.sum * blockResult.sum
          break
        }
        case '/': {
          previous.sum = previous.sum / blockResult.sum
          break
        }
        case '+':
        default: {
          previous.sum = previous.sum + blockResult.sum
          break
        }
      }

      previous.str += `${ previous.prevStr }${ blockResult.str }`
      if (isNaN(previous.sum)) previous.sum = 0

      previous.dice = previous.dice.concat(blockResult.dice)
    }

    previous.prevType = blockResult.type
    previous.prevStr = blockResult.str
    return previous
  }, { sum: 0, str: '', prevType: null, prevStr: '', dice: [] })

  // Delete unnecessary properties
  delete result.prevStr
  delete result.prevType

  return result
}

function addStringToArrayLastIndex (arrayRef, str) {
  const index = arrayRef.length ? arrayRef.length - 1 : 0
  
  arrayRef[index] = typeof arrayRef[index] === 'string'
    ? `${ arrayRef[index] }${ str }`
    : str
}