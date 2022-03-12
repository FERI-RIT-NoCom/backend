#!/bin/bash

heroku container:login
docker image build -t nocom-api .
heroku container:push web --app nocom-api
heroku container:release web --app nocom-api
