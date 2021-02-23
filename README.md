# dice-roll-check
Rolls dice and checks the result from a single text string.

# installation
`npm install dice-roll-check`

# basics
You can break down a text string to a dice rolled result object. +(plus), -(minus), *(multiple), /(devide) are usable to calculate.  
Only single sign which of the following is valid in the string. =(equal), <(lessor), >(greater), <=(leasor or equal), >=(greater or equal)  
Any message may be added after a space.  
```javascript:rolling 1d100 dice and checks if the result is lessor than 60
const { roll } = require('./dice-roll-check')

roll('1d100<=60 Some additional Message.')


/* This results like below.
{
  resultText: '1d100[47]<=60 => 47<=60 => Success! Some additional,
  resultTextSimple: '1d100[47]<=60 => Success! Some additional Message.',
  processed: true,
  info: {
    input: '1d100<=60 Some additional Message.',
    firstPart: '1d100<=60',
    secondPart: ' Some additional Message.',
    sign: '<=',
    rollLeftSidePart: { sum: 47, str: '1d100[47]', dice: [ { type: 100, result: [ 47 ] } ] },
    rollRightSidePart: { sum: 60, str: '60', dice: [] },
    rollResult: '1d100[47]<=60',
    rollResultText: '1d100[47]<=60 => 47<=60 => Success!',
    rollResultTextSimple: '1d100[47]<=60 => Success!',
    rollSucceed: true
  },
  error: null
} 
*/
```

# options
```javascript:option example
roll('3d6', { sortRollResults: false })
```

| option property | type | default | description |
----|----|----|---- 
| defaultDiceMin | number | 1 | Dice minimum number.  example: set this value to 0 results that 1d6 takes range between 0 and 5. |
| defaultDiceMax | number | 6 | Dice maximum number when dice type is ommited.  example: set this value to 100 results that 2d means to roll 1d100 twice. |
| sortRollResults | boolean | true | Result sort flag. Whether to sort dice roll results or not. |
| rollSucceedText | string | Success! | Succeed to check text. |
| rollFailedText | string | Fail... | Failed to check text. |
| customRandomMethod | function | defaultGetRandomInt() | A function to get the random value. Default function example is below. |
```javascript:default getting random value function
function defaultGetRandomInt (min, max) {
  const limit = max - min
  return min + Math.floor(Math.random() * limit)
}
```
