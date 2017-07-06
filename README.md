# discoursedb-browser
Minimalist browser for discoursedb data

Includes some javascript magic from other sources:

 A slightly hacked up version of jlAqp: 
    "RESPONSTABLE 2.0 by jordyvanraaij"

 URI.js v1.18.1 http://medialize.github.io/URI.js/
  which contains: IPv6.js, punycode.js, SecondLevelDomains.js, URI.js, URITemplate.js, jquery.URI.js 

To set this up with Node.js standalone, run in this directory:
  node http-server

To do it as https:
  openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout node_standalone_key.pem -out node_standalone_cert.pem
  http-server -S -C node_standalone_cert.pem -o
