onmessage = (msg) => {
  let rawCode = msg.data;
  let result = eval(rawCode);

  postMessage(result);
};
