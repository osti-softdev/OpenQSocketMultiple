const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { setNoCacheHeaders } = require("../security/security");

function setupStaticMiddlewares(appExpress, rootpath, OUTFOLDER_PATH) {
    appExpress.use(express.json());
    appExpress.use(cookieParser());
    appExpress.use(cors());

    appExpress.use(
        "/libs",
        express.static(path.join(rootpath, "public/libs"), {
            etag: false,
            lastModified: false,
            setHeaders: (res, filePath) => {
                setNoCacheHeaders(res);
                if (filePath.endsWith(".wasm")) {
                    res.setHeader("Content-Type", "application/wasm");
                }
            },
        })
    );

    appExpress.use(
        "/css",
        express.static(path.join(rootpath, "public/css"), {
            etag: false,
            lastModified: false,
            setHeaders: setNoCacheHeaders,
        })
    );

    appExpress.use(
        "/material-icons",
        express.static(
            path.join(rootpath, "node_modules/material-design-icons/iconfont"),
            {
                etag: false,
                lastModified: false,
                setHeaders: setNoCacheHeaders,
            }
        )
    );

    appExpress.use("/outfolder", (req, res, next) => {
        if (req.path.startsWith("/ads/")) return next(); // skip ads
        express.static(path.join(rootpath, "public/outfolder"), {
            etag: false,
            lastModified: false,
            setHeaders: setNoCacheHeaders,
        })(req, res, next);
    });

    appExpress.use(
        "/js",
        express.static(path.join(rootpath, "public/js"), {
            etag: false,
            lastModified: false,
            setHeaders: setNoCacheHeaders,
        })
    );

    appExpress.use(
        "/images",
        express.static(path.join(OUTFOLDER_PATH, "images"), {
            setHeaders: setNoCacheHeaders,
        })
    );

    appExpress.use(
        "/audio",
        express.static(path.join(OUTFOLDER_PATH, "audio"), {
            etag: false,
            lastModified: false,
            setHeaders: setNoCacheHeaders,
        })
    );
}

module.exports = { setupStaticMiddlewares };
