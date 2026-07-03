const express = require("express");

const app = express();
const PORT = 12345;

// route handler
app.get("/key/:id", (req, res) => {
    const { id } = req.params;

    switch (id) {
        case "1":
            console.log("A");
            return res.send("Logged A");

        case "2":
            console.log("B");
            return res.send("Logged B");

        case "3":
            console.log("C");
            return res.send("Logged C");

        default:
            return res.status(404).send("Invalid key");
    }
});

// start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});