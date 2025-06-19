import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Wheel } from "react-custom-roulette";
import logo from "./logo.png";

const LuckyWheelApp = () => {
  const [entries, setEntries] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [numWinners, setNumWinners] = useState(1);
  const [winners, setWinners] = useState([]);
  const [spinData, setSpinData] = useState([{ option: " " }]);
  const [spinning, setSpinning] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [updatedEntry, setUpdatedEntry] = useState([]);
  const [currentGiftIndex, setCurrentGiftIndex] = useState(12); // Starting from 13

  const MAX_WHEEL_ITEMS = 150;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      
      // Read registered staff sheet (Sheet 1)
      const wsParticipants = wb.Sheets[wb.SheetNames[0]];
      const participantData = XLSX.utils.sheet_to_json(wsParticipants, { defval: "" });

      const formattedData = participantData.map((row) => ({
        Name: row.Name,
        Chosen: row.Chosen === true || row.Chosen === "TRUE",
        Round: row.Round || "",
        Gift: row.Gift || ""
      }));

      setEntries(formattedData);

      // Read gifts sheet (Sheet 2)
      if (wb.SheetNames.length > 1) {
        const wsGifts = wb.Sheets[wb.SheetNames[1]];
        const giftData = XLSX.utils.sheet_to_json(wsGifts, { defval: "" });
        const formattedGifts = giftData.map((gift) => ({
          SN: gift.SN,
          Supplier: gift.SUPPLIER,
          PrizeDescription: gift.PRIZEDESCRIPTIONS,
          Value: gift.VALUE,
          Assigned: false
        }));
        setGifts(formattedGifts);
        
      }
    };
    reader.readAsBinaryString(file);
  };

  const triggerSpin = () => {
    const unchosen = entries.filter((entry) => !entry.Chosen);
    if (unchosen.length === 0) {
      alert("No more unchosen names left.");
      return;
    }

    if (gifts.length === 0) {
      alert("Please upload a file with gifts information.");
      return;
    }

    const availableGift = gifts.filter(gift => !gift.Assigned && gift.SN >12).length;
    console.log("Available gift:"+ availableGift)
    console.log("Winner"+numWinners)
    if (numWinners > availableGift){
        alert("Remaining gift (" + availableGift + ") not enough for users. Please change number of Winners");
        return;
    }

    const shuffled = [...unchosen].sort(() => 0.5 - Math.random());
    const selectedWinners = shuffled.slice(0, Math.min(numWinners, shuffled.length));

    const giftsCopy = [...gifts];
    let currentGiftIndexLocal = currentGiftIndex;
    // Assign gifts to winners
    const winnersWithGifts = selectedWinners.map(winner => {
        // Find next gift
        let assignedGift = null;
        for (let i = currentGiftIndexLocal; i < giftsCopy.length; i++) {
          if (!giftsCopy[i].Assigned) {
            assignedGift = {
              ...giftsCopy[i],
              Assigned: true
            };
            giftsCopy[i].Assigned = true;
            currentGiftIndexLocal = i + 1;
            break;
          }
        }
    
        // If no more gifts available
        if (!assignedGift) {
          assignedGift = { 
            SN: "N/A", 
            Supplier: "No more gifts", 
            PrizeDescription: "No prize available", 
            Price: "0" 
          };
        }
    
        return {
          ...winner,
          Gift: `${assignedGift.PrizeDescription}`,
          GiftDetails: assignedGift
        };
      });

    const updatedEntries = entries.map((entry) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
      const winner = winnersWithGifts.find((w) => w.Name === entry.Name);
      if (winner) {
        return {
          ...entry,
          Chosen: true,
          Round: `Round ${timeString}`,
          Gift: winner.Gift
        };
      }
      return entry;
    });

    // Update gifts status
    const updatedGifts = [...gifts];
    for (let i = currentGiftIndex - selectedWinners.length; i < currentGiftIndex; i++) {
      if (i >= 0 && i < gifts.length) {
        updatedGifts[i].Assigned = true;
      }
    }
    setGifts(updatedGifts);

    setUpdatedEntry(updatedEntries);

    const wheelData = unchosen.slice(0, MAX_WHEEL_ITEMS).map((entry) => ({
      option: entry.Name.length > 15 ? entry.Name.slice(5, 25) + "…" : entry.Name
    }));

    const randomWinnerFromWheel = wheelData.findIndex(
      (d) => d.option === selectedWinners[0].Name
    );

    setSpinData(wheelData);
    setPrizeNumber(Math.max(0, randomWinnerFromWheel));
    setWinners(winnersWithGifts);
    setEntries(updatedEntries);
    setSpinning(true);
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
    // Create workbook with two sheets
    const workbook = XLSX.utils.book_new();
    
    // Add winners sheet
    const winnersWorksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, winnersWorksheet, "Winners");
    
    // Add gifts sheet (convert back to original column names)
    const giftsForExport = gifts.map(gift => ({
      SN: gift.SN,
      SUPPLIER: gift.Supplier,
      PRIZEDESCRIPTIONS: gift.PrizeDescription,
      VALUE: gift.Price,
      Assigned: gift.Assigned
    }));
    const giftsWorksheet = XLSX.utils.json_to_sheet(giftsForExport);
    XLSX.utils.book_append_sheet(workbook, giftsWorksheet, "Gifts");
    
    // Add Winner - Gift sheet
    const winnerGift = winners.map((winner, idx) =>({
        SN:idx+1,
        Winner: winner.Name,
        Prize:winner.Gift
    }));
    const winnerGiftSheet = XLSX.utils.json_to_sheet(winnerGift);
    XLSX.utils.book_append_sheet(workbook, winnerGiftSheet, "WinnerGift");

    // Export the workbook
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "UpdatedWinners.xlsx");
  };

  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">
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
        <div className="grid grid-cols-3 gap-4 h-full">
            <div className="min-h-full bg-gray-100"></div>
            <div>
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
            <div></div>
        </div>
      )}

      {!spinning && winners.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Winners / 幸运儿:</h2>
            <table style={{ border:"1px solid black", borderCollapse:"collapse", margin:"0 10px 0 10px"}}>
            <th style={{ border:"1px solid black", borderCollapse:"collapse" }}>SN</th>
            <th style={{ border:"1px solid black", borderCollapse:"collapse" }}>Name</th>
            <th style={{ border:"1px solid black", borderCollapse:"collapse" }}>Gift</th>
            {winners.map((winner, idx) => (
                <tr>
                <td style={{ border:"1px solid black", borderCollapse:"collapse"}}>{idx+1}</td>   
                <td style={{ border:"1px solid black", borderCollapse:"collapse"}}>{winner.Name}</td>
                <td style={{ border:"1px solid black", borderCollapse:"collapse" }}>{winner.Gift}</td>
              </tr>
            ))}
            </table>
        </div>
      )}
    </div>
  );
};

export default LuckyWheelApp;