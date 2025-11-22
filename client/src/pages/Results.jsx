import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Bar } from "react-chartjs-2";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/constants";

export default function Results() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    async function loadResults() {
      try {
        const [ids, names, votes] = await contract.getAllCandidates();
        const list = ids.map((id, i) => ({
          id: Number(id),
          name: names[i],
          votes: Number(votes[i]),
        }));
        setResults(list);
      } catch (err) {
        console.error(err);
      }
    }

    loadResults();
    const interval = setInterval(loadResults, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-10 bg-white min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center">🧾 Live Election Results</h2>
      <Bar
        data={{
          labels: results.map((r) => r.name),
          datasets: [
            {
              label: "Vote Count",
              data: results.map((r) => r.votes),
              backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: { legend: { position: "top" } },
        }}
      />
    </div>
  );
}
