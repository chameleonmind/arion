FROM debian:10.8-slim

USER root

RUN apt-get update
RUN apt-get install -y nginx

RUN rm -v /etc/nginx/nginx.conf
ADD nginx.conf /etc/nginx/

ADD web /usr/share/nginx/html/

RUN echo "daemon off;" >> /etc/nginx/nginx.conf

EXPOSE 90

CMD service nginx start