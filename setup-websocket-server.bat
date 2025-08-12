@echo off
echo Installing WebSocket Server Dependencies...
echo.

echo Installing express...
npm install express

echo Installing socket.io...
npm install socket.io

echo Installing cors...
npm install cors

echo Installing nodemon as dev dependency...
npm install --save-dev nodemon

echo.
echo Dependencies installed successfully!
echo.
echo To start the WebSocket server, run:
echo   node websocket-server.js
echo.
echo Or for development with auto-restart:
echo   npx nodemon websocket-server.js
echo.
pause

