const fileUrl = "https://onedrive.live.com/:x:/g/personal/7e9fa645da9e2b7d/IQAn_LpTLK4oTolz-zHlnGw4AQb856z6ojO7NBiWxhMAx9M?rtime=R7yiaazZ3kg&redeem=aHR0cHM6Ly8xZHJ2Lm1zL3gvYy83ZTlmYTY0NWRhOWUyYjdkL0lRQW5fTHBUTEs0b1RvbHotekhsbkd3NEFRYjg1Nno2b2pPN05CaVd4aE1BeDlNP2U9N3Z6U09h";

fetch(fileUrl)
  .then(res => res.arrayBuffer())
  .then(buffer => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    console.log(jsonData);
  });
