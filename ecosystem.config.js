module.exports = {
  apps: [
    {
      name: 'comment-control-backend',
      script: './backend/app.js',
      cwd: './backend', // PM2가 애플리케이션을 실행할 작업 디렉터리
      watch: true,
      ignore_watch: [
        'node_modules',
        '*.db',
        '*.db-journal',
        'sessions',
      ],
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};