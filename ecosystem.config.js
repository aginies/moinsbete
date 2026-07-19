module.exports = {
  apps: [
    {
      name: "moinsbete",
      script: "npm",
      args: "run start",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
}
