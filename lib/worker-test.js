
onmessage = ({data}) => {
  SixSpeed.benchTest(data.name, $type, result => {
    postMessage({result});
  });
};
