# arion
arion messaging and real-time communications client

## install

First check if you have docker installed.

```
docker -v
```

If you don't have it, you'll get:

```
Command 'docker' not found, but can be installed with:
sudo apt install docker.io
```

Install docker:

```
sudo apt install docker.io
```

## run 

cd to project root:

```
docker build -t arion .
```

If you have this error message:

```
Got permission denied while trying to connect to the Docker daemon 
socket at unix:///var/run/docker.sock: 
Post http://%2Fvar%2Frun%2Fdocker.sock/v1.24/build?buildargs=%7B%7D&cachefrom=%5B%5D&cgroupparent=&cpuperiod=0&cpuquota=0&cpusetcpus=&cpusetmems=&cpushares=0&dockerfile=Dockerfile&labels=%7B%7D&memory=0&memswap=0&networkmode=default&rm=1&shmsize=0&t=arion&target=&ulimits=null&version=1: 
dial unix /var/run/docker.sock: connect: permission denied
```
follow this link

```
https://docs.docker.com/engine/install/linux-postinstall/
```

then try again

```
docker build -t arion .
```

to build the docker image and
```
docker run -it -p 8900:90 arion
```

to spin it.

now you should be able to see demo page with:

```
localhost:8900
```

or if you want to tinker with files and edit them, and see the changes on refresh, you need to link local volume to dockers nginx running directory, like this:
```
docker run -it -p 8900:90 -v /home/pasa/projects/arion/web:/usr/share/nginx/html/ arion
```