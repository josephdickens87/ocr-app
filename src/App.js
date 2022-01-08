import React, { useRef, useEffect, useState } from "react";
// import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { createWorker, createScheduler, PSM } from "tesseract.js";
import OcrRectangleConstants from "./constants/rectangleConstants";

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

  const [playerData, setPlayerData] = useState([123, 23423, 2342, 1231, 12313, 2131, 12]);
  const [gameType, setGameType] = useState("ignitionNineMan");

  const stacksList = () => {
    return playerData.map((stack, index) => {
      const className =
        index + 1 === parseInt(tableData.buttonPosition)
          ? "list-group-item active"
          : "list-group-item";
      return (
        <li className={className} key={index}>
          Seat {index + 1}: {stack ? stack : "Empty"}
        </li>
      );
    });
  };

  useEffect(() => {
    const initialize = async () => {
      OcrRectangleConstants[gameType]?.forEach(
        async (rect) => {
          const worker = createWorker();
          await worker.load();
          await worker.loadLanguage("eng");
          await worker.initialize("eng");
          await worker.setParameters({
            tessedit_char_whitelist: "0123456789",
            tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          });
          scheduler.addWorker(worker);
        }
      );
      console.log("workers initialized");
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameType]);

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

    userVideo.current.addEventListener("play", () => {
      timerId.current = setInterval(startOcr, 1000);
    });
  };

  const startOcr = async () => {
    const video = document.getElementById("screen-share");
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 562;

    canvas.getContext("2d").drawImage(video, 0, 0, 960, 562);
    const results = await Promise.all(
      OcrRectangleConstants[gameType].map((rectangle) => {
        return scheduler.addJob("recognize", canvas, { rectangle });
      })
    );
    const data = results?.map((r) => r.data.text);
    setPlayerData(data);
  };

  const reorderPlayerStacks = () => {
    const stacks = playerData.filter((stack) => parseInt(stack));
    if (tableData.buttonPosition + 2 < stacks.length) {
      const beforeBlinds = stacks.slice(0, tableData.buttonPosition + 2);

      const afterBlinds = stacks.slice(
        tableData.buttonPosition + 2,
        stacks.length
      );

      return [...afterBlinds, ...beforeBlinds];
    } else {
      const beforeBlinds = stacks.splice(0, tableData.buttonPosition + 2);
      return [...beforeBlinds, ...stacks];
    }
  };

  const solve = (stacks) => {
    console.log(stacks)
  } 
  return (
    <div className="container-fluid p-3">
      <div className="d-flex flex-row w-100 justify-content-center">
        <div className="col-auto p-3">
          <video
            id="screen-share"
            controls
            style={{ height: 562, width: 960 }}
            autoPlay
            ref={userVideo}
          />
          <div className="button-row">
            <div className="input-group h-100">
              <div className="input-group-prepend">
                <button type="button" className="btn btn-primary" onClick={() => {startCapture()}}>
                Start Screen Capture
                </button>
                <button
                  type="button"
                  className="btn btn-primary dropdown-toggle dropdown-toggle-split"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <span className="sr-only"></span>
                </button>
                <div className="dropdown-menu">
                  <button className="dropdown-item" type="button" onClick={() => {setGameType('ignitionNineMan')}}>
                    Ignition 9 Man
                  </button>
                </div>
              </div>
              <input
                type="number"
                className="form-control"
                placeholder="Small Blind"
                onChange={(e) =>
                  setTableData({
                    ...tableData,
                    smallBlind: parseInt(e.target.value),
                  })
                }
              />
              <input
                type="number"
                className="form-control"
                placeholder="Big Blind"
                onChange={(e) =>
                  setTableData({
                    ...tableData,
                    bigBlind: parseInt(e.target.value),
                  })
                }
              />
              <input
                type="number"
                className="form-control"
                placeholder="Ante"
                onChange={(e) =>
                  setTableData({ ...tableData, ante: parseInt(e.target.value) })
                }
              />
              <input
                type="number"
                className="form-control"
                placeholder="Button Position"
                min={1}
                max={playerData.length}
                value={tableData.buttonPosition}
                onChange={(e) =>
                  setTableData({
                    ...tableData,
                    buttonPosition: parseInt(e.target.value),
                  })
                }
              />
              <div className="input-group-append">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => reorderPlayerStacks()}
                >
                  {" "}
                  Solve
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-auto p-3">
          <ul className="list-group">{stacksList()}</ul>
        </div>
      </div>
    </div>
  );
}

export default App;
