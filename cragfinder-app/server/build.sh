#!/bin/bash

npm install
npm run build

cd ../client

npm install
npm run build

cd ../server
