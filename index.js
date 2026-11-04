const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;
// gurt kinda dumb for this so ignore this
const sitePath = "/home/collinc/WebstormProjects/wasm.rip/";
//
app.use(express.static(sitePath));
app.get("/", (req, res) => {
    res.sendFile(path.join(sitePath, "index.html"));
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
