import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Wheel } from "react-custom-roulette";

const LuckyWheelApp = () => {
  const [entries, setEntries] = useState([]);
  const [numWinners, setNumWinners] = useState(1);
  const [winners, setWinners] = useState([]);
  const [spinData, setSpinData] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);

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
    const selected = shuffled.slice(0, numWinners);
    const data = selected.map((entry) => ({ option: entry.Name }));

    setSpinData(data);
    setPrizeNumber(Math.floor(Math.random() * data.length));
    setSpinning(true);
  };

  const handleFinished = () => {
    const winnerName = spinData[prizeNumber].option;
    const selected = entries.find((entry) => entry.Name === winnerName);
    if (!selected) return;

    const updatedEntries = entries.map((entry) => {
      if (entry.Name === winnerName) {
        return { ...entry, Chosen: true, Round: `Round ${winners.length + 1}` };
      }
      return entry;
    });

    setEntries(updatedEntries);
    setWinners((prev) => [...prev, selected]);
    exportExcel(updatedEntries);
    setSpinning(false);
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
      <h1 className="text-2xl font-bold mb-4">🎯 Lucky Draw Spinner</h1>

      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="mb-4" />

      <div className="mb-4">
        <label>Number of Winners: </label>
        <input
          type="number"
          value={numWinners}
          min="1"
          onChange={(e) => setNumWinners(parseInt(e.target.value))}
          className="border px-2 py-1"
        />
      </div>

      <button onClick={triggerSpin} disabled={spinning} className="bg-blue-500 text-white px-4 py-2 rounded">
        {spinning ? "Spinning..." : "Spin"}
      </button>

      {spinning && spinData.length > 0 && (
        <div className="mt-6">
          <Wheel
            mustStartSpinning={spinning}
            prizeNumber={prizeNumber}
            data={spinData}
            backgroundColors={["#FF6633", "#00B3E6"]}
            textColors={["#ffffff"]}
            onStopSpinning={handleFinished}
          />
        </div>
      )}

      {winners.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">🎉 Winners:</h2>
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
