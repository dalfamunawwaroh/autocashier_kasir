async function getInfo() {
  const apiKey = 'z8OVl7BBMYBZO2r6BSNY';
  const url = `https://api.roboflow.com/jagoai-workspace/autocashier-tel-u-fresh?api_key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
getInfo();
