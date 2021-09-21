# arion
arion messaging and real-time communications client

## run 

cd to project root:

```
docker build -t arion .
```
to build the docker image and
```
docker run -it -p 8900:90 arion
```

to spin it.

or if you want to tinker with files and edit them, and see the changes on refresh, you need to link local volume to dockers nginx running directory, like this:
```
docker run -it -p 8900:90 -v /home/pasa/projects/arion/web:/usr/share/nginx/html/ arion
```