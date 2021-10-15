import "./App.css";
import React, { useState, useCallback, useRef } from "react";
import { Jumbotron, Container, Button } from "reactstrap";
import papaparse from "papaparse";
import streamSaver from "streamsaver";

function scientificToDecimal(num) {
  if (/\d+\.?\d*e[\+\-]*\d+/i.test(num)) {
    var zero = "0",
      parts = String(num).toLowerCase().split("e"),
      e = parts.pop(),
      l = Math.abs(e),
      sign = e / l,
      coeff_array = parts[0].split(".");
    if (sign === -1) {
      l = l - coeff_array[0].length;
      if (l < 0) {
        num =
          coeff_array[0].slice(0, l) +
          "." +
          coeff_array[0].slice(l) +
          (coeff_array.length === 2 ? coeff_array[1] : "");
      } else {
        num = zero + "." + new Array(l + 1).join(zero) + coeff_array.join("");
      }
    } else {
      var dec = coeff_array[1];
      if (dec) l = l - dec.length;
      if (l < 0) {
        num = coeff_array[0] + dec.slice(0, l) + "." + dec.slice(l);
      } else {
        num = coeff_array.join("") + new Array(l + 1).join(zero);
      }
    }
  }
  return String(num);
}

async function processFile(file, onFinish) {
  let writer = null;
  const encoder = new TextEncoder();
  let fileStream = streamSaver.createWriteStream(
    `${file.name.split(".").slice(0, -1).join(".")}_Art_Tracks.csv`
  );

  writer = fileStream.getWriter();
  papaparse.parse(file, {
    step: function (result) {
      if (result.data.includes("Custom ID")) {
        writer.write(encoder.encode(`${result.data}\n`));
      }
      if (result.data.includes("Art Track")) {
        var res = result.data.map(function (num) {
          return scientificToDecimal(num);
        });
        writer.write(encoder.encode(`${res}\n`));
      }
    },
    complete: function (_results, _file) {
      writer.close();
      onFinish();
    },
  });
}

function App() {
  const fileInput = useRef();

  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState(null);

  const onChooseFileClick = useCallback(() => {
    fileInput.current.click();
  }, []);

  const onFileChange = useCallback(
    (e) => {
      setFile(e.target.files[0]);
    },
    [setFile]
  );

  const startProcessing = useCallback(() => {
    setIsProcessing(true);
    processFile(file, () => setIsProcessing(false));
  }, [file]);

  return (
    <div className="App">
      <header className="App-header">
        <Container className="mt-5">
          <Jumbotron fluid>
            <Container fluid>
              <h1 className="display-3">CSV Filter</h1>
              <p className="lead">
                This tool allows you to filter rows in huge CSV files. Upload
                your file and the tool will automatically filter only{" "}
                <b>Art Tracks</b>.
              </p>
              {!isProcessing && (
                <div>
                  <p className="lead">
                    <input
                      type="file"
                      ref={fileInput}
                      accept=".csv"
                      hidden
                      onChange={onFileChange}
                    />
                    <Button
                      outline
                      color="info"
                      className="btn"
                      onClick={onChooseFileClick}
                    >
                      Choose File
                    </Button>
                    {file?.name || "No file"}
                  </p>
                  <Button
                    outline
                    color="warning"
                    className="btn"
                    onClick={startProcessing}
                    disabled={!file}
                  >
                    Process
                  </Button>
                </div>
              )}
              {isProcessing && (
                <p className="lead">
                  Downloading... Please, don't close this tab.
                </p>
              )}
            </Container>
          </Jumbotron>
        </Container>
      </header>
    </div>
  );
}

export default App;
