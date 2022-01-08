import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { createWorker, createScheduler, PSM } from "tesseract.js";

function App() {
  const scheduler = createScheduler();

  const userVideo = useRef();
  let timerId = useRef();

  const [tableData, setTableData] = useState({
    smallBlind: 0,
    bigBlind: 0,
    ante: 0,
    buttonPosition: 0,
  });
  const [playerData, setPlayerData] = useState([]);
  
  const stacksList = () => {
    return playerData.map((stack, index) => {
      const className = index + 1 === parseInt(tableData.buttonPosition) ? "list-group-item active" : "list-group-item";
      return (
        <li className={className}key={index}>
          Seat {index + 1}: {stack ? stack : "Empty"}
        </li>
      );
    });
  };

  const ignitionPlayerBetRectangles = [
    // sparse text seems to work here
    { left: 335, top: 457, width: 76, height: 22 }, // player 0 bet
    { left: 178, top: 446, width: 74, height: 21 }, // player 1 bet
    { left: 28, top: 378, width: 74, height: 21 }, // player 2 bet
    { left: 48, top: 236, width: 74, height: 21 }, // player 3 bet
    { left: 228, top: 179, width: 73, height: 21 }, // player 4 bet
    { left: 442, top: 179, width: 76, height: 21 }, // player 5 bet
    { left: 623, top: 237, width: 78, height: 19 }, // player 6 bet
    { left: 640, top: 378, width: 75, height: 22 }, // player 7 bet
    { left: 493, top: 447, width: 70, height: 21 }, // player 8 bet
  ];

  useEffect(() => {
    const initialize = async () => {
      ignitionPlayerBetRectangles.forEach(async (rect) => {
        const worker = createWorker();
        await worker.load();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789",
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        });
        scheduler.addWorker(worker);
      });
      console.log("workers initialized");
      const video = userVideo.current;
      video.addEventListener("play", () => {
        timerId.current = setInterval(startOcr, 1000);
      });

      console.log("ready");
    };
    initialize();
  }, []);

  const startCapture = async (displayMediaOptions) => {
    let captureStream = null;

    try {
      captureStream = await navigator.mediaDevices.getDisplayMedia(
        displayMediaOptions
      );
    } catch (err) {
      console.error("Error: " + err);
    }
    userVideo.current.srcObject = captureStream;
  };

  const startOcr = async () => {
    const video = document.getElementById("screen-share");
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 562;

    canvas.getContext("2d").drawImage(video, 0, 0, 960, 562);
    const results = await Promise.all(
      ignitionPlayerBetRectangles.map((rectangle) => {
        return scheduler.addJob("recognize", canvas, { rectangle });
      })
    );
    const data = results.map((r) => r.data.text);
    setPlayerData(data);
  };

  const changeButtonPosition = (position) => {
    // todo: pivot index of stacks by button
    setTableData({ ...tableData, buttonPosition: position });
  }


  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-9">
          <video
            id="screen-share"
            controls
            style={{ height: 562, width: 960 }}
            autoPlay
            ref={userVideo}
          />
          <div className="row justify-content-center">
            <div className="col-9">
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startCapture()}
                  >
                    {" "}
                    Share screen
                  </button>
                </div>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Small Blind"
                  onChange={(e) => setTableData({ ...tableData, smallBlind: e.target.value })}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Big Blind"
                  onChange={(e) => setTableData({ ...tableData, bigBlind: e.target.value })}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ante"
                  onChange={(e) => setTableData({ ...tableData, ante: e.target.value })}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Button Position"
                  value={tableData.buttonPosition}
                  onChange={(e) => changeButtonPosition(e.target.value)}
                />
                <div className="input-group-append">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {}}
                  >
                    {" "}
                    Solve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-3">
          <ul className='.list-group-flush'>
            {stacksList()}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
