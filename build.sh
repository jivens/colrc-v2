#!/bin/bash

# if pod is already running, down it and clear out any previous containers, volumes
# podman play kube --down kube-deployment.yml
# podman container rm --all
# podman volume rm --all

# set up a rootless session
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock
systemctl enable --now --user podman.socket

# build the images
# DOCKER_BUILDKIT=0 docker-compose -f docker-compose-prod.yml build

# replace the filepaths with the production paths:  starting with colrc.sql
# cp ./misc/sql/colrc.sql ./misc/sql/colrc_custom.sql

# sed -i "s/current_setting('path\.audiofile')/'http\:\/\/thecolrc\.org\:80\/files\/files\/texts\/'/g" ./misc/sql/colrc_custom.sql
# sed -i "s/current_setting('path\.elicitationfile')/'http\:\/\/thecolrc\.org\:80\/files\/files\/elicitations\/'/g" ./misc/sql/colrc_custom.sql
# sed -i "s/current_setting('path\.textfile')/'http\:\/\/thecolrc\.org\:80\/files\/files\/texts\/'/g" ./misc/sql/colrc_custom.sql
# sed -i "s/current_setting('path\.textimage')/'http\:\/\/thecolrc\.org\:80\/files\/files\/texts\/'/g" ./misc/sql/colrc_custom.sql

# sed -i "s/http:\/\/thecolrc\.org:80\/files\/files\/texts\//http\:\/\/localhost\:80\/files\/texts\//g" ./misc/sql/colrc_custom.sql

# bring up persistent volumes and pvcs, start postgres and run the colrc.sql script, then bring it all down 
podman play kube kube-deployment-psql.yml
sleep 10
# PGPASSWORD=11chastq psql -h localhost -p 5432 -d postgres -U postgres -f ./misc/sql/setPathsProd.sql
PGPASSWORD=11chastq psql -h localhost -p 5432 -d postgres -U postgres -f ./misc/sql/colrc.sql
sleep 10

# down postgres
podman play kube --down kube-deployment-psql.yml
# sleep 10
 
# bring up backend, postgres and hasura in a single pod
podman play kube kube-deployment.yml 
# sleep 10
# PGPASSWORD=11chastq psql -h localhost -p 5432 -d postgres -U postgres -f ./misc/sql/setPathsProd.sql
