Create a function `subtractTwo` that accepts a number and returns that number minus 2.

Then create a function `map` that takes two inputs:

1. an array of numbers (a list of numbers)
2. a 'callback' function - this function is applied to each element of the array (inside of the function 'map')

Have your map function return a new array filled with numbers that are the result of using the 'callback' function on each element of the input array. Please do not use the native `map` or `forEach` method.

```javascript
map([3, 4, 5], subtractTwo); //-> [1,2,3]
subtractTwo(10); //-> 8
subtractTwo(12); //-> 10
```
