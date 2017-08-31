#!/bin/bash
if [[ ! -d 'dist/' ]]; then
    npm start
else
    npm run server-serve
fi