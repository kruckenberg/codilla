const starterCode = `
function addTwo(num) {
  return num + 2;
}

function map(arr, callback) {
  const mappedArr = [];
  
  for (let elem of arr) {
    console.log({ elem });
    mappedArr.push(callback(elem));
  }

  return mappedArr;
}

console.log(map([1, 2, 3], addTwo));`.trim();

const testCode = `
import { strict as assert } from 'node:assert';

assert(typeof addTwo === 'function', 'addTwo should be a function');
assert(addTwo(2) === 5, 'addTwo(2) should return 4');`.trim();

const testExecutor = `
import { readFile } from "fs/promises";

const [sourceCode, testCode] = await Promise.all([fs.readFile("source.js", "utf-8"), fs.readFile("test.js", "utf-8")]);

try {
  eval(\${sourceCode} \${testCode});
  console.log("All tests passed");
} catch (error) {
  console.error(error);
}`.trim();

const packageJSON = `
{
   "name": "codilla",
   "type": "module",
   "dependencies": {},
      "scripts": {
   }
}`.trim();

export const files = {
  "source.js": {
    file: {
      contents: starterCode,
    },
  },
  "package.json": {
    file: {
      contents: packageJSON,
    },
  },
  "test.js": {
    file: {
      contents: testCode,
    },
  },
  "testExecutor.js": {
    file: {
      contents: testExecutor,
    },
  },
};
