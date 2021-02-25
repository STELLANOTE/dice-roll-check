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
  ROLL_RESULT_ARROW = isOptionsSet && typeof options.rollResultArrow === 'string' ? options.rollResultArrow : '=>'
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
let ROLL_RESULT_ARROW = '=>'
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
    const firstPart = text.substr(0, spaceIndex > 0 ? spaceIndex : text.length)
    const secondPart =　spaceIndex > 0 ? text.substr(spaceIndex) : ''
    
    let targetText = firstPart ? firstPart : secondPart
    targetText = targetText
    .replace(/[０-９ｄＤ＝＜＞＋ー＊・／（）]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
    })
    .replace(/D/g, 'd')
    
    if (!targetText || targetText.match(/[^0-9d\+\-\*\/\<\>\=\(\)]/)) {
      whenCancel()
    } else {
      result.info = Object.assign(
        result.info,
        {
          firstPart,
          secondPart,
          sign: null,
          rollLeftSidePart: null,
          rollRightSidePart: null
        }
      )

      let signs = targetText.match(/[\<\>\=]/g)
      if (!Array.isArray(signs)) signs = []
      if (signs.length > 3) {
        whenCancel()
      } else {
        switch (signs.length) {
          case 0: {
            const leftPart = breakDownFromString(targetText)
            result.info.rollResult = `${ leftPart.str } ${ ROLL_RESULT_ARROW } ${ leftPart.sum }`
            result.info.rollResultText = result.info.rollResult
            result.info.rollResultTextSimple = result.info.rollResultText
            result.info.rollSucceed = null
            result.info.rollLeftSidePart = leftPart

            result.resultText = `${ result.info.rollResultText }${ secondPart }`
            result.resultTextSimple = result.resultText
            result.processed = true
            break
          }
          case 1: {
            const apartIndex = targetText.search(signs[0])
            const leftPart = breakDownFromString(targetText.substr(0, apartIndex))
            const rightPart = breakDownFromString(targetText.substr(apartIndex + 1))
            const [isRollSucceed, rollResult, rollResultText, rollResultSimple] = checkRolledResults (signs[0], leftPart, rightPart)
            result.info.rollResult = rollResult
            result.info.rollResultText = rollResultText
            result.info.rollResultTextSimple = rollResultSimple
            result.info.rollSucceed = isRollSucceed
            result.info.sign = signs[0]
            result.info.rollLeftSidePart = leftPart
            result.info.rollRightSidePart = rightPart

            result.resultText = `${ result.info.rollResultText }${ secondPart }`
            result.resultTextSimple = `${ result.info.rollResultTextSimple }${ secondPart }`
            result.processed = true
            break
          }
          case 2: {
            // Only lessor <= =< greater >= => equal == are acceptable
            const matchedSign = targetText.match(/<=|=<|>=|=>|==/)
            if (matchedSign) {
              const mark = matchedSign[0].replace('=<', '<=').replace('=>', '>=')

              const apartIndex = targetText.search(mark)
              const leftPart = breakDownFromString(targetText.substr(0, apartIndex))
              const rightPart = breakDownFromString(targetText.substr(apartIndex + 2))
              const [isRollSucceed, rollResult, rollResultText, rollResultSimple] = checkRolledResults (mark, leftPart, rightPart)
              result.info.rollResult = rollResult
              result.info.rollResultText = rollResultText
              result.info.rollResultTextSimple = rollResultSimple
              result.info.rollSucceed = isRollSucceed
              result.info.sign = mark
              result.info.rollLeftSidePart = leftPart
              result.info.rollRightSidePart = rightPart
  
              result.resultText = `${ result.info.rollResultText }${ secondPart }`
              result.resultTextSimple = `${ result.info.rollResultTextSimple }${ secondPart }`
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
    // console.error(err)
    result.processed = null
    result.error = err
  }
  
  return result
}


// Check rolled results
function checkRolledResults (sign, leftPart, rightPart) {
  let isRollSucceed = null

  switch (sign) {
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

  const rollResult = `${ leftPart.str }${ sign }${ rightPart.str }`
  const rollResultText = `${ rollResult } ${ ROLL_RESULT_ARROW } ${ leftPart.sum }${ sign }${ rightPart.sum } ${ ROLL_RESULT_ARROW } ${ isRollSucceed ? ROLL_SUCCEED_TEXT : ROLL_FAILED_TEXT }`
  const rollResultSimple = `${ rollResult } ${ ROLL_RESULT_ARROW } ${ isRollSucceed ? ROLL_SUCCEED_TEXT : ROLL_FAILED_TEXT }`
  return [isRollSucceed, rollResult, rollResultText, rollResultSimple]
}


// String text to a roll result object ※0-9, d, +-*/ and () are allowed
function breakDownFromString (str) {
  let parenthesesPartList = ['']
  for (let c = 0, isInsideParentheses = [false]; c < str.length; c++) {
    const char = str.substr(c, 1)

    if (isInsideParentheses.some(isInside => isInside)) {
      switch (char) {
        case '(': {
          isInsideParentheses.push(true)
          parenthesesPartList.push('(')
          parenthesesPartList.push('')
          break
        }
        case ')': {
          // End of the current parentheses
          const mostRecentParenthesesIndex = isInsideParentheses.lastIndexOf(true)
          isInsideParentheses[mostRecentParenthesesIndex] = false
          isInsideParentheses.push(false)
          parenthesesPartList.push(')')
          parenthesesPartList.push('')
          break
        }
        default: {
          addStringToArrayLastIndex(parenthesesPartList, char)
          break
        }
      }
    } else {
      if (char === '(') {
        // Start of a parentheses
        isInsideParentheses[isInsideParentheses.length - 1] = true
        parenthesesPartList.push('(')
        parenthesesPartList.push('')
      } else {
        addStringToArrayLastIndex(parenthesesPartList, char)
      }
    }
  }
  
  const rolledPartList = parenthesesPartList
    .filter(part => part !== '')
    .map((part, i, arr) => {
      if (arr[i + 1] === '(') {
        // before (
        return {
          type: 'plain',
          value: part.replace(/[\+\-\/\*]*$/, '')
        }
      } else if (part === '(') {
        const prefix = String(arr[i - 1]).match(/[\+\-\/\*]*$/)
        return {
          type: 'start',
          prefix: prefix && prefix[0] ? prefix[0] : '*',
          value: part
        }
      } else if (part === ')') {
        const postfix = String(arr[i + 1]).match(/^[\+\-\/\*]*/)
        return {
          type: 'end',
          postfix: postfix && postfix[0] ? postfix[0] : '*',
          value: part
        }
      } else if (arr[i - 1] === ')') {
        // after )
        return {
          type: 'plain',
          value: part.replace(/^[\+\-\/\*]*/, '')
        }
      } else {
        return {
          type: 'plain',
          value: part
        }
      }
    })
    .map(partObj => {
      if (partObj.type === 'plain') {
        partObj.roll = partStringToResult(partObj.value)
      }
      return partObj
    })

  // Concatenate all the parts
  const result = rolledPartList.reduce((prev, rolledPart, index) => {
    switch (rolledPart.type) {
      case 'start': {
        prev.textSum += ` ${ rolledPart.prefix } (`
        prev.str += `${ rolledPart.prefix }(`
        break
      }
      case 'end': {
        prev.textSum += `) ${ rolledPart.postfix } `
        prev.str += `)${ rolledPart.postfix }`
        break
      }
      case 'plain': {
        prev.textSum += String(rolledPart.roll.sum)
        prev.str += rolledPart.roll.str
        if (rolledPart.roll.dice.length > 0) prev.dice = prev.dice.concat(rolledPart.roll.dice)
        break
      }
    }
    return prev
  }, { sum: 0, textSum: '', str: '', dice: [] })

  result.sum = eval(`${ result.textSum.replace(/^[\/\*]*/, '').replace(/[\+\-\/\*]*$/, '') }`)
  delete result.textSum

  return result
}


// Process starts for each of the part inside parentheses
function partStringToResult (str) {
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
    // Sings
    if (block.match(/[\+\-\/\*]/)) {
      blockResults.push({
        type: 'sign',
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
      // Single d means to 1d ※ allows specified 0
      if (typeof diceSum !== 'number' || isNaN(diceSum)) diceSum = 1

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
          diceSum = expression.length > 0 ? Number(expression) : 1
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

  // Concatenate blocks ※ blocks are supposed to be composed with roll, number and sign alternately
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

      if (typeof blockResult.dice !== 'undefined') previous.dice = previous.dice.concat(blockResult.dice)
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