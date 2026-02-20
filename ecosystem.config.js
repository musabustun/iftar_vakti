module.exports = {
    apps: [{
        name: "ezan-vakti",
        script: "./index.js",
        instances: 1,
        exec_mode: "fork",
        env: {
            NODE_ENV: "production",
            PORT: 5555
        }
    }]
}
