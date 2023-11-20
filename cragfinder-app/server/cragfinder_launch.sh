#!/bin/bash

# Run build.sh
npm install
npm run build

cd ../client

npm install
npm run build

cd ../server
# Run the server
npm start
