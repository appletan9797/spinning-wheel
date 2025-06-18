import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Wheel } from "react-custom-roulette";
import logo from "./logo.png";


const LuckyWheelApp = () => {
  const [entries, setEntries] = useState([]);
  const [numWinners, setNumWinners] = useState(1);
  const [winners, setWinners] = useState([]);
  const [spinData, setSpinData] = useState([
    { option: " " }
  ]);
  const [spinning, setSpinning] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [updatedEntry, setUpdatedEntry] = useState([]);


  const MAX_WHEEL_ITEMS = 100;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const formattedData = data.map((row) => ({
        Name: row.Name,
        Chosen: row.Chosen === true || row.Chosen === "TRUE",
        Round: row.Round || ""
      }));

      setEntries(formattedData);
    };
    reader.readAsBinaryString(file);
  };

  const triggerSpin = () => {
    const unchosen = entries.filter((entry) => !entry.Chosen);
    if (unchosen.length === 0) {
      alert("No more unchosen names left.");
      return;
    }

    const shuffled = [...unchosen].sort(() => 0.5 - Math.random());
    const selectedWinners = shuffled.slice(0, Math.min(numWinners, shuffled.length));

    const updatedEntries = entries.map((entry) => {
      if (selectedWinners.find((w) => w.Name === entry.Name)) {
        return {
          ...entry,
          Chosen: true,
          Round: `Round ${winners.length + 1}`
        };
      }
      return entry;
    });

    setUpdatedEntry(updatedEntries);

    const wheelData = unchosen.slice(0, MAX_WHEEL_ITEMS).map((entry) => ({
      option: entry.Name > 15 ? entry.Name.slice(0, 15) + "…" : entry.Name
    }));

    const randomWinnerFromWheel = wheelData.findIndex(
      (d) => d.option === selectedWinners[0].Name
    );

    setSpinData(wheelData);
    setPrizeNumber(Math.max(0, randomWinnerFromWheel));
    setWinners(selectedWinners);
    setEntries(updatedEntries);
    setSpinning(true);

    //exportExcel(updatedEntries);
  };

  const wheelColors = [
    "#FFFFFF", "#FFB399", "#FF33FF", "#FFFF99",
    "#00B3E6", "#E6B333", "#3366E6", "#999966",
    "#99FF99", "#B34D4D", "#80B300", "#809900",
    "#E6B3B3", "#6680B3", "#66991A", "#FF99E6",
    "#CCFF1A", "#FF1A66", "#E6331A", "#33FFCC","#FF6633"
  ];

  const handleFinished = () => {
    setSpinning(false);
    exportExcel(updatedEntry);

  };

  const exportExcel = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Winners");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "UpdatedWinners.xlsx");
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ textAlign: "center", flex: 1 }}>CMM Family Day 2025 - Lucky Draw</h1>
            <img src={logo} alt="Logo" style={{ height: "100px", width: "100px" }} />
        </div>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="mb-4" />
        <label>Number of Winners: </label>
        <input
            type="number"
            value={numWinners}
            min="1"
            onChange={(e) => setNumWinners(parseInt(e.target.value))}
            className="border px-2 py-1"
        />
    <div className="mb-4" style={{ marginTop:"15px" }}>
      <button style={{ marginTop:"15px" }} onClick={triggerSpin} disabled={spinning} className="bg-blue-500 text-white px-4 py-2 rounded">
        {spinning ? "Spinning..." : "Spin"}
      </button>
    </div>

      { spinData.length > 0 && (
        <div className="mt-6" style={{ position:"absolute" }}>
          <Wheel
            mustStartSpinning={spinning}
            prizeNumber={prizeNumber}
            data={spinData}
            backgroundColors={wheelColors}
            textColors={["#ffffff"]}
            onStopSpinning={handleFinished}
            pointerProps={{ style: { display: 'none' } }}
            fontSize={8}
            innerRadius={2}
            radiusLineColor="#eeeeee"
            radiusLineWidth={1}
            
          />
        </div>
      )}

      {!spinning && winners.length > 0 && (
        <div className="mt-6" style={{ position:"absolute", right:"10%" }}>
          <h2 className="text-xl font-semibold mb-2">Winners / 幸运儿:</h2>
          <ul className="list-disc list-inside">
            {winners.map((winner, idx) => (
              <li key={idx}>{winner.Name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LuckyWheelApp;
